import { describe, expect, it } from 'vitest'
import { autoAssignedLocationOnCheckIn } from './autoAssignLocation'

describe('autoAssignedLocationOnCheckIn', () => {
  it('returns null when un-checking, regardless of the selected tab', () => {
    expect(autoAssignedLocationOnCheckIn(false, 3)).toBeNull()
    expect(autoAssignedLocationOnCheckIn(false, null)).toBeNull()
  })

  it('returns null when checking in while the Unassigned tab is selected', () => {
    expect(autoAssignedLocationOnCheckIn(true, null)).toBeNull()
  })

  it('returns the selected location when checking in on a real location tab', () => {
    expect(autoAssignedLocationOnCheckIn(true, 7)).toBe(7)
  })
})
