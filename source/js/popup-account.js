import $ from 'jquery'
import browser from 'webextension-polyfill'

import {isAdsReplacerDisabled, toggleAdsReplacer} from './inc/helpers.js'

const button = document.querySelector('button#signout')

button.addEventListener('click', () => {
  browser.runtime.sendMessage({message: 'logout'}).then(response => {
    if (response.message === 'success') {
      window.location.replace('../html/popup_sign_in.html')
    }
  })
})

window.addEventListener('load', () => {
  browser.runtime.sendMessage({message: 'userAccount'}).then(response => {
    if (response.message === 'success') {
      let status = 'Inactive'
      if (response.data.profile.status) {
        status = 'Active'
      }

      $('#name').text(response.data.profile.full_name)
      $('#email').text(response.data.user)
      $('#address').text(response.data.profile.address)
      $('#time').text(response.data.profile.last_time)
      $('#status').text(status)
      let accountType = 'Waitlist'
      if (response.data.profile.is_waitlisted) {
        $('.amount-block').addClass('hidden')
      } else {
        accountType = 'Approved'
        $('#paid_amount').text(response.data.profile.paid_amount_text)
        $('#requesting_amount').text(response.data.profile.requesting_amount_text)
        $('#unpaid_amount').text(response.data.profile.unpaid_amount_text)

        if (response.data.profile.unpaid_amount >= 1000) {
          $('.button-enabled').removeClass('hidden')
          $('.button-disabled').addClass('hidden')
        }
      }

      $('#type').text(accountType)
    } else {
      window.location.replace('../html/popup_sign_in.html')
    }
  })

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
