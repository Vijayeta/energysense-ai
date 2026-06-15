import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { EnergyReading } from '@/types'

export function parseEnergyCSV(csvText: string): EnergyReading[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  return result.data
    .map((row) => {
      const keys = Object.keys(row)
      const periodKey = keys[0]
      const kwhKey = keys.find(
        (k) => k.toLowerCase().includes('kwh') || k.toLowerCase().includes('energy')
      )
      const costKey = keys.find(
        (k) => k.toLowerCase().includes('cost') || k.toLowerCase().includes('inr')
      )

      if (!kwhKey || !costKey) return null

      return {
        period: row[periodKey],
        kwh: parseFloat(row[kwhKey]) || 0,
        cost: parseFloat(row[costKey]) || 0,
      }
    })
    .filter((r): r is EnergyReading => r !== null && r.kwh > 0)
}

export function parseEnergyExcel(buffer: ArrayBuffer): EnergyReading[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const csvText = XLSX.utils.sheet_to_csv(firstSheet)
  return parseEnergyCSV(csvText)
}
