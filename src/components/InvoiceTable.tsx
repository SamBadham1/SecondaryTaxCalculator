import type { TaxResultRow } from '../types/tax'
import { formatCurrency } from '../lib/tax/nzSecondaryTax'

interface InvoiceTableProps {
  rows: TaxResultRow[]
}

export function InvoiceTable({ rows }: InvoiceTableProps) {
  if (rows.length === 0) {
    return null
  }

  const hasDate = rows.some((row) => row.date)
  const hasDescription = rows.some((row) => row.description)

  return (
    <section className="panel">
      <h2>Invoice breakdown</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {hasDate ? <th>Date</th> : null}
              {hasDescription ? <th>Description</th> : null}
              <th>Gross</th>
              <th>Tax</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.invoiceNumber ?? 'inv'}-${row.date ?? 'row'}-${row.amount}-${index}`}
              >
                {hasDate ? <td>{row.date ?? '—'}</td> : null}
                {hasDescription ? <td>{row.description ?? '—'}</td> : null}
                <td>{formatCurrency(row.amount)}</td>
                <td>{formatCurrency(row.tax)}</td>
                <td>{formatCurrency(row.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
