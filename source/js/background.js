/* global chrome */

import $ from 'jquery'

import {
  isUserSignedIn,
  getAccountInfo,
  flipUserStatus
} from './inc/account.js'
import {adReplacer} from './inc/ad-replacer.js'
import {googleSearch} from './inc/scraper.js'

let count = 0
if (typeof chrome !== 'undefined') {
  // Ads replacer
  const easylist = 'https://easylist.to/easylist/easylist.txt'

  $.get(easylist).done(data => {
    const img = chrome.extension.getURL('images/placeholder.jpg')
    let didScroll = false
    const easylistLines = data.split('\n')
    const easylistSelectors = easylistLines
      .filter(line => {
        return line.startsWith('##')
      })
      .map(line => {
        return line.replace(/^##/, '')
      })
      .join(',')

    count = adReplacer(easylistSelectors, img, count)
    $(document).ready(() => {
      count = adReplacer(easylistSelectors, img, count)

      // Crawl Google search results
      googleSearch()
    })
    $(window).scroll(() => {
      didScroll = true
    })
    setInterval(() => {
      if (didScroll) {
        count = adReplacer(easylistSelectors, img, count)
        didScroll = false
      }
    }, 10000)
  })
}

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
})
