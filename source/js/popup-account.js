import $ from 'jquery'

const browser = require('webextension-polyfill')

const button = document.querySelector('button')

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
      $('#name').text(response.data.user)
    } else {
      window.location.replace('../html/popup_sign_in.html')
    }
  })
})
