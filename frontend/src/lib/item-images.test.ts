import { describe, expect, it } from 'vitest'

import { bestItemImage } from './item-images'

describe('bestItemImage', () => {
  it('keeps the primary image when one is already present', () => {
    expect(bestItemImage('Sugar Plantain', [], 'https://example.com/direct.jpg')).toBe('https://example.com/direct.jpg')
  })

  it('reuses a source item image for matching item names', () => {
    const image = bestItemImage('sugar plantain', [
      {
        display_name: 'Sugar Plantain',
        canonical_name: 'sugar plantain',
        image_url: 'https://example.com/plantain.jpg',
      },
    ])

    expect(image).toBe('https://example.com/plantain.jpg')
  })
})
