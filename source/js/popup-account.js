import $ from 'jquery'
import browser from 'webextension-polyfill'

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
      let status = 'Inactive'
      if (response.data.profile.status) {
        status = 'Active'
      }

      $('#name').text(response.data.profile.full_name)
      $('#email').text(response.data.user)
      $('#address').text(response.data.profile.address)
      $('#time').text(response.data.profile.last_time)
      $('#status').text(status)
    } else {
      window.location.replace('../html/popup_sign_in.html')
    }
  })
})
