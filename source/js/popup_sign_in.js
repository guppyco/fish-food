/* global chrome */
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault()

  const email = document.querySelector('#email').value
  const pass = document.querySelector('#password').value

  if (email && pass) {
    // send message to background script with email and password
    chrome.runtime.sendMessage(
      {
        message: 'login',
        payload: {
          email,
          pass
        }
      },
      function (response) {
        if (response === 'success') {
          window.location.replace('../html/popup_sign_out.html')
        }
      }
    )
  } else {
    document.querySelector('#email').placeholder = 'Enter an email.'
    document.querySelector('#password').placeholder = 'Enter a password.'
    document.querySelector('#email').style.backgroundColor = 'red'
    document.querySelector('#password').style.backgroundColor = 'red'
  }
})
