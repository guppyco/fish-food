/* global chrome */

import $ from 'jquery'

import {env} from './env.js'
import {adReplacer} from './inc/ad-replacer.js'
import {googleSearch} from './inc/scraper.js'

import {isUserSignedIn} from './inc/account.js'

let count = 0
if (typeof chrome !== 'undefined') {
  // Ads replacer
  $.get(env.easylist).done(data => {
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
      url: env.guppyApiUrl + '/api/histories/',
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
