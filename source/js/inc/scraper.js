import $ from 'jquery'

import {isUserSignedIn} from './account.js'

export function googleSearch() {
  // Crawl Google search results
  const origin = window.location.origin
  const isGoogleSearch = origin.includes('www.google.') || origin.includes('://google.')
  if (isGoogleSearch) {
    const items = []
    // TODO: get more results
    $('#search .g a').each(function () {
      const href = $(this).attr('href')
      if (href.startsWith('http')) {
        items.push(href)
      }
    })
    const terms = $('input[name="q"]').val()

    let headerVars = {}
    isUserSignedIn().then(response => {
      if (response.userStatus) {
        headerVars = {
          Authorization: 'Bearer ' + response.token
        }
      }

      $.ajax({
        url: 'http://localhost:8000/api/search/',
        type: 'post',
        traditional: true, // Remove brackets
        headers: headerVars,
        data: {
          search_type: 0, // eslint-disable-line camelcase
          search_terms: terms, // eslint-disable-line camelcase
          search_results: items // eslint-disable-line camelcase
        },
        dataType: 'json'
      })
    })
  }
}
