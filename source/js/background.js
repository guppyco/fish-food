/* global chrome */
import $ from 'jquery'

let count = 0
if (typeof chrome !== 'undefined') { // eslint-disable-line no-undef
  const easylist = 'https://easylist.to/easylist/easylist.txt'

  $.get(easylist).done(data => {
    const img = chrome.extension.getURL('images/placeholder.jpg') // eslint-disable-line no-undef
    let didScroll = false
    const easylistLines = data.split('\n')
    const easylistSelectors = easylistLines
      .filter(line => {
        return line.startsWith('##')
      })
      .map(line => {
        return line.replace(/^##/, '')
      })
      .join(',')

    adReplacer(easylistSelectors, img)
    $(document).ready(() => {
      adReplacer(easylistSelectors, img)
    })
    $(window).scroll(() => {
      didScroll = true
    })
    setInterval(() => {
      if (didScroll) {
        adReplacer(easylistSelectors, img)
        didScroll = false
      }
    }, 10000)
  })
}

function adReplacer (selectors, img) { // eslint-disable-line space-before-function-paren
  $(selectors).each(function () {
    const height = $(this).height()
    const width = $(this).width()
    const className = 'replaced-img-' + count++
    $(this).replaceWith(
      '<img class="' + className + '" src="' + img + '" />'
    )
    $('.' + className)
      .height(height)
      .width(width)
      .css('object-fit', 'cover')
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'login') {
    flipUserStatus(true, request.payload)
      .then(res => sendResponse(res))
      .catch(err => console.log(err))

    return true
  } else if (request.message === 'logout') {
    flipUserStatus(false, null)
      .then(res => sendResponse(res))
      .catch(err => console.log(err))

    return true
  } else if (request.message === 'userStatus') {
    isUserSignedIn()
      .then(res => {
        sendResponse({
          message: 'success',
          userInfo: res.userInfo.email
        })
      })
      .catch(err => console.log(err))
    return true
  }
})

chrome.browserAction.onClicked.addListener(function () {
  let returnSession = true
  isUserSignedIn()
    .then(res => {
      if (res.userStatus) {
        if (returnSession) {
          chrome.windows.create({
            url: './html/popup_account.html',
            width: 300,
            height: 600,
            focused: true
          }, function () {
            returnSession = false
          })
        } else {
          chrome.windows.create({
            url: './html/popup_sign_out.html',
            width: 300,
            height: 600,
            focused: true
          })
        }
      } else {
        chrome.windows.create({
          url: './html/popup_sign_in.html',
          width: 300,
          height: 600,
          focused: true
        })
      }
    })
    .catch(err => console.log(err))
})

chrome.runtime.sendMessage({
  message: 'userStatus',
  function (response) {
    if (response.message === 'success') {
      document.getElementById('name').innerText =
      response.userInfo
    }
  }
})

function flipUserStatus (signIn, userInfo) {
  if (signIn) {
    $.post('http://localhost:8000/login/', {
      'login-username': userInfo.email,
      'login-password': userInfo.pass
    }).done(function (res) {
      return new Promise(resolve => {
        if (res.status !== 200) resolve('fail')

        chrome.storage.local.set({ userStatus: signIn, userInfo }, function (response) {
          if (chrome.runtime.lastError) resolve('fail')

          resolve('success')
        })
      })
    }).fail(function (err) {
      console.log(err)
    })
  } else if (!signIn) {
    // fetch the localhost:8000/logout/ route
    return new Promise(resolve => {
      chrome.storage.local.get(['userStatus', 'userInfo'], function (response) {
        if (chrome.runtime.lastError) resolve('fail')

        if (response.userStatus === undefined) resolve('fail')

        $.post('http://localhost:8000/logout/', {
          'login-username': userInfo.email
        }).done(function (res) {
          if (res.status !== 200) resolve('fail')

          chrome.storage.local.set({ userStatus: signIn, userInfo: {} }, function (response) {
            if (chrome.runtime.lastError) resolve('fail')

            resolve('success')
          })
        }).fail(function (err) {
          console.log(err)
        })
      })
    })
  }
}

function isUserSignedIn () {
  return new Promise(resolve => {
    chrome.storage.local.get(['userStatus', 'userInfo'], function (response) {
      if (chrome.runtime.lastError) {
        resolve(
          { userStatus: false, userInfo: {} }
        )
      }
      resolve(
        response.userStatus === undefined
          ? { userStatus: false, userInfo: {} }
          : { userStatus: response.userStatus, userInfo: response.userInfo }
      )
    })
  })
}
