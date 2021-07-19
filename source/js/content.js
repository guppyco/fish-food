import $ from 'jquery'

import {env} from './env.js'
import {adReplacer} from './inc/ad-replacer.js'
import {googleSearch} from './inc/scraper.js'

import {isUserSignedIn} from './inc/account.js'
import {getToday} from './inc/helpers.js'

const browser = require('webextension-polyfill')

let count = 0
if (typeof browser !== 'undefined') {
  // Ads replacer
  $.get(env.easylist).done(data => {
    const img = browser.extension.getURL('images/placeholder.jpg')
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
browser.runtime.sendMessage({message: 'allTabs'}).then(response => {
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
})

// Check if user is logged in, ask if not
browser.runtime.sendMessage({message: 'askToLogin'}).then(response => {
  if (!response || !response.message || response.message !== 'success') {
    // Save is asked flag
    const today = getToday()
    browser.storage.local.set({
      isAskedLogin: today
    })

    // Ask user login via HTML banner
    askToLoginHtml()
  }
})

async function sendPageView(url, title, referrer) {
  try {
    const isSignedIn = await isUserSignedIn()
    let headers = {}
    if (isSignedIn.userStatus) {
      headers = {
        Authorization: 'Bearer ' + isSignedIn.token
      }
    }

    try {
      const ajax = await $.ajax({
        url: env.guppyApiUrl + '/api/histories/',
        type: 'post',
        headers,
        data: {
          url,
          title,
          last_origin: referrer // eslint-disable-line camelcase
        },
        dataType: 'json'
      })

      return ajax
    } catch {
      return false
    }
  } catch {
    return false
  }
}

async function askToLoginHtml() {
  const today = getToday()

  const storage = await browser.storage.local.get(['isAskedLoginHtml'])
  // Show notification one time per day
  if (!storage.isAskedLoginHtml || storage.isAskedLoginHtml !== today) {
    const div = document.createElement('div')
    div.className = 'guppy-ask-to-login-banner'
    const div2 = document.createElement('div')
    div2.className = 'main'
    const div3 = document.createElement('div')
    div3.className = 'text'
    const message = document.createElement('a')
    message.className = 'message'
    message.textContent = 'You aren\'t logged into your Guppy account - ' +
      'You\'ll be missing out on cash back rewards until you login. ' +
      'Please click to login to Guppy'
    message.addEventListener('click', () => {
      browser.runtime.sendMessage({
        message: 'openLoginForm'
      })
    })

    const remove = document.createElement('a')
    remove.className = 'remove'
    remove.textContent = 'x'
    remove.addEventListener('click', () => {
      div.style.display = 'none'

      browser.storage.local.set({
        isAskedLoginHtml: today
      })
    })

    div3.append(message)
    div2.append(div3)
    div2.append(remove)
    div.append(div2)

    document.body.append(div)
  }
}
