import browser from 'webextension-polyfill'
import {env} from '../env.js'

export function getToday() {
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const yyyy = today.getFullYear()

  return mm + '-' + dd + '-' + yyyy
}

export async function getCookies(name) {
  const domain = env.guppyApiUrl
  if (typeof browser.cookies !== 'undefined') {
    const cookie = await browser.cookies.get({url: domain, name})

    if (cookie && cookie.value) {
      return cookie.value
    }
  }

  return false
}
