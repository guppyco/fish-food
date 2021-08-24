import browser from 'webextension-polyfill'

import {sendPageView} from './inc/scraper.js'

// Send page view
// TODO: move to before page load
browser.runtime.sendMessage({message: 'allTabs'}).then(response => {
  if (response && response.tabs) {
    const current = window.location.href
    // Check if current URL is a tab
    response.tabs.every(tab => {
      if (tab.url === current) {
        const referrer = document.referrer

        // If searchTerm is in storage, this site is from Google search results
        // (searchTerm is saved by browser.webRequest.onBeforeRequest)
        browser.storage.local.get(['searchTerm']).then(storage => {
          // Post to server
          if (storage.searchTerm && storage.searchTerm.length > 0) {
            const terms = storage.searchTerm
            const term = terms.splice(-1)
            // Result form Google search
            sendPageView(tab.url, tab.title, referrer, term[0])
            // Remove last search term after sending page view
            browser.storage.local.set({searchTerm: terms})
          } else {
            // Normal site
            sendPageView(tab.url, tab.title, referrer, null)
          }
        })
        return false
      }

      return true
    })
  }
})
