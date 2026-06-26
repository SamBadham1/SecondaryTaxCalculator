import Papa from 'papaparse'
import type {
  ColumnMapping,
  InvoiceRow,
  ParsedCsvResult,
} from '../../types/invoice'

const AMOUNT_ALIASES = [
  'amount',
  'gross',
  'value',
  'payment',
  'invoice_amount',
  'invoice total',
]

const DATE_ALIASES = [
  'date',
  'invoice_date',
  'paid_date',
  'payment_date',
  'invoice date',
]

const LINE_ITEM_ALIASES = ['item', 'line_item', 'line item', 'service']

const DESCRIPTION_ALIASES = [
  ...LINE_ITEM_ALIASES,
  'description',
  'invoice',
  'reference',
  'client',
  'details',
  'memo',
  'note',
]

const INVOICE_NUMBER_ALIASES = ['number', 'invoice_number', 'invoice number']
const CUSTOMER_ALIASES = ['customer', 'client', 'customer_name']
const UNIT_COST_ALIASES = ['unit_cost', 'unit cost', 'rate', 'price']
const QUANTITY_ALIASES = ['quantity', 'qty', 'hours']

interface LineItemColumns {
  number: string
  unitCost: string
  quantity: string
  customer?: string
  date?: string
  description?: string
  total?: string
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findColumn(headers: string[], aliases: string[]): string | undefined {
  const normalized = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }))

  for (const alias of aliases) {
    const match = normalized.find((header) => header.normalized === alias)
    if (match) {
      return match.original
    }
  }

  for (const alias of aliases) {
    const match = normalized.find((header) =>
      header.normalized.includes(alias),
    )
    if (match) {
      return match.original
    }
  }

  return undefined
}

export function detectLineItemColumns(
  headers: string[],
): LineItemColumns | null {
  const number = findColumn(headers, INVOICE_NUMBER_ALIASES)
  const unitCost = findColumn(headers, UNIT_COST_ALIASES)
  const quantity = findColumn(headers, QUANTITY_ALIASES)

  if (!number || !unitCost) {
    return null
  }

  return {
    number,
    unitCost,
    quantity: quantity ?? '',
    customer: findColumn(headers, CUSTOMER_ALIASES),
    date: findColumn(headers, DATE_ALIASES),
    description: findColumn(headers, DESCRIPTION_ALIASES),
    total: findColumn(headers, ['total', 'invoice total']),
  }
}

export function detectColumnMapping(headers: string[]): ColumnMapping | null {
  if (detectLineItemColumns(headers)) {
    const unitCost = findColumn(headers, UNIT_COST_ALIASES)!
    return {
      amount: unitCost,
      date: findColumn(headers, DATE_ALIASES),
      description: findColumn(headers, DESCRIPTION_ALIASES),
    }
  }

  const amount = findColumn(headers, [...AMOUNT_ALIASES, 'total'])
  if (!amount) {
    return null
  }

  return {
    amount,
    date: findColumn(headers, DATE_ALIASES),
    description: findColumn(headers, DESCRIPTION_ALIASES),
  }
}

function parseAmount(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const raw = String(value).trim()
  if (!raw) {
    return null
  }

  const cleaned = raw.replace(/[$,\s]/g, '')
  const parsed = Number.parseFloat(cleaned)
  if (Number.isNaN(parsed)) {
    return null
  }

  return parsed
}

