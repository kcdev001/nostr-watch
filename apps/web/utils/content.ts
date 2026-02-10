const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?[^\s]*)?$/i
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)(\?[^\s]*)?$/i
const URL_REGEX = /https?:\/\/[^\s<>"']+/g

export interface ParsedContent {
  html: string
  images: string[]
  videos: string[]
}

export function parseEventContent(raw: string): ParsedContent {
  const images: string[] = []
  const videos: string[] = []

  // Find all URLs in content
  const urls = raw.match(URL_REGEX) || []
  for (const url of urls) {
    if (IMAGE_EXTENSIONS.test(url)) {
      images.push(url)
    } else if (VIDEO_EXTENSIONS.test(url)) {
      videos.push(url)
    }
  }

  // Convert plain text to HTML: linkify URLs, preserve newlines
  let html = escapeHtml(raw)

  // Linkify URLs (but not media URLs we'll render separately)
  const mediaSet = new Set([...images, ...videos])
  html = html.replace(/https?:\/\/[^\s<>&"']+/g, (match) => {
    // Decode HTML entities back for comparison
    const decoded = match.replace(/&amp;/g, '&')
    if (mediaSet.has(decoded)) {
      return '' // Remove media URLs from text, they'll render as embeds
    }
    return `<a href="${match}" target="_blank" rel="noopener" class="text-primary-500 hover:underline break-all">${match}</a>`
  })

  // Preserve newlines
  html = html.replace(/\n/g, '<br>')

  // Clean up empty lines from removed media URLs
  html = html.replace(/(<br>\s*){3,}/g, '<br><br>')
  html = html.replace(/^(<br>)+|(<br>)+$/g, '')

  return { html, images, videos }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
