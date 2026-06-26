import type { InvoiceRow } from './invoice'

export interface SecondaryTaxCode {
  code: string
  incomeTaxRate: number
  accRate: number
  totalWithholdingRate: number
  bracketLabel: string
}

export interface TaxResultRow extends InvoiceRow {
  tax: number
  net: number
}

export interface TaxResult {
  primaryIncome: number
  secondaryGross: number
  combinedIncome: number
  taxCode: string
  incomeTaxRate: number
  accRate: number
  totalWithholdingRate: number
  totalTax: number
  netSecondary: number
  rows: TaxResultRow[]
}
