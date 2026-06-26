import {
  ACC_EARNERS_LEVY_RATE,
  SECONDARY_TAX_BRACKETS,
} from './brackets'
import type { InvoiceRow } from '../../types/invoice'
import type { SecondaryTaxCode, TaxResult } from '../../types/tax'

export function resolveSecondaryTaxCode(
  combinedIncome: number,
): SecondaryTaxCode {
  const bracket =
    SECONDARY_TAX_BRACKETS.find((entry) => {
      if (combinedIncome < entry.min) {
        return false
      }
      if (entry.max === null) {
        return true
      }
      return combinedIncome <= entry.max
    }) ?? SECONDARY_TAX_BRACKETS[SECONDARY_TAX_BRACKETS.length - 1]

  const totalWithholdingRate = bracket.incomeTaxRate + ACC_EARNERS_LEVY_RATE

  return {
    code: bracket.code,
    incomeTaxRate: bracket.incomeTaxRate,
    accRate: ACC_EARNERS_LEVY_RATE,
    totalWithholdingRate,
    bracketLabel: bracket.label,
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateSecondaryTax(
  primaryIncome: number,
  invoices: InvoiceRow[],
): TaxResult {
  const secondaryGross = invoices.reduce((sum, row) => sum + row.amount, 0)
  const combinedIncome = primaryIncome + secondaryGross
  const taxCodeInfo = resolveSecondaryTaxCode(combinedIncome)

  const rows = invoices.map((invoice) => {
    const tax = roundCurrency(
      invoice.amount * taxCodeInfo.totalWithholdingRate,
    )
    return {
      ...invoice,
      tax,
      net: roundCurrency(invoice.amount - tax),
    }
  })

  const totalTax = roundCurrency(
    rows.reduce((sum, row) => sum + row.tax, 0),
  )

  return {
    primaryIncome,
    secondaryGross: roundCurrency(secondaryGross),
    combinedIncome: roundCurrency(combinedIncome),
    taxCode: taxCodeInfo.code,
    incomeTaxRate: taxCodeInfo.incomeTaxRate,
    accRate: taxCodeInfo.accRate,
    totalWithholdingRate: taxCodeInfo.totalWithholdingRate,
    totalTax,
    netSecondary: roundCurrency(secondaryGross - totalTax),
    rows,
  }
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
