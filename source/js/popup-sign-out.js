/* global chrome */
const button = document.querySelector('button')

button.addEventListener('click', () => {
  chrome.runtime.sendMessage(
    {
      message: 'logout'
    },
    response => {
      if (response === 'success') {
        window.location.replace('../html/popup_sign_in.html')
      }
    }
  )
})
