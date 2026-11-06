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

// Query a single, fixed open-data ADS-B provider. This intentionally is not
// a Flightradar24 scrape. The caller can choose a center and a bounded radius;
// neither the endpoint nor the model can execute arbitrary native requests.
#[tauri::command]
async fn flight_snapshot(lat: f64, lon: f64, dist: u32) -> Result<serde_json::Value, String> {
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
        .timeout(std::time::Duration::from_secs(10))
        .user_agent("WorldDesk/0.1.0-preview (+https://github.com/CoBeing/worlddesk)")
        .build()
        .map_err(|_| "Unable to initialize aircraft source".to_string())?;
    let endpoint = format!("https://api.adsb.lol/v2/lat/{lat:.4}/lon/{lon:.4}/dist/{dist}");
    let response = client
        .get(endpoint)
        .send()
        .await
        .map_err(|_| "ADSB.lol source is unavailable".to_string())?;
    if !response.status().is_success() {
        return Err(format!(
            "Aircraft source returned HTTP {}",
            response.status().as_u16()
        ));
    }
    // Cap untrusted feed size; the snapshot remains memory-only and is not
    // cached or used for safety-critical decisions.
    let body = response
        .bytes()
        .await
        .map_err(|_| "Could not read aircraft data".to_string())?;
    if body.len() > 2_000_000 {
        return Err("Aircraft source response too large".into());
    }
    let raw: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|_| "Aircraft source returned invalid JSON".to_string())?;
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
        "provider": "adsb.lol",
        "license": "ODbL 1.0"
    }))
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
        .invoke_handler(tauri::generate_handler![
            bridge_status,
            bridge_diagnostics,
            flight_snapshot,
            open_external,
        ])
        .run(tauri::generate_context!())
        .expect("WorldDesk launch failed");
}

#[cfg(test)]
mod tests {
    #[test]
    #[ignore = "uses a live third-party ADS-B API; run manually during preview verification"]
    fn aircraft_source_live_smoke() {
        let response =
            tauri::async_runtime::block_on(super::flight_snapshot(31.2304, 121.4737, 230))
                .expect("ADSB.lol should return a valid snapshot");
        assert_eq!(response["provider"], "adsb.lol");
        assert!(response["ac"].as_array().is_some());
    }
}
