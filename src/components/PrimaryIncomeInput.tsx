interface PrimaryIncomeInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function PrimaryIncomeInput({
  value,
  onChange,
  error,
}: PrimaryIncomeInputProps) {
  return (
    <section className="panel">
      <h2>Primary job income</h2>
      <p className="helper-text">
        Enter your expected annual gross income from your main job. This
        determines which secondary tax code applies to your second job.
      </p>
      <label className="field-label" htmlFor="primary-income">
        Annual gross income (NZD)
      </label>
      <div className="input-with-prefix">
        <span className="input-prefix">$</span>
        <input
          id="primary-income"
          type="number"
          min="0"
          step="0.01"
          placeholder="45000"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={error ? 'input input-error' : 'input'}
        />
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}
