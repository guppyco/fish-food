import $ from 'jquery'

import {env} from '../env.js'
import {getToday} from './helpers.js'

const browser = require('webextension-polyfill')

export async function flipUserStatus(action, userInfo) {
  if (action === 'login') {
    try {
      const response = await $.ajax({
        url: env.guppyApiUrl + '/api/token-auth/',
        type: 'post',
        data: {
          email: userInfo.email,
          password: userInfo.pass
        },
        dataType: 'json'
      })

      if (response.token) {
        await browser.storage.local.set({
          userStatus: true,
          token: response,
          userInfo: userInfo.email
        })

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
    const storage = await browser.storage.local.get(['userStatus', 'token', 'userInfo'])

    if (browser.runtime.lastError || storage.userStatus === undefined) {
      return 'fail'
    }

    try {
      const ajax = await $.ajax({
        url: env.guppyApiUrl + '/api/token-destroy/',
        type: 'post',
        headers: {
          Authorization: 'Bearer ' + storage.token.token
        },
        dataType: 'json'
      })

      if (!ajax) {
        return 'fail'
      }

      await browser.storage.local.set({
        userStatus: false, userInfo: {}
      })

      if (browser.runtime.lastError) {
        return 'fail'
      }

      return 'success'
    } catch {
      await browser.storage.local.set({
        userStatus: false, userInfo: {}
      })

      if (browser.runtime.lastError) {
        return 'fail'
      }

      return 'success'
    }
  }
}

export async function isUserSignedIn() {
  const storage = await browser.storage.local.get(['userStatus', 'token', 'userInfo'])

  if (browser.runtime.lastError) {
    return (
      {
        userStatus: false, userInfo: {}
      }
    )
  }

  if (storage.userStatus === undefined) {
    return ({
      userStatus: false, userInfo: {}
    })
  }

  return (
    {
      userStatus: storage.userStatus,
      token: storage.token.token,
      userInfo: storage.userInfo
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
          type: 'get',
          headers: {
            Authorization: 'Bearer ' + isSignedIn.token
          },
          dataType: 'json'
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
      message: 'You aren\'t logged into your Guppy account - ' +
        'You\'ll be missing out on cash back rewards until you login. ' +
        'Please click to login to Guppy'
    }

    browser.notifications.create('askToLogin', opt)
  }
}
