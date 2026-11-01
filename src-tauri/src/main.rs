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
    let command = app.shell().sidecar("local-bridge").map_err(|e| e.to_string())?;
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
    let command = app.shell().sidecar("local-bridge").map_err(|e| e.to_string())?;
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

#[tauri::command]
fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|_| "无效网址".to_owned())?;
    let scheme = parsed.scheme();
    if scheme != "https" {
        return Err("仅允许通过 HTTPS 打开外部网页".into());
    }
    let host = parsed.host_str().unwrap_or("");
    let allowed = [
        "github.com", "earthquake.usgs.gov", "eonet.gsfc.nasa.gov",
        "www.radio-browser.info",
    ];
    if !allowed.contains(&host) {
        return Err("当前仅开放经过确认的官方探索入口".into());
    }
    app.opener().open_url(url, None::<&str>).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            bridge_status,
            bridge_diagnostics,
            open_external,
        ])
        .run(tauri::generate_context!())
        .expect("WorldDesk launch failed");
}
