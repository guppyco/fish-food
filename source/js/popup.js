/* global chrome */

window.addEventListener('load', () => {
  chrome.runtime.sendMessage(
    {
      message: 'userStatus'
    },
    response => {
      if (response.message === 'success') {
        window.location.replace('../html/popup_account.html')
      } else {
        window.location.replace('../html/popup_sign_in.html')
      }
    }
  )
})
