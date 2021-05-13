/* global chrome */
import $ from 'jquery'

const button = document.querySelector('button')

button.addEventListener('click', () => {
  chrome.runtime.sendMessage(
    {
      message: 'logout'
    },
    response => {
      if (response.message === 'success') {
        window.location.replace('../html/popup_sign_in.html')
      }
    }
  )
})

window.addEventListener('load', () => {
  chrome.runtime.sendMessage(
    {
      message: 'userAccount'
    },
    response => {
      if (response.message === 'success') {
        $('#name').text(response.data.user)
      } else {
        window.location.replace('../html/popup_sign_in.html')
      }
    }
  )
})
