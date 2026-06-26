export const TAX_YEAR_LABEL = '2025–2026 (1 Apr 2025 – 31 Mar 2026)'

export const ACC_EARNERS_LEVY_RATE = 0.0167

export interface TaxBracket {
  code: string
  min: number
  max: number | null
  incomeTaxRate: number
  label: string
}

export const SECONDARY_TAX_BRACKETS: TaxBracket[] = [
  {
    code: 'SB',
    min: 0,
    max: 15600,
    incomeTaxRate: 0.105,
    label: '$0 – $15,600',
  },
  {
    code: 'S',
    min: 15601,
    max: 53500,
    incomeTaxRate: 0.175,
    label: '$15,601 – $53,500',
  },
  {
    code: 'SH',
    min: 53501,
    max: 78100,
    incomeTaxRate: 0.3,
    label: '$53,501 – $78,100',
  },
  {
    code: 'ST',
    min: 78101,
    max: 180000,
    incomeTaxRate: 0.33,
    label: '$78,101 – $180,000',
  },
  {
    code: 'SA',
    min: 180001,
    max: null,
    incomeTaxRate: 0.39,
    label: '$180,001 and over',
  },
]