function isEmptyRow(record: Record<string, unknown>): boolean {
  return Object.values(record).every(
    (value) => String(value ?? '').trim() === '',
  )
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function invoiceGroupKey(
  record: Record<string, unknown>,
  columns: LineItemColumns,
): string {
  const number = String(record[columns.number] ?? '').trim()
  const customer = columns.customer
    ? String(record[columns.customer] ?? '').trim()
    : ''
  const date = columns.date
    ? String(record[columns.date] ?? '').trim()
    : ''

  return `${customer}|${number}|${date}`
}

function lineItemKey(description: string, amount: number): string {
  return `${description}|${amount}`
}

function aggregateLineItemExport(
  records: Record<string, unknown>[],
  columns: LineItemColumns,
): ParsedCsvResult {
  const errors: ParsedCsvResult['errors'] = []
  const groups = new Map<
    string,
    {
      invoiceNumber: string
      customer?: string
      date?: string
      lineItems: Map<string, number>
    }
  >()

  records.forEach((record, index) => {
    if (isEmptyRow(record)) {
      return
    }

    const rowNumber = index + 2
    const unitCost = parseAmount(record[columns.unitCost])

    if (unitCost === null || unitCost <= 0) {
      errors.push({
        row: rowNumber,
        message: `Could not parse line amount from "${columns.unitCost}".`,
      })
      return
    }

    const quantityRaw = columns.quantity
      ? parseAmount(record[columns.quantity])
      : 1
    const quantity = quantityRaw === null || quantityRaw <= 0 ? 1 : quantityRaw
    const lineAmount = roundCurrency(unitCost * quantity)

    const description = columns.description
      ? String(record[columns.description] ?? '').trim()
      : String(record.item ?? '').trim()

    const groupKey = invoiceGroupKey(record, columns)
    const invoiceNumber = String(record[columns.number] ?? '').trim()
    const customer = columns.customer
      ? String(record[columns.customer] ?? '').trim()
      : undefined
    const date = columns.date
      ? String(record[columns.date] ?? '').trim()
      : undefined

    let group = groups.get(groupKey)
    if (!group) {
      group = {
        invoiceNumber,
        customer,
        date,
        lineItems: new Map(),
      }
      groups.set(groupKey, group)
    }

    const itemKey = lineItemKey(description, lineAmount)
    group.lineItems.set(itemKey, lineAmount)
  })

  const rows: InvoiceRow[] = [...groups.values()]
    .map((group) => {
      const amount = roundCurrency(
        [...group.lineItems.values()].reduce((sum, value) => sum + value, 0),
      )

      const labelParts = [
        group.invoiceNumber ? `Invoice ${group.invoiceNumber}` : undefined,
        group.customer,
      ].filter(Boolean)

      return {
        amount,
        ...(group.date ? { date: group.date } : {}),
        description: labelParts.join(' — ') || undefined,
        invoiceNumber: group.invoiceNumber || undefined,
        customer: group.customer,
      }
    })
    .sort((a, b) => {
      const dateA = a.date ? Date.parse(a.date) : 0
      const dateB = b.date ? Date.parse(b.date) : 0
      if (dateA !== dateB) {
        return dateB - dateA
      }
      return (b.invoiceNumber ?? '').localeCompare(a.invoiceNumber ?? '')
    })

  const lineItemCount = records.filter((record) => !isEmptyRow(record)).length

  return {
    headers: Object.keys(records[0] ?? {}),
    rows,
    errors,
    suggestedMapping: detectColumnMapping(Object.keys(records[0] ?? {})),
    aggregationNote:
      lineItemCount > rows.length
        ? `Grouped ${lineItemCount} line items into ${rows.length} invoices (using unit cost × quantity, not repeated invoice totals).`
        : undefined,
  }
}

function mapRecordsToInvoices(
  records: Record<string, unknown>[],
  mapping: ColumnMapping,
): ParsedCsvResult {
  const rows: InvoiceRow[] = []
  const errors: ParsedCsvResult['errors'] = []

  records.forEach((record, index) => {
    if (isEmptyRow(record)) {
      return
    }

    const rowNumber = index + 2
    const amount = parseAmount(record[mapping.amount])

    if (amount === null) {
      errors.push({
        row: rowNumber,
        message: `Could not parse amount from column "${mapping.amount}".`,
      })
      return
    }

    if (amount <= 0) {
      errors.push({
        row: rowNumber,
        message: 'Amount must be greater than zero.',
      })
      return
    }

    const dateValue = mapping.date
      ? String(record[mapping.date] ?? '').trim()
      : ''
    const descriptionValue = mapping.description
      ? String(record[mapping.description] ?? '').trim()
      : ''

    rows.push({
      amount,
      ...(dateValue ? { date: dateValue } : {}),
      ...(descriptionValue ? { description: descriptionValue } : {}),
    })
  })

  return {
    headers: Object.keys(records[0] ?? {}),
    rows,
    errors,
    suggestedMapping: mapping,
  }
}

function parseRecords(
  records: Record<string, unknown>[],
  mappingOverride?: ColumnMapping,
): ParsedCsvResult {
  if (records.length === 0) {
    return {
      headers: [],
      rows: [],
      errors: [{ row: 0, message: 'CSV file contains no data rows.' }],
      suggestedMapping: null,
    }
  }

  const headers = Object.keys(records[0])
  const lineItemColumns = detectLineItemColumns(headers)

  if (lineItemColumns) {
    return aggregateLineItemExport(records, lineItemColumns)
  }

  const mapping = mappingOverride ?? detectColumnMapping(headers)

  if (!mapping) {
    return {
      headers,
      rows: [],
      errors: [
        {
          row: 0,
          message: 'Could not detect an amount column. Map columns manually.',
        },
      ],
      suggestedMapping: null,
    }
  }

  return mapRecordsToInvoices(records, mapping)
}

export function parseInvoiceCsvFromText(
  csv: string,
  mappingOverride?: ColumnMapping,
): ParsedCsvResult {
  const results = Papa.parse<Record<string, unknown>>(csv, {
    header: true,
    skipEmptyLines: true,
  })

  const records = results.data.filter((record) => !isEmptyRow(record))
  return parseRecords(records, mappingOverride)
}

export function parseInvoiceCsv(
  file: File,
  mappingOverride?: ColumnMapping,
): Promise<ParsedCsvResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const records = results.data.filter((record) => !isEmptyRow(record))
        resolve(parseRecords(records, mappingOverride))
      },
      error: (error) => {
        reject(new Error(error.message))
      },
    })
  })
}

export function needsColumnMapping(result: ParsedCsvResult): boolean {
  return result.suggestedMapping === null && result.headers.length > 0
}
