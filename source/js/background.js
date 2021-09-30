import $ from 'jquery'
import browser from 'webextension-polyfill'

import {
  askToLoginNotification,
  isUserSignedIn,
  getAccountInfo,
  flipUserStatus,
} from './inc/account.js'

import {env} from './env.js'
import {getParameterByName} from './inc/helpers.js'

browser.runtime.onMessage.addListener(request => {
  if (request.message === 'login') {
    return new Promise(resolve => {
      flipUserStatus('login', request.payload).then(response => {
        resolve(response)
        saveCookie2Storage('csrftoken')
        saveCookie2Storage('sessionid')
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
        saveCookie2Storage('csrftoken')
        saveCookie2Storage('sessionid')
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
            csrftoken: response.csrftoken,
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
        // Risk: Tabs cannot be edited right now (user may be dragging a tab).
        // https://www.reddit.com/r/chrome_extensions/comments/no7igm/
        resolve({tabs})
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
    browser.tabs.create({url: env.guppyApiUrl + '/login/'})
  }

  // Refresh storage from cookies
  if (request.message === 'refreshStorage') {
    saveCookie2Storage('csrftoken')
    saveCookie2Storage('sessionid')
  }

  // Send history to Guppy
  // Must to send via background to pass cross-origin
  if (request.message === 'sendHistory') {
    $.ajax({
      url: env.guppyApiUrl + '/api/histories/',
      type: 'POST',
      data: request.payload,
      dataType: 'json',
    })
  }

  // Send search to Guppy
  // Must to send via background to pass cross-origin
  if (request.message === 'sendSearch') {
    $.ajax({
      url: env.guppyApiUrl + '/api/search/',
      type: 'POST',
      traditional: true, // Remove brackets of request data
      data: request.payload,
      dataType: 'json',
    })
  }
})

browser.notifications.onClicked.addListener(notifId => {
  if (notifId === 'askToLogin') {
    browser.tabs.create({url: env.guppyApiUrl + '/login/'})
  }
})

browser.runtime.onStartup.addListener(() => {
  // Remove flag then ask user to login when starting browser
  browser.storage.local.set({
    isAskedLogin: null,
  })
})

// Get cookies and save to storage
function saveCookie2Storage(name) {
  const domain = env.guppyApiUrl

  browser.cookies.get({
    url: domain,
    name,
  }).then(cookie => {
    const data = {}
    if (cookie && cookie.value) {
      data[name] = cookie.value
    } else {
      data[name] = false
    }

    browser.storage.local.set(data)
  })
}

saveCookie2Storage('csrftoken')
saveCookie2Storage('sessionid')

// For request from Google search results, tracking it as clicked URL,
// then redirect to site without search term flag
browser.webRequest.onBeforeRequest.addListener(
  details => {
    const searchTerm = getParameterByName('google_search_term', details.url)
    if (searchTerm) {
      // Remove search term from URL
      const baseURL = details.url.replace(
        '?google_search_term=' + searchTerm, '',
      ).replace(
        '&google_search_term=' + searchTerm, '',
      )

      // Decode search term then save to storage
      const term = decodeURIComponent(searchTerm.replace(/\+/g, ' '))

      // Send clicked URL
      $.ajax({
        url: env.guppyApiUrl + '/api/histories/',
        type: 'POST',
        data: {
          url: baseURL,
          title: null,
          last_origin: 'https://www.google.com/', // eslint-disable-line camelcase
          search_term: term, // eslint-disable-line camelcase
        },
        dataType: 'json',
      })

      return {redirectUrl: baseURL}
    }
  },
  {urls: ['<all_urls>']},
  ['blocking'],
)
