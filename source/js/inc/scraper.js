import $ from 'jquery'
import browser from 'webextension-polyfill'

// Crawl Google search results
export async function googleSearch() {
  const origin = window.location.origin
  const isGoogleSearch = origin.includes('://www.google.') || origin.includes('://google.')
  if (isGoogleSearch) {
    const items = []
    // TODO: get more results
    $('#search .g a').each(function () {
      const href = $(this).attr('href')
      if (href && href.startsWith('http')) {
        items.push(href)
      }
    })
    const terms = $('input[name="q"]').val()

    browser.runtime.sendMessage({
      message: 'sendSearch',
      payload: {
        search_type: 0, // eslint-disable-line camelcase
        search_terms: terms, // eslint-disable-line camelcase
        search_results: items, // eslint-disable-line camelcase
      },
    })
  }

  return true
}

// Send page view
export async function sendPageView(url, title, referrer) {
  browser.runtime.sendMessage({
    message: 'sendHistory',
    payload: {
      url,
      title,
      last_origin: referrer, // eslint-disable-line camelcase
    },
  })

  return true
}
