'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, Loader2, Building2, ArrowRight, ArrowLeft } from 'lucide-react'

const BUILDING_TYPES = ['Office', 'Retail', 'Hospital', 'School', 'Warehouse', 'Other']

export default function FileUpload() {
  const router = useRouter()
  const [step, setStep] = useState<'details' | 'upload'>('details')
  const [buildingName, setBuildingName] = useState('')
  const [buildingType, setBuildingType] = useState('')
  const [floorArea, setFloorArea] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const handleContinue = () => {
    if (!buildingName.trim()) {
      setError('Please enter a building name')
      return
    }
    if (!buildingType) {
      setError('Please select a building type')
      return
    }
    setError(null)
    setStep('upload')
  }

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
        setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
        return
      }

      setIsLoading(true)
      setError(null)
      setStatus('Uploading data...')

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('building_name', buildingName)
        formData.append('building_type', buildingType)
        if (floorArea) formData.append('floor_area_sqft', floorArea)

        setStatus('Analyzing with Claude AI — this takes ~15 seconds...')
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed')
        }

        setStatus('Done! Loading your dashboard...')
        router.push(`/dashboard/${data.uploadId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setIsLoading(false)
        setStatus('')
      }
    },
    [router, buildingName, buildingType, floorArea]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (step === 'details') {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-green-600" />
          <p className="text-sm font-medium text-gray-600">Tell us about your building</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Building Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            placeholder="e.g. Prestige Tech Park Block A"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Building Type <span className="text-red-500">*</span>
          </label>
          <select
            value={buildingType}
            onChange={(e) => setBuildingType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value="">Select type...</option>
            {BUILDING_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Floor Area <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={floorArea}
              onChange={(e) => setFloorArea(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent pr-16"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">sq ft</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
        >
          Analyze My Energy Data
          <ArrowRight className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
          <FileText className="h-4 w-4" />
          <a href="/sample-energy-data.csv" download className="text-green-600 hover:underline">
            Download sample CSV
          </a>
          <span>to try the demo</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Building2 className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-sm font-medium text-gray-700">{buildingName}</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{buildingType}</span>
          {floorArea && (
            <span className="text-xs text-gray-400">{Number(floorArea).toLocaleString('en-IN')} sq ft</span>
          )}
        </div>
        <button
          onClick={() => { setStep('details'); setError(null) }}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors shrink-0 ml-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Edit
        </button>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-green-500 bg-green-50 scale-[1.02]'
            : 'border-green-300 bg-white hover:bg-green-50 hover:border-green-400'
        } ${isLoading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <div className="flex flex-col items-center gap-3 text-center px-6">
          {isLoading ? (
            <>
              <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
              <p className="text-green-700 font-medium text-sm">{status}</p>
            </>
          ) : (
            <>
              <div className="p-3 bg-green-100 rounded-full">
                <Upload className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <p className="text-base font-medium text-gray-700">
                  Drop your CSV here, or{' '}
                  <span className="text-green-600 underline">browse</span>
                </p>
                        <p className="text-sm text-gray-400 mt-1">
                  CSV or Excel — Month, kWh, Cost (INR)
                </p>
              </div>
            </>
          )}
        </div>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />
      </label>

      {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

      <div className="mt-4 flex items-center justify-center gap-1.5 text-sm text-gray-500">
        <FileText className="h-4 w-4" />
        <a href="/sample-energy-data.csv" download className="text-green-600 hover:underline">
          Download sample CSV
        </a>
        <span>to try the demo</span>
      </div>
    </div>
  )
}
