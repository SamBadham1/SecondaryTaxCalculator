import { describe, expect, it } from 'vitest'
import {
  detectColumnMapping,
  detectLineItemColumns,
  parseInvoiceCsvFromText,
} from './parseInvoices'

const SAMPLE_HEADER =
  'customer,type,number,date,due_date,payment_terms,purchase_order,currency,total,amount_paid,balance,ship_to.name,notes,terms,item,description,quantity,unit_cost,discount,tax,shipping'

const SAMPLE_ROWS = [
  '"Sweat Yoga",invoice,16,"Jun 22, 2026","Jun 23, 2026",,,NZD,480,0,480,,,,"Vinyasa 8/6",,1,80,0,0,0',
  '"Sweat Yoga",invoice,16,"Jun 22, 2026","Jun 23, 2026",,,NZD,480,0,480,,,,"Vinyasa 13/6",,1,80,0,0,0',
  '"Sweat Yoga",invoice,16,"Jun 22, 2026","Jun 23, 2026",,,NZD,480,0,480,,,,"Vinyasa 15/6",,1,80,0,0,0',
  '"Sweat Yoga",invoice,15,"Jun 8, 2026","Jun 9, 2026",,,NZD,640,0,640,,,,"Vinyasa 25/5",,1,80,0,0,0',
  '"Sweat Yoga",invoice,15,"Jun 8, 2026","Jun 9, 2026",,,NZD,640,0,640,,,,"Vinyasa 30/5",,1,80,0,0,0',
]

describe('detectLineItemColumns', () => {
  it('detects invoice export columns', () => {
    const headers = SAMPLE_HEADER.split(',')
    const columns = detectLineItemColumns(headers)
    expect(columns).not.toBeNull()
    expect(columns?.number).toBe('number')
    expect(columns?.unitCost).toBe('unit_cost')
    expect(columns?.quantity).toBe('quantity')
    expect(columns?.customer).toBe('customer')
    expect(columns?.date).toBe('date')
  })

  it('prefers unit_cost over total for amount mapping', () => {
    const headers = SAMPLE_HEADER.split(',')
    const mapping = detectColumnMapping(headers)
    expect(mapping?.amount).toBe('unit_cost')
  })
})

describe('line item CSV parsing', () => {
  it('groups line items by invoice and sums unit_cost × quantity', () => {
    const csv = [SAMPLE_HEADER, ...SAMPLE_ROWS].join('\n')
    const result = parseInvoiceCsvFromText(csv)

    expect(result.rows).toHaveLength(2)
    expect(result.aggregationNote).toContain('Grouped 5 line items into 2 invoices')

    const invoice16 = result.rows.find((row) => row.invoiceNumber === '16')
    const invoice15 = result.rows.find((row) => row.invoiceNumber === '15')

    expect(invoice16?.amount).toBe(240)
    expect(invoice15?.amount).toBe(160)
    expect(result.rows.reduce((sum, row) => sum + row.amount, 0)).toBe(400)
  })

  it('deduplicates identical line items within an invoice', () => {
    const duplicateRows = [
      '"Sweat Yoga",invoice,11,"Apr 13, 2026","Apr 14, 2026",,,NZD,480,0,480,,,,"Vinyasa 6/4",,1,80,0,0,0',
      '"Sweat Yoga",invoice,11,"Apr 13, 2026","Apr 14, 2026",,,NZD,480,0,480,,,,"Vinyasa 7/4",,1,80,0,0,0',
      '"Sweat Yoga",invoice,11,"Apr 13, 2026","Apr 14, 2026",,,NZD,480,0,480,,,,"Vinyasa 6/4",,1,80,0,0,0',
      '"Sweat Yoga",invoice,11,"Apr 13, 2026","Apr 14, 2026",,,NZD,480,0,480,,,,"Vinyasa 7/4",,1,80,0,0,0',
    ]
    const csv = [SAMPLE_HEADER, ...duplicateRows].join('\n')
    const result = parseInvoiceCsvFromText(csv)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].amount).toBe(160)
  })

  it('does not multiply by repeated invoice total column', () => {
    const csv = [SAMPLE_HEADER, SAMPLE_ROWS[0]].join('\n')
    const result = parseInvoiceCsvFromText(csv)

    expect(result.rows[0].amount).toBe(80)
    expect(result.rows[0].amount).not.toBe(480)
  })
})
