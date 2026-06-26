import { describe, expect, it } from 'vitest'
import {
  calculateSecondaryTax,
  resolveSecondaryTaxCode,
} from './nzSecondaryTax'

describe('resolveSecondaryTaxCode', () => {
  it('returns SB for combined income up to $15,600', () => {
    const result = resolveSecondaryTaxCode(14000)
    expect(result.code).toBe('SB')
    expect(result.incomeTaxRate).toBe(0.105)
    expect(result.totalWithholdingRate).toBeCloseTo(0.1217)
  })

  it('returns S for combined income $15,601 – $53,500', () => {
    const result = resolveSecondaryTaxCode(53000)
    expect(result.code).toBe('S')
    expect(result.incomeTaxRate).toBe(0.175)
    expect(result.totalWithholdingRate).toBeCloseTo(0.1917)
  })

  it('returns SH for combined income $53,501 – $78,100', () => {
    const result = resolveSecondaryTaxCode(75000)
    expect(result.code).toBe('SH')
    expect(result.incomeTaxRate).toBe(0.3)
    expect(result.totalWithholdingRate).toBeCloseTo(0.3167)
  })

  it('returns ST for combined income $78,101 – $180,000', () => {
    const result = resolveSecondaryTaxCode(100000)
    expect(result.code).toBe('ST')
    expect(result.incomeTaxRate).toBe(0.33)
    expect(result.totalWithholdingRate).toBeCloseTo(0.3467)
  })

  it('returns SA for combined income over $180,000', () => {
    const result = resolveSecondaryTaxCode(200000)
    expect(result.code).toBe('SA')
    expect(result.incomeTaxRate).toBe(0.39)
    expect(result.totalWithholdingRate).toBeCloseTo(0.4067)
  })
})

describe('calculateSecondaryTax', () => {
  it('assigns S code when primary $45,000 and secondary $8,000', () => {
    const result = calculateSecondaryTax(45000, [
      { amount: 5000, description: 'Invoice 1' },
      { amount: 3000, description: 'Invoice 2' },
    ])

    expect(result.combinedIncome).toBe(53000)
    expect(result.taxCode).toBe('S')
    expect(result.secondaryGross).toBe(8000)
    expect(result.totalTax).toBeCloseTo(1533.6, 1)
    expect(result.netSecondary).toBeCloseTo(6466.4, 1)
  })

  it('assigns SH code when primary $70,000 and secondary $5,000', () => {
    const result = calculateSecondaryTax(70000, [{ amount: 5000 }])
    expect(result.combinedIncome).toBe(75000)
    expect(result.taxCode).toBe('SH')
    expect(result.totalTax).toBeCloseTo(1583.5, 1)
  })

  it('assigns SB code when primary $10,000 and secondary $4,000', () => {
    const result = calculateSecondaryTax(10000, [{ amount: 4000 }])
    expect(result.combinedIncome).toBe(14000)
    expect(result.taxCode).toBe('SB')
    expect(result.totalTax).toBeCloseTo(486.8, 1)
  })
})
