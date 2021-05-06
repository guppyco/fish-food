/* global chrome */
import $ from 'jquery'

let count = 0
if (typeof chrome !== 'undefined') {
  const easylist = 'https://easylist.to/easylist/easylist.txt'

  $.get(easylist).done(data => {
    const img = chrome.extension.getURL('images/placeholder.jpg')
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
      .then(response => sendResponse(response))
      .catch(error => console.log(error))

    return true
  }

  if (request.message === 'logout') {
    flipUserStatus(false, null)
      .then(response => sendResponse(response))
      .catch(error => console.log(error))

    return true
  }

  if (request.message === 'userStatus') {
    isUserSignedIn()
      .then(response => {
        sendResponse({
          message: 'success',
          userInfo: response.userInfo.email
        })
      })
      .catch(error => console.log(error))
    return true
  }
})

chrome.browserAction.onClicked.addListener(() => {
  let returnSession = true
  isUserSignedIn()
    .then(response => {
      if (response.userStatus) {
        if (returnSession) {
          chrome.windows.create({
            url: './html/popup_account.html',
            width: 300,
            height: 600,
            focused: true
          }, () => {
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
    .catch(error => console.log(error))
})

chrome.runtime.sendMessage({
  message: 'userStatus',
  function(response) {
    if (response.message === 'success') {
      $('#name').text(response.userInfo)
    }
  }
})

function flipUserStatus(signIn, userInfo) {
  if (signIn) {
    return $.post('http://localhost:8000/login/', {
      'login-username': userInfo.email,
      'login-password': userInfo.pass
    }).done(response => {
      return new Promise(resolve => {
        if (response.status !== 200) {
          resolve('fail')
        }

        if (response.status === 200) {
          chrome.storage.local.set({
            userStatus: signIn, userInfo
          }, () => {
            if (chrome.runtime.lastError) {
              resolve('fail')
            } else {
              resolve('success')
            }
          })
        }
      })
    }).fail(error => {
      console.log(error)
    })
  }

  // Fetch the localhost:8000/logout/ route
  return new Promise(resolve => {
    chrome.storage.local.get(['userStatus', 'userInfo'], response => {
      if (chrome.runtime.lastError) {
        resolve('fail')
      }

      if (response.userStatus === undefined) {
        resolve('fail')
      }

      $.post('http://localhost:8000/logout/', {
        'login-username': userInfo.email
      }).done(response => {
        if (response.status !== 200) {
          resolve('fail')
        }

        chrome.storage.local.set({
          userStatus: signIn, userInfo: {}
        }, () => {
          if (chrome.runtime.lastError) {
            resolve('fail')
          }

          resolve('success')
        })
      }).fail(error => {
        console.log(error)
      })
    })
  })
}

function isUserSignedIn() {
  return new Promise(resolve => {
    chrome.storage.local.get(['userStatus', 'userInfo'], response => {
      if (chrome.runtime.lastError) {
        resolve(
          {
            userStatus: false, userInfo: {}
          }
        )
      }

      resolve(
        response.userStatus === undefined ?
          {
            userStatus: false, userInfo: {}
          } :
          {
            userStatus: response.userStatus, userInfo: response.userInfo
          }
      )
    })
  })
}
