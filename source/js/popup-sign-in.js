/* global chrome */
import $ from 'jquery'

document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault()
  $('#email, #password').css('border-color', 'black')
  $('.error-message').text('')

  const email = $('#email').val()
  const pass = $('#password').val()

  if (email && pass) {
    // Send message to background script with email and password
    chrome.runtime.sendMessage(
      {
        message: 'login',
        payload: {
          email,
          pass
        }
      },
      response => {
        if (response === 'success') {
          window.location.replace('../html/popup_sign_out.html')
        } else {
          $('.error-message').text('This account is not valid')
        }
      }
    )
  } else {
    $('#email').attr('placeholder', 'Enter an email.')
    $('#password').attr('placeholder', 'Enter a password.')
    $('#email, #password').css('border-color', 'red')
  }
})
