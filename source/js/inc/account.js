import $ from 'jquery'
import browser from 'webextension-polyfill'

import {env} from '../env.js'
import {getToday, getCookies} from './helpers.js'

export async function flipUserStatus(action, userInfo) {
  if (action === 'login') {
    try {
      const response = await $.ajax({
        url: env.guppyApiUrl + '/api/login/',
        type: 'POST',
        data: {
          username: userInfo.email,
          password: userInfo.pass,
        },
        dataType: 'json',
      })

      if (response.csrf_token) {
        if (browser.runtime.lastError) {
          return 'fail'
        }

        return 'success'
      }

      return 'fail'
    } catch {
      return 'fail'
    }
  }

  if (action === 'logout') {
    const cookie = await getCookies('csrftoken')

    if (browser.runtime.lastError || !cookie) {
      return 'fail'
    }

    try {
      const ajax = await $.ajax({
        url: env.guppyApiUrl + '/logout/',
        type: 'GET',
        dataType: 'json',
      })

      if (!ajax || browser.runtime.lastError) {
        return 'fail'
      }

      return 'success'
    } catch {
      if (browser.runtime.lastError) {
        return 'fail'
      }

      return 'success'
    }
  }
}

export async function isUserSignedIn() {
  const csrftoken = await getCookies('csrftoken')
  const sessionid = await getCookies('sessionid')

  if (browser.runtime.lastError) {
    return (
      {
        userStatus: false, csrftoken: '',
      }
    )
  }

  if (!csrftoken || !sessionid) {
    return ({
      userStatus: false, csrftoken: '',
    })
  }

  return (
    {
      userStatus: true,
      csrftoken,
    }
  )
}

export async function getAccountInfo() {
  try {
    const isSignedIn = await isUserSignedIn()
    if (isSignedIn.userStatus) {
      try {
        const ajax = await $.ajax({
          url: env.guppyApiUrl + '/api/account/',
          type: 'GET',
          dataType: 'json',
        })

        return ajax
      } catch {
        // Logout
        flipUserStatus('logout', null)
        return false
      }
    } else {
      return false
    }
  } catch {
    return false
  }
}

export async function askToLoginNotification() {
  const today = getToday()

  const storage = await browser.storage.local.get(['isAskedLogin'])
  // Show notification one time per day
  if (!storage.isAskedLogin || storage.isAskedLogin !== today) {
    const opt = {
      type: 'basic',
      iconUrl: './images/icon.png',
      title: 'Login to Guppy',
      message: 'You aren\'t logged into your Guppy account - '
        + 'You\'ll be missing out on cash back rewards until you login. '
        + 'Please click to login to Guppy',
    }

    browser.notifications.create('askToLogin', opt)
  }
}
