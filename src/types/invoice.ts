export interface InvoiceRow {
  date?: string
  description?: string
  amount: number
  invoiceNumber?: string
  customer?: string
}

export interface ColumnMapping {
  amount: string
  date?: string
  description?: string
}

export interface ParseError {
  row: number
  message: string
}

export interface ParsedCsvResult {
  headers: string[]
  rows: InvoiceRow[]
  errors: ParseError[]
  suggestedMapping: ColumnMapping | null
  aggregationNote?: string
}
