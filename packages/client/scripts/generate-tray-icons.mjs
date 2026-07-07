import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
// inline.svg is the cat mark on its own (no surrounding circle) — the tray shows
// just the cat as a clean silhouette. (badge.svg embeds the cat as negative space
// inside a disc, which renders as a filled blob at tray sizes.)
const source = resolve(here, '../../../assets/inline.svg')
const outDir = resolve(here, '../resources/tray')

// Render the cat and force every pixel's RGB to a flat colour while keeping the
// rendered alpha as the glyph mask.
// - macOS template (trayTemplate.png): colour is irrelevant — a template image uses
//   only alpha and macOS paints it (white on dark menu bars, black on light). We use
//   black for a well-defined file.
// - Windows/Linux (tray.png): rendered as-is in white, per the requested white cat.
async function renderRecolored(size, outFile, rgb) {
  const { data, info } = await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = rgb.r
    data[i + 1] = rgb.g
    data[i + 2] = rgb.b
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png()
    .toFile(outFile)
}

const BLACK = { r: 0, g: 0, b: 0 }
const WHITE = { r: 255, g: 255, b: 255 }

await mkdir(outDir, { recursive: true })
await renderRecolored(16, resolve(outDir, 'trayTemplate.png'), BLACK)
await renderRecolored(32, resolve(outDir, 'trayTemplate@2x.png'), BLACK)
await renderRecolored(16, resolve(outDir, 'tray.png'), WHITE)
await renderRecolored(32, resolve(outDir, 'tray@2x.png'), WHITE)
console.log('Generated tray icons in', outDir)
