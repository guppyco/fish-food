import $ from 'jquery'

let count = 0
if (typeof chrome !== 'undefined') {
  const easylist = 'https://easylist.to/easylist/easylist.txt'

  $.get(easylist).done((data) => {
    const easylistLines = data.split('\n')
    const easylistSelectors = easylistLines
      .filter((line) => {
        return /^##/.test(line)
      })
      .map((line) => {
        return line.replace(/^##/, '')
      })
      .join(',')

    adReplacer(easylistSelectors)
    $(document).ready(function () {
      adReplacer(easylistSelectors)
    })
    $(window).scroll(function () {
      adReplacer(easylistSelectors)
    })
  })
}

function adReplacer (selectors) {
  const img = chrome.extension.getURL('images/placeholder.jpg')  // eslint-disable-line
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
