import type { ChangeEvent, DragEvent } from 'react'

interface CsvUploadProps {
  fileName?: string
  isLoading: boolean
  onFileSelected: (file: File) => void
  error?: string
}

export function CsvUpload({
  fileName,
  isLoading,
  onFileSelected,
  error,
}: CsvUploadProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      onFileSelected(file)
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      onFileSelected(file)
    }
  }

  return (
    <section className="panel">
      <h2>Secondary job invoices</h2>
      <p className="helper-text">
        Upload a CSV of payments or invoices from your second job. Amounts are
        treated as gross secondary income for the tax year.
      </p>
      <label
        className="upload-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleChange}
          hidden
        />
        <span className="upload-title">
          {isLoading ? 'Reading CSV…' : 'Drop CSV here or click to browse'}
        </span>
        {fileName ? (
          <span className="upload-file-name">{fileName}</span>
        ) : null}
      </label>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  )
}
