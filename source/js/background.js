/* global chrome */

import {
  isUserSignedIn,
  getAccountInfo,
  flipUserStatus
} from './inc/account.js'

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'login') {
    flipUserStatus(true, request.payload)
      .then(response => {
        sendResponse(response)
      })
      .catch(error => {
        sendResponse({
          message: 'error',
          err: error
        })
      })

    return true
  }

  if (request.message === 'logout') {
    flipUserStatus(false, null)
      .then(response => {
        sendResponse({
          message: 'success',
          data: response
        })
      })
      .catch(error => {
        sendResponse({
          message: 'error',
          err: error
        })
      })

    return true
  }

  if (request.message === 'userStatus') {
    isUserSignedIn()
      .then(response => {
        if (response.userStatus) {
          sendResponse({
            message: 'success',
            userInfo: response.userInfo
          })
        } else {
          sendResponse({
            message: 'fail'
          })
        }
      })
      .catch(error => {
        sendResponse({
          message: 'error',
          err: error
        })
      })
    return true
  }

  if (request.message === 'userAccount') {
    getAccountInfo()
      .then(account => {
        if (account) {
          sendResponse({
            message: 'success',
            data: account
          })
        } else {
          sendResponse({
            message: 'fail'
          })
        }
      })
      .catch(() => {
        sendResponse({
          message: 'error'
        })
      })

    return true
  }

  // Get all tabs
  if (request.message === 'allTabs') {
    const queryOptions = {}
    chrome.tabs.query(queryOptions, tabs => {
      // Fix Tabs cannot be edited right now (user may be dragging a tab).
      // https://www.reddit.com/r/chrome_extensions/comments/no7igm/
      setTimeout(() => {
        sendResponse({tabs})
      }, 500)
    })

    return true
  }
})
