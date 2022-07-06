import $ from 'jquery'
import browser from 'webextension-polyfill'

// Crawl Google search results
export async function googleSearch() {
  const origin = window.location.origin
  const isGoogleSearch = origin.includes('://www.google.') || origin.includes('://google.')
  if (isGoogleSearch) {
    const terms = $('input[name="q"]').val()

    if (terms) {
      // Add search term flag to result URLs
      $('#search a').each(function () {
        let uri = $(this).attr('href')
        if (uri) {
          const separator = uri.includes('?') ? '&' : '?'
          // Temporary replace "&" by "<and>"
          uri = uri + separator + 'google_search_term=' + terms.replace(/&/g, '<and>')
          $(this).attr('href', uri)
          // Remove event to fix clicking on Firefox
          $(this).prop('onmousedown', null)
        }
      })

      browser.runtime.sendMessage({
        message: 'sendSearch',
        payload: {
          search_type: 0, // eslint-disable-line camelcase
          search_terms: terms, // eslint-disable-line camelcase
        },
      })
    }
  }

  return true
}

// Send page view
export async function sendPageView(url, title, referrer, searchTerm) {
  browser.runtime.sendMessage({
    message: 'sendHistory',
    payload: {
      url,
      title,
      last_origin: referrer, // eslint-disable-line camelcase
      search_term: searchTerm, // eslint-disable-line camelcase
    },
  })

  return true
}

// Update storage when toggling the monetize data button
export async function toggleMonetizeData() {
  if (this.checked) {
    browser.storage.local.set({enabledMonetizeData: true})
  } else {
    browser.storage.local.remove(['enabledMonetizeData'])
  }
}

// Check if the user enabled monetizing data
export async function isMonetizeData() {
  const storage = await browser.storage.local.get(['enabledMonetizeData'])

  if (storage && storage.enabledMonetizeData) {
    return true
  }

  return false
}
