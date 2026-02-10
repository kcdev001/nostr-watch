const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?[^\s]*)?$/i
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?[^\s]*)?$/i
const URL_REGEX = /https?:\/\/[^\s<>"']+/g

export interface ParsedContent {
  html: string
  images: string[]
  videos: string[]
}

/**
 * Decode HTML entities that may have been applied by the backend sanitizer.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function parseEventContent(raw: string): ParsedContent {
  // Decode any backend HTML escaping first so we work with plain text
  const plain = decodeHtmlEntities(raw)

  const images: string[] = []
  const videos: string[] = []

  // Find all URLs in plain text content
  const urls = plain.match(URL_REGEX) || []
  for (const url of urls) {
    if (IMAGE_EXTENSIONS.test(url)) {
      images.push(url)
    } else if (VIDEO_EXTENSIONS.test(url)) {
      videos.push(url)
    }
  }

  // Escape for safe HTML rendering
  let html = escapeHtml(plain)

  // Linkify URLs (but not media URLs we'll render separately)
  const mediaSet = new Set([...images, ...videos])
  html = html.replace(/https?:\/\/[^\s<>&"]+/g, (match) => {
    const decoded = match.replace(/&amp;/g, '&')
    if (mediaSet.has(decoded)) {
      return '' // Remove media URLs from text, they'll render as embeds
    }
    return `<a href="${match}" target="_blank" rel="noopener" class="text-primary-500 hover:underline break-all">${match}</a>`
  })

  // Convert #hashtags to clickable search links
  html = html.replace(/#(\w{1,64})/g, (match, tag) => {
    return `<a href="/?q=%23${tag}" class="text-primary-500 hover:underline">${match}</a>`
  })

  // Preserve newlines
  html = html.replace(/\n/g, '<br>')

  // Clean up empty lines from removed media URLs
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>')
  html = html.replace(/^(<br>)+|(<br>)+$/g, '')

  return { html, images, videos }
}
