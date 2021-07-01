/* global chrome */

import $ from 'jquery'

import {env} from './env.js'
import {adReplacer} from './inc/ad-replacer.js'
import {googleSearch} from './inc/scraper.js'

import {isUserSignedIn} from './inc/account.js'
import {getToday} from './inc/helpers.js'

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

// Check if user is logged in, ask if not
chrome.runtime.sendMessage(
  {
    message: 'askToLogin'
  },
  response => {
    if (!response || !response.message || response.message !== 'success') {
      // Save is asked flag
      const today = getToday()
      chrome.storage.local.set({
        isAskedLogin: today
      })

      // Ask user login via HTML banner
      askToLoginHtml()
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

function askToLoginHtml() {
  const today = getToday()

  chrome.storage.local.get(['isAskedLoginHtml'], response => {
    // Show notification one time per day
    if (!response.isAskedLoginHtml || response.isAskedLoginHtml !== today) {
      let div = document.createElement('div')
      div.className = 'guppy-ask-to-login-banner'
      let div2 = document.createElement('div')
      div2.className = 'main'
      let div3 = document.createElement('div')
      div3.className = 'text'
      let message = document.createElement('a')
      message.className = 'message'
      message.textContent = 'You aren\'t logged into your Guppy account - ' +
        'You\'ll be missing out on cash back rewards until you login. ' +
        'Please click to login to Guppy'
      message.onclick = () => {
        chrome.runtime.sendMessage({
            message: 'openLoginForm'
          }
        )
      }
      let remove = document.createElement('a')
      remove.className = 'remove'
      remove.textContent = 'x'
      remove.onclick = () => {
        div.style.display = 'none'

        chrome.storage.local.set({
          isAskedLoginHtml: today
        })
      }

      div3.appendChild(message)
      div2.appendChild(div3)
      div2.appendChild(remove)
      div.appendChild(div2)

      document.body.appendChild(div)
    }
  })
}
