/* global chrome */

import $ from 'jquery'

import {isUserSignedIn} from './inc/account.js'

// Send page view
chrome.runtime.sendMessage(
  {
    message: 'allTabs'
  },
  response => {
    if (response && response.tabs) {
      const current = window.location.href
      // Check if current URL is a tab
      response.tabs.every(tab => {
        if (tab.url === current) {
          const referrer = document.referrer
          // Post to server
          sendPageView(tab.url, tab.title, referrer)
          return false
        }

        return true
      })
    }
  }
)

async function sendPageView(url, title, referrer) {
  return isUserSignedIn().then(response => {
    let headers = {}
    if (response.userStatus) {
      headers = {
        Authorization: 'Bearer ' + response.token
      }
    }

    $.ajax({
      url: 'http://localhost:8000/api/histories/',
      type: 'post',
      headers,
      data: {
        url,
        title,
        last_origin: referrer // eslint-disable-line camelcase
      },
      dataType: 'json',
      success: data => {
        return data
      }
    }).fail(() => {
      return false
    })
  }).catch(() => {
    return false
  })
}
