//! WorldDesk owns the user experience. Local Bridge is an independently built sidecar
//! for generic OS-user-local capabilities. No global services, registration,
//! model invocation or sensitive providers are enabled just by opening WorldDesk.
use serde::Serialize;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
struct BridgeReport {
    bundled: bool,
    version: String,
    info: String,
}

#[tauri::command]
async fn bridge_status(app: tauri::AppHandle) -> Result<BridgeReport, String> {
    let command = app
        .shell()
        .sidecar("local-bridge")
        .map_err(|e| e.to_string())?;
    let result = command
        .args(["--version"])
        .output()
        .await
        .map_err(|e| e.to_string())?;
    if !result.status.success() {
        return Ok(BridgeReport {
            bundled: false,
            version: String::new(),
            info: "本机组件未能启动；世界探索仍可继续".into(),
        });
    }
    let version = String::from_utf8_lossy(&result.stdout).trim().to_string();
    Ok(BridgeReport {
        bundled: true,
        version,
        info: "Local Bridge 已包含在此安装包；不会自动启用本地工具或通讯读取".into(),
    })
}

#[tauri::command]
async fn bridge_diagnostics(app: tauri::AppHandle) -> Result<String, String> {
    let command = app
        .shell()
        .sidecar("local-bridge")
        .map_err(|e| e.to_string())?;
    let result = command
        .args(["self-test"])
        .output()
        .await
        .map_err(|e| e.to_string())?;
    let raw = String::from_utf8_lossy(&result.stdout);
    if result.status.success() {
        Ok(raw.chars().take(6000).collect())
    } else {
        Err("Local Bridge 自检未完成；不会影响世界探索功能".into())
    }
}

// Query fixed flight sources directly from the desktop, without an application server.
// The caller can choose a center and a bounded radius;
// neither the endpoint nor the model can execute arbitrary native requests.
#[tauri::command]
async fn flight_snapshot(
    lat: f64,
    lon: f64,
    dist: u32,
    provider: Option<String>,
) -> Result<serde_json::Value, String> {
    if !lat.is_finite()
        || !lon.is_finite()
        || lat.abs() > 90.0
        || lon.abs() > 180.0
        || dist < 5
        || dist > 250
    {
        return Err("Invalid aircraft query region".into());
    }
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("WorldDesk/0.1.0-preview (+https://github.com/CoBeing/worlddesk)")
        .build()
        .map_err(|_| "Unable to initialize aircraft source".to_string())?;
    let provider = provider.as_deref().unwrap_or("adsb.lol");
    let endpoint = match provider {
        "adsb.lol" => format!("https://api.adsb.lol/v2/lat/{lat:.4}/lon/{lon:.4}/dist/{dist}"),
        "adsb.fi" => {
            format!("https://opendata.adsb.fi/api/v3/lat/{lat:.4}/lon/{lon:.4}/dist/{dist}")
        }
        "fr24" => {
            let dy = dist as f64 / 60.0;
            let dx = (dy / lat.to_radians().cos().max(0.1)).min(180.0);
            format!("https://data-cloud.flightradar24.com/zones/fcgi/feed.js?bounds={:.4},{:.4},{:.4},{:.4}&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=0&estimated=0&maxage=120&limit=500",
                (lat+dy).min(90.0), (lat-dy).max(-90.0), (lon-dx).max(-180.0), (lon+dx).min(180.0))
        }
        _ => return Err("Unsupported aircraft source".into()),
    };
    let mut response = client
        .get(endpoint)
        .send()
        .await
        .map_err(|_| "Aircraft source is unavailable".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "Aircraft source returned HTTP {}",
            response.status().as_u16()
        ));
    }
    // Cap untrusted feed size; the snapshot remains memory-only and is not
    // cached or used for safety-critical decisions.
    let mut body = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|_| "Could not read aircraft data".to_string())?
    {
        if body.len() + chunk.len() > 2_000_000 {
            return Err("Aircraft source response too large".into());
        }
        body.extend_from_slice(&chunk);
    }
    let raw: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|_| "Aircraft source returned invalid JSON".to_string())?;
    if provider == "fr24" {
        if raw.get("version").and_then(|v| v.as_u64()) != Some(4) {
            return Err("Unsupported FR24 format".into());
        }
        return Ok(raw);
    }
    let mut filtered = Vec::new();
    if let Some(aircraft) = raw.get("ac").and_then(|a| a.as_array()) {
        for row in aircraft.iter().take(1200) {
            let Some(lat) = row.get("lat").and_then(|v| v.as_f64()) else {
                continue;
            };
            let Some(lon) = row.get("lon").and_then(|v| v.as_f64()) else {
                continue;
            };
            if lat.abs() > 90.0 || lon.abs() > 180.0 {
                continue;
            }
            let fields = [
                "hex", "flight", "lat", "lon", "alt_baro", "gs", "track", "seen_pos", "r", "t",
            ];
            let mut out = serde_json::Map::new();
            for key in fields {
                if let Some(value) = row.get(key) {
                    out.insert(key.into(), value.clone());
                }
            }
            filtered.push(serde_json::Value::Object(out));
        }
    }
    Ok(serde_json::json!({
        "now": raw.get("now").and_then(|v| v.as_f64()),
        "total": raw.get("total").and_then(|v| v.as_u64()),
        "ac": filtered,
        "provider": provider,
        "license": if provider == "adsb.lol" { "ODbL 1.0" } else { "Personal non-commercial use" }
    }))
}

