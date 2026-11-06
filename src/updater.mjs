import { isTauri } from '@tauri-apps/api/core'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

// Updates never interrupt exploration or listening. Installation is user initiated.
export function mountUpdater({ native = isTauri, checkUpdate = check, restart = relaunch } = {}) {
  if (!native()) return
  const button = document.createElement('button')
  button.className = 'bridge-action'
  button.hidden = true
  button.setAttribute('aria-live', 'polite')
  document.querySelector('.nav-bottom')?.before(button)
  let update, busy = false, installed = false
  const checkNow = async () => {
    if (busy || update || document.hidden || !navigator.onLine) return
    busy = true
    try {
      update = await checkUpdate({ timeout: 15000 })
      if (update) {
        button.hidden = false
        button.textContent = `更新至 ${update.version}`
      }
    } catch { /* Quietly retry at the next scheduled check. */ }
    finally { busy = false }
  }
  button.onclick = async () => {
    if (busy) return
    busy = true
    button.disabled = true
    try {
      if (installed) { await restart(); return }
      let received = 0, total = 0
      button.textContent = '正在下载更新…'
      await update.downloadAndInstall(event => {
        if (event.event === 'Started') total = event.data.contentLength || 0
        if (event.event === 'Progress') {
          received += event.data.chunkLength
          button.textContent = total ? `下载更新 ${Math.min(100, Math.round(received / total * 100))}%` : '正在下载更新…'
        }
        if (event.event === 'Finished') button.textContent = '正在安装更新…'
      })
      installed = true
      button.textContent = '重启使用新版'
    } catch { button.textContent = installed ? '重启失败，点击重试' : '更新失败，点击重试' }
    finally { busy = false; button.disabled = false }
  }
  setTimeout(checkNow, 10000)
  setInterval(checkNow, 6 * 60 * 60 * 1000)
}
