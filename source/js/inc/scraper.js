import $ from 'jquery'

import {env} from '../env.js'
import {isUserSignedIn} from './account.js'

export async function googleSearch() {
  // Crawl Google search results
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

    let headers = {}
    const isSignedIn = await isUserSignedIn()
    if (isSignedIn.userStatus) {
      headers = {
        Authorization: 'Bearer ' + isSignedIn.token,
      }
    }

    $.ajax({
      url: env.guppyApiUrl + '/api/search/',
      type: 'post',
      traditional: true, // Remove brackets
      headers,
      data: {
        search_type: 0, // eslint-disable-line camelcase
        search_terms: terms, // eslint-disable-line camelcase
        search_results: items, // eslint-disable-line camelcase
      },
      dataType: 'json',
    })
  }
}
