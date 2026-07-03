import { describe, expect, it } from 'vitest'
import { unwrapSubWrappedBadges } from './markdown-content'

describe('unwrapSubWrappedBadges', () => {
  it('unwraps a codex priority badge from nested sub tags', () => {
    const content = '**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Recompute canonical fragment hashes**'

    expect(unwrapSubWrappedBadges(content)).toBe(
      '**![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)  Recompute canonical fragment hashes**',
    )
  })

  it('unwraps a single sub wrapper', () => {
    const content = '<sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub> title'

    expect(unwrapSubWrappedBadges(content)).toBe(
      '![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat) title',
    )
  })

  it('leaves sub tags without shields badges untouched', () => {
    const content = 'H<sub>2</sub>O and <sub>![logo](https://example.com/logo.png)</sub>'

    expect(unwrapSubWrappedBadges(content)).toBe(content)
  })
})
