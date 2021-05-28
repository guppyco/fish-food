import $ from 'jquery'

export function adReplacer (selectors, img, count) { // eslint-disable-line space-before-function-paren
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

  return count
}
