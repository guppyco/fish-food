import browser from 'webextension-polyfill'

window.addEventListener('load', () => {
  // Re-create storage from cookies
  browser.runtime.sendMessage({message: 'refreshStorage'}).then(() => {
    browser.runtime.sendMessage({message: 'userStatus'}).then(response => {
      if (response.message === 'success') {
        window.location.replace('../html/popup_account.html')
      } else {
        window.location.replace('../html/popup_sign_in.html')
      }
    })
  })
})
