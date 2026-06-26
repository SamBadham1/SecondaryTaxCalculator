import { TAX_YEAR_LABEL } from '../lib/tax/brackets'
import {
  formatCurrency,
  formatPercent,
} from '../lib/tax/nzSecondaryTax'
import type { TaxResult } from '../types/tax'

interface TaxSummaryProps {
  result: TaxResult | null
}

export function TaxSummary({ result }: TaxSummaryProps) {
  if (!result) {
    return (
      <section className="panel panel-muted">
        <h2>Tax summary</h2>
        <p className="helper-text">
          Enter your primary income and upload a CSV to see your secondary tax
          code and withholding estimate.
        </p>
      </section>
    )
  }

  return (
    <section className="panel panel-highlight">
      <h2>Tax summary</h2>
      <p className="tax-year">{TAX_YEAR_LABEL}</p>
      <dl className="summary-grid">
        <div>
          <dt>Combined annual income</dt>
          <dd>{formatCurrency(result.combinedIncome)}</dd>
        </div>
        <div>
          <dt>Secondary tax code</dt>
          <dd className="tax-code">{result.taxCode}</dd>
        </div>
        <div>
          <dt>Income tax rate</dt>
          <dd>{formatPercent(result.incomeTaxRate)}</dd>
        </div>
        <div>
          <dt>ACC earners levy</dt>
          <dd>{formatPercent(result.accRate)}</dd>
        </div>
        <div>
          <dt>Total withholding rate</dt>
          <dd>{formatPercent(result.totalWithholdingRate)}</dd>
        </div>
        <div>
          <dt>Secondary gross income</dt>
          <dd>{formatCurrency(result.secondaryGross)}</dd>
        </div>
        <div>
          <dt>Estimated tax withheld</dt>
          <dd>{formatCurrency(result.totalTax)}</dd>
        </div>
        <div>
          <dt>Estimated net secondary income</dt>
          <dd className="summary-total">{formatCurrency(result.netSecondary)}</dd>
        </div>
      </dl>
    </section>
  )
}
