import browser from 'webextension-polyfill'

import {
  askToLoginNotification,
  isUserSignedIn,
  getAccountInfo,
  flipUserStatus,
} from './inc/account.js'

browser.runtime.onMessage.addListener(request => {
  if (request.message === 'login') {
    return new Promise(resolve => {
      flipUserStatus('login', request.payload).then(response => {
        resolve(response)
      }).catch(error => {
        resolve({
          message: 'error',
          err: error,
        })
      })
    })
  }

  if (request.message === 'logout') {
    return new Promise(resolve => {
      flipUserStatus('logout', null).then(response => {
        resolve({
          message: 'success',
          data: response,
        })
      }).catch(error => {
        resolve({
          message: 'error',
          err: error,
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
            userInfo: response.userInfo,
          })
        } else {
          resolve({
            message: 'fail',
          })
        }
      }).catch(error => {
        resolve({
          message: 'error',
          err: error,
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
            data: account,
          })
        } else {
          resolve({
            message: 'fail',
          })
        }
      }).catch(() => {
        resolve({
          message: 'error',
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

  // Ask user to login
  if (request.message === 'askToLogin') {
    return new Promise(resolve => {
      getAccountInfo().then(account => {
        if (account) {
          resolve({
            message: 'success',
            data: account,
          })
        } else {
          askToLoginNotification()
          resolve({
            message: 'fail',
          })
        }
      }).catch(() => {
        askToLoginNotification()
        resolve({
          message: 'error',
        })
      })
    })
  }

  // Open form to login to the extension
  if (request.message === 'openLoginForm') {
    browser.tabs.create({url: './html/popup_sign_in.html'})
  }
})

browser.notifications.onClicked.addListener(notifId => {
  if (notifId === 'askToLogin') {
    browser.tabs.create({url: './html/popup_sign_in.html'})
  }
})

browser.runtime.onStartup.addListener(() => {
  // Remove flag then ask user to login when starting browser
  browser.storage.local.set({
    isAskedLogin: null,
  })
})
