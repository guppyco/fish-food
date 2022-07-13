import $ from 'jquery'
import browser from 'webextension-polyfill'

import {env} from '../env.js'
import {getDomainFromUrl} from './helpers.js'

export async function adReplacer(selectors) {
  // Get the URL if it is a "real page"
  // Or get the refferer if it is loaded via iframe
  // See: https://stackoverflow.com/a/7739035/4238906
  const currentUrl = (window.location === window.parent.location)
    ? document.location.href
    : document.referrer
  const currentDomain = await getDomainFromUrl(currentUrl)
  const isDisabled = await isAdsReplacerDisabled(currentDomain)
  if (isDisabled) {
    return false
  }

  $(selectors).each(function () {
    // Ignore some cases
    if (
      // Youtube video
      !$(this).hasClass('video-ads')
    ) {
      const height = Math.round($(this).height())
      const width = Math.round($(this).width())
      const adElement = $(this)
      // Replace ads by Guppy's ads
      let iframeUrl = env.guppyApiUrl + '/advertisers/ads/' + width + '/' + height + '/'
      // Show Adsterra ads only for Google pages
      if (
        currentDomain.startsWith('www.google.com')
        || currentDomain.startsWith('google.com')
      ) {
        iframeUrl = env.guppyApiUrl + '/advertisers/ads/' + width + '/' + height + '/Adsterra'
      }

      const content = `
        <iframe src="${iframeUrl}" height="${height}" width="${width}"
        style="object-fit: cover; border: none;" scrolling="no"></iframe>
      `
      adElement.replaceWith(content)
      adElement.remove()
    }
  })

  return true
}

// Get placeholder image with appropriate size
// eslint-disable-next-line no-unused-vars
function getPlaceholderImage(width, height) {
  const listImages = [
    // [width, height, has ads]
    [125, 125],
    [180, 150],
    [200, 200],
    [250, 250],
    [970, 250],
    [970, 90],
    [300, 1050],
    [160, 600],
    [160, 300, true],
    [120, 240],
    [120, 600],
    [234, 60],
    [468, 60],
    [320, 50],
    [320, 100],
    [300, 600],
    [728, 90],
    [336, 280],
    [300, 250, true],
  ]

  for (let percent = 5; percent <= 30; percent += 5) {
    for (const image of listImages) {
      // Return image if width and height are matched
      if (width === image[0] && height === image[1]) {
        return image
      }

      const widthDeviationRate = Math.abs(width - image[0]) * 100 / Math.max(width, image[0])
      const heightDeviationRate = Math.abs(height - image[1]) * 100 / Math.max(height, image[1])
      // Return image if the deviations are less than 30 percent
      if (widthDeviationRate <= percent && heightDeviationRate <= percent) {
        return image
      }
    }
  }

  let minDeviationRate = null
  let matchedImage = null
  for (const image of listImages) {
    const widthDeviationRate = Math.abs(width - image[0]) * 100 / Math.max(width, image[0])
    const heightDeviationRate = Math.abs(height - image[1]) * 100 / Math.max(height, image[1])
    const ratioDeviationRate = Math.abs((width / height) - (image[0] / image[1]))
    // Calculate the total with the most important parameter being ratioDeviationRate
    const totalRate = widthDeviationRate + heightDeviationRate + (ratioDeviationRate * 150)

    // Return image which have total deviation is minimum
    if (minDeviationRate === null || minDeviationRate > totalRate) {
      minDeviationRate = totalRate
      matchedImage = image
    }
  }

  return matchedImage
}

// Update storage when toggling the ads replacer button
export async function toggleAdsReplacer() {
  const denyList = await getDenyList()
  const currentDomain = await getDomainFromUrl()
  const index = denyList.indexOf(currentDomain)

  if (this.checked && index === -1) {
    denyList.push(currentDomain)
  } else if (!this.checked && index > -1) {
    denyList.splice(index, 1)
  }

  // Update storage
  browser.storage.local.set({denyList})
}

// Check if the current site is disabled
// Return boolean, or the domain if it is not a web page
export async function isAdsReplacerDisabled(domain = null) {
  if (domain === null) {
    domain = await getDomainFromUrl()
  }

  const denyList = await getDenyList()

  if (!domain.includes('.')) {
    return domain
  }

  if (denyList && denyList.includes(domain)) {
    return true
  }

  return false
}

// Get the list of ads replacer disabled sites
export async function getDenyList() {
  let denyList = []
  const storage = await browser.storage.local.get(['denyList'])
  if (storage.denyList && Array.isArray(storage.denyList)) {
    denyList = storage.denyList
  }

  return denyList
}
