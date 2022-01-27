import $ from 'jquery'
import browser from 'webextension-polyfill'
import {env} from './env.js'

import {isAdsReplacerDisabled, toggleAdsReplacer} from './inc/ad-replacer.js'

const button = document.querySelector('button#signout')

button.addEventListener('click', () => {
  browser.runtime.sendMessage({message: 'logout'}).then(response => {
    if (response.message === 'success') {
      window.location.replace('../html/popup_sign_in.html')
    }
  })
})

window.addEventListener('load', () => {
  // Get account info
  browser.runtime.sendMessage({message: 'userAccount'}).then(response => {
    if (response.message === 'success') {
      let status = 'Inactive'
      if (response.data.profile.status) {
        status = 'Active'
      }

      $('#name').text(response.data.profile.full_name)
      $('#email').text(response.data.user)
      $('#time').text(response.data.profile.last_time)
      $('#referral').val(response.data.profile.reflink)
      $('#status').text(status)
      let accountType = 'Waitlist'
      if (response.data.profile.is_waitlisted) {
        $('.amount-block').addClass('hidden')
      } else {
        $('.amount-block').removeClass('hidden')
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

  // Request payout
  $('.request-payout').click(() => {
    $.ajax({
      url: env.guppyApiUrl + '/api/payouts/request/',
      type: 'GET',
      dataType: 'json',
    }).done(() => {
      $('.payout-message').text('Your request is sent')
      $('.payout-message').addClass('alert-info')
    }).fail(response => {
      $('.payout-message').text(response.responseJSON.message)
      $('.payout-message').addClass('alert-danger')
    })
    $('.request-payout').prop('disabled', true)
  })

  // Update "switch button"
  isAdsReplacerDisabled().then(checked => {
    if (checked === false) {
      switchButton.checked = false
    } else if (checked === true) {
      switchButton.checked = true
    } else {
      // Hide "switch button"
      document.querySelector('.switch-button-block').style.display = 'none'
    }
  })
})

// Disable/Enable ads replacer
const switchButton = document.querySelector('.switch-button input')
switchButton.addEventListener('change', toggleAdsReplacer)
