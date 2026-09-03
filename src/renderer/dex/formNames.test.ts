import { describe, expect, it } from 'vitest'
import type { Form } from '@shared/types/pokemon'
import { capitalizeWords, formDisplayName, speciesDisplayName } from './formNames'

function makeForm(overrides: Partial<Form> & Pick<Form, 'id' | 'speciesId' | 'formName'>): Form {
  return {
    formCategory: 'dex_distinct',
    homeBoxable: true,
    shinyLocked: false,
    alwaysShiny: false,
    hasGenderDifference: false,
    firstAvailableGeneration: 1,
    regionalGroup: null,
    pokeapiId: overrides.id,
    spriteFormSuffix: null,
    ...overrides
  }
}

describe('capitalizeWords', () => {
  it('capitalizes each hyphen- or space-separated word', () => {
    expect(capitalizeWords('pikachu')).toBe('Pikachu')
    expect(capitalizeWords('ho-oh')).toBe('Ho-Oh')
    expect(capitalizeWords('porygon-z')).toBe('Porygon-Z')
    expect(capitalizeWords('deoxys attack')).toBe('Deoxys Attack')
  })
})

describe('speciesDisplayName', () => {
  it('restores punctuation for exception species', () => {
    expect(speciesDisplayName('farfetchd')).toBe("Farfetch'd")
    expect(speciesDisplayName('sirfetchd')).toBe("Sirfetch'd")
    expect(speciesDisplayName('mr-mime')).toBe('Mr. Mime')
    expect(speciesDisplayName('mr-rime')).toBe('Mr. Rime')
    expect(speciesDisplayName('mime-jr')).toBe('Mime Jr.')
    expect(speciesDisplayName('type-null')).toBe('Type: Null')
    expect(speciesDisplayName('nidoran-f')).toBe('Nidoran♀')
    expect(speciesDisplayName('nidoran-m')).toBe('Nidoran♂')
    expect(speciesDisplayName('flabebe')).toBe('Flabébé')
    expect(speciesDisplayName('jangmo-o')).toBe('Jangmo-o')
    expect(speciesDisplayName('hakamo-o')).toBe('Hakamo-o')
    expect(speciesDisplayName('kommo-o')).toBe('Kommo-o')
  })

  it('falls back to capitalizeWords for species with no exception entry', () => {
    expect(speciesDisplayName('pikachu')).toBe('Pikachu')
    expect(speciesDisplayName('ho-oh')).toBe('Ho-Oh')
    expect(speciesDisplayName('porygon-z')).toBe('Porygon-Z')
  })
})

describe('formDisplayName', () => {
  it('appends the capitalized form name in parentheses', () => {
    const form = makeForm({ id: 1, speciesId: 386, formName: 'attack' })
    expect(formDisplayName('Deoxys', form)).toBe('Deoxys (Attack)')
  })

  it('returns the bare species name when there is no form name to show', () => {
    const form = makeForm({ id: 1, speciesId: 25, formName: 'base' })
    expect(formDisplayName('Pikachu', form)).toBe('Pikachu')
  })
})
