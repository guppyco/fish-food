import browser from 'webextension-polyfill'
import * as Sentry from '@sentry/browser'

import {env} from '../env.js'

export function setupSentry() {
  let environment = null
  if (env.guppyApiUrl === 'https://guppy.co') {
    environment = 'ext-production'
  } else if (env.guppyApiUrl === 'https://staging.guppy.co') {
    environment = 'ext-staging'
  }

  if (environment !== null) {
    Sentry.init({
      dsn: env.sentryDSN,
      environment,
    })
  }
}

export function getToday() {
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()

  return mm + '-' + dd + '-' + yyyy
}

export function getThisYear() {
  const today = new Date()

  return today.getFullYear().toString()
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

// Get the extension version
export async function getVersion() {
  const manifestData = browser.runtime.getManifest()
  let environment = 'production'
  if (env.guppyApiUrl.includes('localhost')) {
    environment = 'localhost'
  }

  if (env.guppyApiUrl.includes('staging')) {
    environment = 'staging'
  }

  return {
    version: manifestData.version,
    env: environment,
    url: env.guppyApiUrl,
  }
}
