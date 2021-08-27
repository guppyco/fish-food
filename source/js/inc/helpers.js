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

// Get query parameter from URL string
export function getParameterByName(name, url) {
  name = name.replace(/[[\]]/g, '\\$&')
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
  const results = regex.exec(url)

  if (!results) {
    return null
  }

  if (!results[2]) {
    return ''
  }

  return results[2]
}
