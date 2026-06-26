import { useMemo, useState } from 'react'
import { ColumnMapper } from './components/ColumnMapper'
import { CsvUpload } from './components/CsvUpload'
import { InvoiceTable } from './components/InvoiceTable'
import { PrimaryIncomeInput } from './components/PrimaryIncomeInput'
import { TaxSummary } from './components/TaxSummary'
import { needsColumnMapping, parseInvoiceCsv } from './lib/csv/parseInvoices'
import { calculateSecondaryTax } from './lib/tax/nzSecondaryTax'
import type { ColumnMapping, InvoiceRow, ParseError } from './types/invoice'
import './App.css'

function parsePrimaryIncome(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number.parseFloat(trimmed)
  if (Number.isNaN(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export default function App() {
  const [primaryIncomeInput, setPrimaryIncomeInput] = useState('')
  const [primaryIncomeError, setPrimaryIncomeError] = useState<string>()
  const [csvFileName, setCsvFileName] = useState<string>()
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvError, setCsvError] = useState<string>()
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(
    null,
  )
  const [requiresManualMapping, setRequiresManualMapping] = useState(false)
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [aggregationNote, setAggregationNote] = useState<string>()
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const primaryIncome = useMemo(
    () => parsePrimaryIncome(primaryIncomeInput),
    [primaryIncomeInput],
  )

  const taxResult = useMemo(() => {
    if (primaryIncome === null || invoices.length === 0) {
      return null
    }

    return calculateSecondaryTax(primaryIncome, invoices)
  }, [primaryIncome, invoices])

  async function loadCsv(file: File, mapping?: ColumnMapping) {
    setCsvLoading(true)
    setCsvError(undefined)
    setCsvFileName(file.name)
    setPendingFile(file)

    try {
      const result = await parseInvoiceCsv(file, mapping)

      setHeaders(result.headers)
      setParseErrors(result.errors)

      if (needsColumnMapping(result)) {
        const fallbackMapping: ColumnMapping = {
          amount: result.headers[0] ?? '',
          date: result.headers[1],
          description: result.headers[2],
        }
        setColumnMapping(fallbackMapping)
        setRequiresManualMapping(true)
        setInvoices([])
        setAggregationNote(undefined)
        return
      }

      setColumnMapping(result.suggestedMapping)
      setRequiresManualMapping(false)
      setInvoices(result.rows)
      setAggregationNote(result.aggregationNote)

      if (result.rows.length === 0 && result.errors.length > 0) {
        setCsvError('No valid invoice rows were found in the CSV.')
      }
    } catch (error) {
      setCsvError(
        error instanceof Error ? error.message : 'Failed to read CSV file.',
      )
      setInvoices([])
      setHeaders([])
      setColumnMapping(null)
      setRequiresManualMapping(false)
      setAggregationNote(undefined)
    } finally {
      setCsvLoading(false)
    }
  }

  async function handleMappingChange(mapping: ColumnMapping) {
    setColumnMapping(mapping)
    if (pendingFile) {
      await loadCsv(pendingFile, mapping)
    }
  }

  function handlePrimaryIncomeChange(value: string) {
    setPrimaryIncomeInput(value)

    if (!value.trim()) {
      setPrimaryIncomeError(undefined)
      return
    }

    if (parsePrimaryIncome(value) === null) {
      setPrimaryIncomeError('Enter a valid non-negative annual income.')
      return
    }

    setPrimaryIncomeError(undefined)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>NZ Secondary Job Tax Calculator</h1>
        <p>
          Estimate PAYE withholding on secondary employment income using IRD
          secondary tax codes.
        </p>
      </header>

      <main className="app-main">
        <div className="input-column">
          <PrimaryIncomeInput
            value={primaryIncomeInput}
            onChange={handlePrimaryIncomeChange}
            error={primaryIncomeError}
          />
          <CsvUpload
            fileName={csvFileName}
            isLoading={csvLoading}
            onFileSelected={(file) => loadCsv(file)}
            error={csvError}
          />
          {requiresManualMapping && columnMapping ? (
            <ColumnMapper
              headers={headers}
              mapping={columnMapping}
              onChange={handleMappingChange}
            />
          ) : null}
          {aggregationNote ? (
            <section className="panel panel-muted">
              <p className="helper-text">{aggregationNote}</p>
            </section>
          ) : null}
          {parseErrors.length > 0 ? (
            <section className="panel panel-warning">
              <h3>CSV warnings</h3>
              <ul className="error-list">
                {parseErrors.map((error) => (
                  <li key={`${error.row}-${error.message}`}>
                    {error.row > 0
                      ? `Row ${error.row}: ${error.message}`
                      : error.message}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="results-column">
          <TaxSummary result={taxResult} />
          {taxResult ? <InvoiceTable rows={taxResult.rows} /> : null}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Estimate only — not IRD or tax advice. Rates reflect the 2025–2026
          NZ tax year secondary PAYE codes plus ACC earners levy.
        </p>
      </footer>
    </div>
  )
}
