import $ from 'jquery'
import browser from 'webextension-polyfill'

import {env} from './env.js'
import {adReplacer} from './inc/ad-replacer.js'
import {googleSearch} from './inc/scraper.js'

import {getThisYear} from './inc/helpers.js'

let count = 0
if (typeof browser !== 'undefined') {
  // Ads replacer
  $.get(env.easylist).done(data => {
    let didScroll = false
    const easylistLines = data.split('\n')
    const easylistSelectors = easylistLines.filter(line => (
      line.startsWith('##')
    )).map(line => (
      line.replace(/^##/, '')
    )).join(',')

    count = adReplacer(easylistSelectors, count, browser)
    $(document).ready(() => {
      count = adReplacer(easylistSelectors, count, browser)

      // Crawl Google search results
      googleSearch()
    })
    $(window).scroll(() => {
      didScroll = true
    })
    setInterval(() => {
      if (didScroll) {
        count = adReplacer(easylistSelectors, count, browser)
        didScroll = false
      }
    }, 10_000)
  })
}

// Check if user is logged in, ask if not
browser.runtime.sendMessage({message: 'askToLogin'}).then(response => {
  if (!response || !response.message || response.message !== 'success') {
    // Save is asked popup notification flag
    const thisYear = getThisYear()
    browser.storage.local.set({
      isAskedLogin: thisYear,
    })

    // Ask user login via HTML banner
    const currentDomain = window.location.hostname
    const ignoredSites = [
      'localhost',
      'staging.guppy.co',
      'guppy.co',
    ]
    // Do not show HTML banner for guppy sites
    if (ignoredSites.includes(currentDomain)) {
      return
    }

    browser.runtime.sendMessage({message: 'allTabs'}).then(response => {
      if (response && response.tabs) {
        const current = window.location.href
        // Check if current URL is a tab
        response.tabs.every(tab => {
          // Only show the HTML banner for current page
          // To prevent showing on iframes
          if (tab.url === current) {
            askToLoginHtml()
            return false
          }

          return true
        })
      }
    })
  }
})

async function askToLoginHtml() {
  const thisYear = getThisYear()

  const storage = await browser.storage.local.get(['isAskedLoginHtml'])
  // Show notification one time per year
  if (!storage.isAskedLoginHtml || storage.isAskedLoginHtml !== thisYear) {
    const div = document.createElement('div')
    div.className = 'guppy-ask-to-login-banner'
    const div2 = document.createElement('div')
    div2.className = 'guppy-main'
    const div3 = document.createElement('div')
    div3.className = 'guppy-text'
    const message = document.createElement('a')
    message.className = 'guppy-message'
    message.textContent = 'You aren\'t logged into your Guppy account - '
      + 'You\'ll be missing out on cash back rewards until you login. '
      + 'Please click to login to Guppy'
    message.addEventListener('click', () => {
      browser.runtime.sendMessage({
        message: 'openLoginForm',
      })
    })

    const remove = document.createElement('a')
    remove.className = 'guppy-remove'
    remove.textContent = 'x'
    remove.addEventListener('click', () => {
      div.style.display = 'none'

      browser.storage.local.set({
        isAskedLoginHtml: thisYear,
      })
    })

    div3.append(message)
    div2.append(div3)
    div2.append(remove)
    div.append(div2)

    document.body.append(div)
  }
}
