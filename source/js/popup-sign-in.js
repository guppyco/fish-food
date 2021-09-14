import $ from 'jquery'
import browser from 'webextension-polyfill'

import {env} from './env.js'
import {isAdsReplacerDisabled, toggleAdsReplacer} from './inc/helpers.js'

document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault()
  $('#email, #password').css('border-color', 'black')
  $('.error-message').text('')

  const email = $('#email').val()
  const pass = $('#password').val()

  if (email && pass) {
    // Send message to background script with email and password
    browser.runtime.sendMessage({
      message: 'login',
      payload: {
        email,
        pass,
      },
    }).then(response => {
      if (response === 'success') {
        window.location.replace('../html/popup_account.html')
      } else {
        $('.error-message').text('This account is not valid')
      }
    })
  } else {
    $('#email').attr('placeholder', 'Enter an email.')
    $('#password').attr('placeholder', 'Enter a password.')
    $('#email, #password').css('border-color', 'red')
  }
})

// Go to signup page when click create account link
document.querySelector('#signup-link').addEventListener('click', () => {
  browser.tabs.create({url: env.guppyApiUrl + '/signup/'})
})

window.addEventListener('load', () => {
  // Update "switch button"
  isAdsReplacerDisabled().then(checked => {
    if (checked) {
      switchButton.checked = true
    }
  })
})

// Disable/Enable ads replacer
const switchButton = document.querySelector('.switch-button input')
switchButton.addEventListener('change', toggleAdsReplacer)
