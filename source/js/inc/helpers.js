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

// Update storage when toggling the button
export async function toggleAdsReplacer() {
  const denyList = await getDenyList()
  const currentDomain = await getDomainFromUrl()
  const index = denyList.indexOf(currentDomain)

  if (this.checked && index === -1) {
    denyList.push(currentDomain)
  } else if (!this.checked && index > -1) {
    denyList.splice(index, 1)
  }

  // Update storage
  browser.storage.local.set({denyList})
}

// Check if the current site is disabled
export async function isAdsReplacerDisabled(domain = null) {
  if (domain === null) {
    domain = await getDomainFromUrl()
  }

  const denyList = await getDenyList()

  if (denyList && denyList.includes(domain)) {
    return true
  }

  return false
}

// Get the list of ads replacer disabled sites
export async function getDenyList() {
  let denyList = []
  const storage = await browser.storage.local.get(['denyList'])
  if (storage.denyList && Array.isArray(storage.denyList)) {
    denyList = storage.denyList
  }

  return denyList
}

// Get the domain from an URL
export async function getDomainFromUrl(url = null) {
  if (url === null) {
    // The default URL is the current tab
    url = await getCurrentTab()
  }

  if (url) {
    return (new URL(url)).hostname
  }

  return ''
}

// Get the current tab URL
export async function getCurrentTab() {
  const tabs = await browser.tabs.query({active: true, currentWindow: true})

  if (tabs[0] && tabs[0].url) {
    return tabs[0].url
  }

  return ''
}