// Callsign metadata only; no arbitrary URL or private credential is accepted.
#[tauri::command]
async fn flight_route(callsign: String) -> Result<serde_json::Value, String> {
    if !(2..=10).contains(&callsign.len())
        || !callsign
            .bytes()
            .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())
    {
        return Err("Invalid callsign".into());
    }
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|e| e.to_string())?;
    let mut response = client
        .get(format!("https://api.adsbdb.com/v0/callsign/{callsign}"))
        .send()
        .await
        .map_err(|_| "Route source unavailable".to_string())?
        .error_for_status()
        .map_err(|_| "Route unavailable".to_string())?;
    let mut bytes = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|_| "Invalid route response".to_string())?
    {
        if bytes.len() + chunk.len() > 64000 {
            return Err("Route response too large".into());
        }
        bytes.extend_from_slice(&chunk);
    }
    serde_json::from_slice(&bytes).map_err(|_| "Invalid route JSON".to_string())
}

#[tauri::command]
fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|_| "无效网址".to_owned())?;
    let scheme = parsed.scheme();
    if scheme != "https" {
        return Err("仅允许通过 HTTPS 打开外部网页".into());
    }
    let host = parsed.host_str().unwrap_or("");
    let allowed = [
        "github.com",
        "earthquake.usgs.gov",
        "eonet.gsfc.nasa.gov",
        "www.radio-browser.info",
        "commons.wikimedia.org",
        "epic.gsfc.nasa.gov",
        "www.data.jma.go.jp",
        "www.adsb.lol",
        "www.flightradar24.com",
        "adsb.fi",
        "www.adsbdb.com",
        "www.hko.gov.hk",
    ];
    if !allowed.contains(&host) {
        return Err("当前仅开放经过确认的官方探索入口".into());
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            bridge_status,
            bridge_diagnostics,
            flight_snapshot,
            flight_route,
            open_external,
        ])
        .run(tauri::generate_context!())
        .expect("WorldDesk launch failed");
}

#[cfg(test)]
mod tests {
    #[test]
    fn rejects_invalid_queries_without_network() {
        assert!(
            tauri::async_runtime::block_on(super::flight_snapshot(91.0, 0.0, 230, None)).is_err()
        );
        assert!(tauri::async_runtime::block_on(super::flight_snapshot(
            0.0,
            0.0,
            230,
            Some("unknown".into())
        ))
        .is_err());
        assert!(tauri::async_runtime::block_on(super::flight_route("../etc".into())).is_err());
    }
    #[test]
    #[ignore = "live desktop-direct FR24 integration"]
    fn fr24_direct_live_smoke() {
        let response = tauri::async_runtime::block_on(super::flight_snapshot(
            31.23,
            121.47,
            60,
            Some("fr24".into()),
        ))
        .unwrap();
        assert_eq!(response["version"], 4);
        assert!(response
            .as_object()
            .unwrap()
            .values()
            .any(|v| v.as_array().is_some_and(|a| a.len() >= 17)));
    }
    #[test]
    #[ignore = "live provider integration"]
    fn secondary_source_and_route_live_smoke() {
        let response = tauri::async_runtime::block_on(super::flight_snapshot(
            51.47,
            -0.45,
            10,
            Some("adsb.fi".into()),
        ))
        .unwrap();
        assert_eq!(response["provider"], "adsb.fi");
        assert!(!response["ac"].as_array().unwrap().is_empty());
        let route = tauri::async_runtime::block_on(super::flight_route("BAW123".into())).unwrap();
        assert_eq!(
            route["response"]["flightroute"]["origin"]["iata_code"],
            "LHR"
        );
    }

    #[test]
    #[ignore = "uses a live third-party ADS-B API; run manually during preview verification"]
    fn aircraft_source_live_smoke() {
        let response =
            tauri::async_runtime::block_on(super::flight_snapshot(31.2304, 121.4737, 230, None))
                .expect("ADSB.lol should return a valid snapshot");
        assert_eq!(response["provider"], "adsb.lol");
        assert!(response["ac"].as_array().is_some());
    }
}
