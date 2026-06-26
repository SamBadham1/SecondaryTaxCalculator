import type { ColumnMapping } from '../types/invoice'

interface ColumnMapperProps {
  headers: string[]
  mapping: ColumnMapping
  onChange: (mapping: ColumnMapping) => void
}

export function ColumnMapper({
  headers,
  mapping,
  onChange,
}: ColumnMapperProps) {
  return (
    <section className="panel panel-warning">
      <h3>Map CSV columns</h3>
      <p className="helper-text">
        We could not detect your amount column automatically. Choose which
        columns to use.
      </p>
      <div className="mapper-grid">
        <label className="field-label" htmlFor="amount-column">
          Amount column
        </label>
        <select
          id="amount-column"
          className="select"
          value={mapping.amount}
          onChange={(event) =>
            onChange({ ...mapping, amount: event.target.value })
          }
        >
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>

        <label className="field-label" htmlFor="date-column">
          Date column (optional)
        </label>
        <select
          id="date-column"
          className="select"
          value={mapping.date ?? ''}
          onChange={(event) =>
            onChange({
              ...mapping,
              date: event.target.value || undefined,
            })
          }
        >
          <option value="">None</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>

        <label className="field-label" htmlFor="description-column">
          Description column (optional)
        </label>
        <select
          id="description-column"
          className="select"
          value={mapping.description ?? ''}
          onChange={(event) =>
            onChange({
              ...mapping,
              description: event.target.value || undefined,
            })
          }
        >
          <option value="">None</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>
      </div>
    </section>
  )
}
