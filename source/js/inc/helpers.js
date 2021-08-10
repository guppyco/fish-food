import browser from 'webextension-polyfill'

export function getToday() {
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()

  return mm + '-' + dd + '-' + yyyy
}

export async function getCookies(name) {
  const storage = await browser.storage.local.get([name])

  return storage[name]
}
