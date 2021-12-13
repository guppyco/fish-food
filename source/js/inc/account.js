import browser from 'webextension-polyfill'

import {env} from '../env.js'
import {getThisYear, getCookies} from './helpers.js'

export async function flipUserStatus(action, userInfo) {
  if (action === 'login') {
    try {
      const response = await fetch(env.guppyApiUrl + '/api/login/', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userInfo.email,
          password: userInfo.pass,
        }),
      })

      const data = await response.json()

      if (data.csrf_token) {
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
      const ajax = await fetch(env.guppyApiUrl + '/logout/', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
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
        const ajax = await fetch(env.guppyApiUrl + '/api/account/', {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        return await ajax.json()
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
  const thisYear = getThisYear()

  const storage = await browser.storage.local.get(['isAskedLogin'])
  // Show notification one time per year
  if (!storage.isAskedLogin || storage.isAskedLogin !== thisYear) {
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
