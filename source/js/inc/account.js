/* global chrome */

import $ from 'jquery'

import {env} from '../env.js'
import {getToday} from './helpers.js'

export function flipUserStatus(signIn, userInfo) {
  if (signIn) {
    return new Promise(resolve => {
      $.ajax({
        url: env.guppyApiUrl + '/api/token-auth/',
        type: 'post',
        data: {
          email: userInfo.email,
          password: userInfo.pass
        },
        dataType: 'json'
      }).done(response => {
        if (response.token) {
          chrome.storage.local.set({
            userStatus: signIn,
            token: response,
            userInfo: userInfo.email
          }, () => {
            if (chrome.runtime.lastError) {
              resolve('fail')
            } else {
              resolve('success')
            }
          })
        } else {
          resolve('fail')
        }
      }).fail(error => {
        resolve('fail')
        console.log(error)
      })
    })
  }

  // Fetch the /logout/ route
  return new Promise(resolve => {
    chrome.storage.local.get(['userStatus', 'token', 'userInfo'], response => {
      if (chrome.runtime.lastError) {
        resolve('fail')
      }

      if (response.userStatus === undefined) {
        resolve('fail')
      }

      $.ajax({
        url: env.guppyApiUrl + '/api/token-destroy/',
        type: 'post',
        headers: {
          Authorization: 'Bearer ' + response.token.token
        },
        dataType: 'json'
      }).done(response => {
        if (!response) {
          resolve('fail')
        }

        chrome.storage.local.set({
          userStatus: false, userInfo: {}
        }, () => {
          if (chrome.runtime.lastError) {
            resolve('fail')
          }

          resolve('success')
        })
      }).fail(error => {
        chrome.storage.local.set({
          userStatus: false, userInfo: {}
        }, () => {
          if (chrome.runtime.lastError) {
            resolve('fail')
          }

          resolve('success')
        })
        console.log(error)
      })
    })
  })
}

export function isUserSignedIn() {
  return new Promise(resolve => {
    chrome.storage.local.get(['userStatus', 'token', 'userInfo'], response => {
      if (chrome.runtime.lastError) {
        resolve(
          {
            userStatus: false, userInfo: {}
          }
        )
      }

      resolve(
        response.userStatus === undefined ?
          {
            userStatus: false, userInfo: {}
          } :
          {
            userStatus: response.userStatus,
            token: response.token.token,
            userInfo: response.userInfo
          }
      )
    })
  })
}

export function getAccountInfo() {
  return new Promise(resolve => {
    isUserSignedIn().then(response => {
      if (response.userStatus) {
        $.ajax({
          url: env.guppyApiUrl + '/api/account/',
          type: 'get',
          headers: {
            Authorization: 'Bearer ' + response.token
          },
          dataType: 'json',
          success: data => {
            resolve(data)
          }
        }).fail(() => {
          // Logout
          flipUserStatus(false, null)
          resolve(false)
        })
      } else {
        resolve(false)
      }
    }).catch(() => {
      resolve(false)
    })
  })
}

export function askToLoginNotification() {
  const today = getToday()
  chrome.storage.local.get(['isAskedLogin'], response => {
    // Show notification one time per day
    if (!response.isAskedLogin || response.isAskedLogin !== today) {
      const opt = {
        type: 'basic',
        iconUrl: './images/icon.png',
        title: 'Login to Guppy',
        message: 'You aren\'t logged into your Guppy account - ' +
          'You\'ll be missing out on cash back rewards until you login. ' +
          'Please click to login to Guppy'
      }

      chrome.notifications.create('askToLogin', opt, () => {})
    }
  })
}
