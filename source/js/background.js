import {
  isUserSignedIn,
  getAccountInfo,
  flipUserStatus
} from './inc/account.js'

const browser = require('webextension-polyfill')

browser.runtime.onMessage.addListener(request => {
  if (request.message === 'login') {
    return new Promise(resolve => {
      flipUserStatus('login', request.payload).then(response => {
        resolve(response)
      }).catch(error => {
        resolve({
          message: 'error',
          err: error
        })
      })
    })
  }

  if (request.message === 'logout') {
    return new Promise(resolve => {
      flipUserStatus('logout', null).then(response => {
        resolve({
          message: 'success',
          data: response
        })
      }).catch(error => {
        resolve({
          message: 'error',
          err: error
        })
      })
    })
  }

  if (request.message === 'userStatus') {
    return new Promise(resolve => {
      isUserSignedIn().then(response => {
        if (response.userStatus) {
          resolve({
            message: 'success',
            userInfo: response.userInfo
          })
        } else {
          resolve({
            message: 'fail'
          })
        }
      }).catch(error => {
        resolve({
          message: 'error',
          err: error
        })
      })
    })
  }

  if (request.message === 'userAccount') {
    return new Promise(resolve => {
      getAccountInfo().then(account => {
        if (account) {
          resolve({
            message: 'success',
            data: account
          })
        } else {
          resolve({
            message: 'fail'
          })
        }
      }).catch(() => {
        resolve({
          message: 'error'
        })
      })
    })
  }

  // Get all tabs
  if (request.message === 'allTabs') {
    const queryOptions = {}
    return new Promise(resolve => {
      browser.tabs.query(queryOptions).then(tabs => {
        // Fix Tabs cannot be edited right now (user may be dragging a tab).
        // https://www.reddit.com/r/chrome_extensions/comments/no7igm/
        setTimeout(() => {
          resolve({tabs})
        }, 500)
      })
    })
  }
})
