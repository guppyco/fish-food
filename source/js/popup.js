import $ from 'jquery'
import browser from 'webextension-polyfill'

import {getVersion} from './inc/helpers.js'

window.addEventListener('load', () => {
  // Re-create storage from cookies
  browser.runtime.sendMessage({message: 'refreshStorage'}).then(() => {
    browser.runtime.sendMessage({message: 'userStatus'}).then(response => {
      if (response.message === 'success') {
        window.location.replace('../html/popup_account.html')
      } else {
        window.location.replace('../html/popup_sign_in.html')
      }
    })
  })

  // Show the extension version
  getVersion().then(version => {
    $('#version').text('v' + version.version)
    if (version.env && version.env !== 'production') {
      $('#env').text(version.env + ' (' + version.url + ')')
    }
  })
})
