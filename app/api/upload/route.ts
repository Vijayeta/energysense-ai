import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { parseEnergyCSV, parseEnergyExcel } from '@/lib/parseCSV'
import { analyzeEnergyData } from '@/lib/claude'
import { EnergyReading } from '@/types'

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls']

function getExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.')).toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return Response.json(
        { error: 'Only CSV and Excel files (.csv, .xlsx, .xls) are supported' },
        { status: 400 }
      )
    }

    const buildingName = (formData.get('building_name') as string | null) ?? null
    const buildingType = (formData.get('building_type') as string | null) ?? null
    const floorAreaStr = formData.get('floor_area_sqft') as string | null
    const floorAreaSqft = floorAreaStr ? Number(floorAreaStr) : null

    let readings: EnergyReading[]

    if (ext === '.csv') {
      const csvText = await file.text()
      readings = parseEnergyCSV(csvText)
    } else {
      const buffer = await file.arrayBuffer()
      readings = parseEnergyExcel(buffer)
    }

    if (readings.length === 0) {
      return Response.json(
        { error: 'No valid energy data found. Check that your file has Month, kWh and Cost columns.' },
        { status: 400 }
      )
    }

    const { data: upload, error: uploadError } = await supabase
      .from('energy_uploads')
      .insert({
        filename: file.name,
        building_name: buildingName,
        building_type: buildingType,
        floor_area_sqft: floorAreaSqft,
      })
      .select()
      .single()

    if (uploadError) throw new Error(`Failed to save upload: ${uploadError.message}`)

    const { error: readingsError } = await supabase
      .from('energy_readings')
      .insert(readings.map((r) => ({ ...r, upload_id: upload.id })))

    if (readingsError) throw new Error(`Failed to save readings: ${readingsError.message}`)

    const building =
      buildingName && buildingType
        ? { buildingName, buildingType, floorAreaSqft: floorAreaSqft ?? undefined }
        : undefined

    const analysis = await analyzeEnergyData(readings, building)

    const { error: analysisError } = await supabase.from('ai_analyses').insert({
      upload_id: upload.id,
      anomalies: analysis.anomalies,
      recommendations: analysis.recommendations,
      summary: analysis.summary,
      savings_total: analysis.savings_total,
    })

    if (analysisError) throw new Error(`Failed to save analysis: ${analysisError.message}`)

    return Response.json({ uploadId: upload.id })
  } catch (error) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process file'
    return Response.json({ error: message }, { status: 500 })
  }
}
