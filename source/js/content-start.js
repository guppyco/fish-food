import browser from 'webextension-polyfill'

import {isMonetizeData, sendPageView} from './inc/scraper.js'

browser.runtime.sendMessage({message: 'allTabs'}).then(response => {
  if (response && response.tabs) {
    isMonetizeData().then(isMonetizeData => {
      if (isMonetizeData) {
        const current = window.location.href
        // Check if current URL is a tab
        response.tabs.every(tab => {
          if (tab.url === current) {
            const referrer = document.referrer
            sendPageView(tab.url, tab.title, referrer, null)

            return false
          }

          return true
        })
      }
    })
  }
})
