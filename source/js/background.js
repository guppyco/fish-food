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
      .then(response => {
        sendResponse(response)
      })
      .catch(error => {
        sendResponse({
          message: 'error',
          err: error
        })
      })

    return true
  }

  if (request.message === 'logout') {
    flipUserStatus(false, null)
      .then(response => {
        sendResponse({
          message: 'success',
          data: response
        })
      })
      .catch(error => {
        sendResponse({
          message: 'error',
          err: error
        })
      })

    return true
  }

  if (request.message === 'userStatus') {
    isUserSignedIn()
      .then(response => {
        if (response.userStatus) {
          sendResponse({
            message: 'success',
            userInfo: response.userInfo
          })
        } else {
          sendResponse({
            message: 'fail'
          })
        }
      })
      .catch(error => {
        sendResponse({
          message: 'error',
          err: error
        })
      })
    return true
  }

  if (request.message === 'userAccount') {
    getAccountInfo()
      .then(account => {
        if (account) {
          sendResponse({
            message: 'success',
            data: account
          })
        } else {
          sendResponse({
            message: 'fail'
          })
        }
      })
      .catch(() => {
        sendResponse({
          message: 'error'
        })
      })

    return true
  }
})

function flipUserStatus(signIn, userInfo) {
  if (signIn) {
    return new Promise(resolve => {
      $.ajax({
        url: 'http://localhost:8000/api/token-auth/',
        type: 'post',
        data: {
          email: userInfo.email,
          password: userInfo.pass
        },
        dataType: 'json'
      }).done(response => {
        if (response.token) {
          chrome.storage.local.set({
            userStatus: signIn,
            token: response,
            userInfo: userInfo.email
          }, () => {
            if (chrome.runtime.lastError) {
              resolve('fail')
            } else {
              resolve('success')
            }
          })
        } else {
          resolve('fail')
        }
      }).fail(error => {
        resolve('fail')
        console.log(error)
      })
    })
  }

  // Fetch the localhost:8000/logout/ route
  return new Promise(resolve => {
    chrome.storage.local.get(['userStatus', 'token', 'userInfo'], response => {
      if (chrome.runtime.lastError) {
        resolve('fail')
      }

      if (response.userStatus === undefined) {
        resolve('fail')
      }

      $.ajax({
        url: 'http://localhost:8000/api/token-destroy/',
        type: 'post',
        headers: {
          Authorization: 'Bearer ' + response.token.token
        },
        dataType: 'json'
      }).done(response => {
        if (!response) {
          resolve('fail')
        }

        chrome.storage.local.set({
          userStatus: false, userInfo: {}
        }, () => {
          if (chrome.runtime.lastError) {
            resolve('fail')
          }

          resolve('success')
        })
      }).fail(error => {
        chrome.storage.local.set({
          userStatus: false, userInfo: {}
        }, () => {
          if (chrome.runtime.lastError) {
            resolve('fail')
          }

          resolve('success')
        })
        console.log(error)
      })
    })
  })
}

function isUserSignedIn() {
  return new Promise(resolve => {
    chrome.storage.local.get(['userStatus', 'token', 'userInfo'], response => {
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
            userStatus: response.userStatus,
            token: response.token.token,
            userInfo: response.userInfo
          }
      )
    })
  })
}

function getAccountInfo() {
  return new Promise(resolve => {
    isUserSignedIn().then(response => {
      if (response.userStatus) {
        $.ajax({
          url: 'http://localhost:8000/api/account/',
          type: 'get',
          headers: {
            Authorization: 'Bearer ' + response.token
          },
          dataType: 'json',
          success: data => {
            resolve(data)
          }
        }).fail(() => {
          // Logout
          flipUserStatus(false, null)
          resolve(false)
        })
      } else {
        resolve(false)
      }
    }).catch(() => {
      resolve(false)
    })
  })
}
