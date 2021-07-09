import $ from 'jquery'

const browser = require('webextension-polyfill')

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
        pass
      }
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
