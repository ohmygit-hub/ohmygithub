import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const appCss = readFileSync(resolve(__dirname, 'app.css'), 'utf8')

describe('focus ring modality styles', () => {
  it('does not remove field primitive box shadows when suppressing mouse focus rings', () => {
    expect(appCss).toContain(':focus-visible:not([data-slot="input"]):not([data-slot="textarea"])')
  })
})
