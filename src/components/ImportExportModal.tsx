import { useState, useRef, useCallback, useMemo } from 'react'
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, File, Loader2 } from 'lucide-react'
import { useCrm } from '../context/CrmContext'
import { STATUS_LABELS } from '../types/crm'
import type { Lead } from '../types/crm'

// ---- CSV helpers (no external lib) ----

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
  return lines.map(parseCSVLine)
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return '"' + val.replace(/"/g, '""') + '"'
  }
  return val
}

// ---- Column mapping ----

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'phone', label: 'Telefono' },
  { key: 'status', label: 'Estado' },
  { key: 'score', label: 'Score' },
  { key: 'property_interest', label: 'Interes' },
  { key: 'budget', label: 'Presupuesto' },
  { key: 'source', label: 'Fuente' },
  { key: 'assigned_to', label: 'Vendedor' },
  { key: 'temperature', label: 'Temperatura' },
  { key: 'credit_status', label: 'Estatus Credito' },
  { key: 'created_at', label: 'Creado' },
  { key: 'updated_at', label: 'Actualizado' },
] as const

type ExportKey = typeof EXPORT_COLUMNS[number]['key']

// Auto-detect mapping from header name
const HEADER_ALIASES: Record<string, ExportKey> = {
  nombre: 'name', name: 'name',
  telefono: 'phone', phone: 'phone', tel: 'phone', celular: 'phone',
  estado: 'status', status: 'status', etapa: 'status',
  score: 'score', puntaje: 'score', puntuacion: 'score',
  interes: 'property_interest', property_interest: 'property_interest', desarrollo: 'property_interest', propiedad: 'property_interest',
  presupuesto: 'budget', budget: 'budget',
  fuente: 'source', source: 'source', origen: 'source',
  vendedor: 'assigned_to', assigned_to: 'assigned_to', asignado: 'assigned_to',
  temperatura: 'temperature', temperature: 'temperature',
  credito: 'credit_status', credit_status: 'credit_status', estatus_credito: 'credit_status',
  creado: 'created_at', created_at: 'created_at', fecha: 'created_at', fecha_creacion: 'created_at',
  actualizado: 'updated_at', updated_at: 'updated_at',
}

const STATUS_REVERSE: Record<string, string> = {}
for (const [k, v] of Object.entries(STATUS_LABELS)) {
  STATUS_REVERSE[v.toLowerCase()] = k
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '')
}

function isValidPhone(phone: string): boolean {
  const cleaned = normalizePhone(phone)
  return cleaned.length >= 8 && cleaned.length <= 15
}

// ---- Types ----

interface ImportRow {
  rowIndex: number
  raw: Record<string, string>
  mapped: Partial<Lead>
  errors: string[]
  isDuplicate: boolean
  duplicateOf?: string
}

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab: 'import' | 'export'
  displayLeads: Lead[]
}

export default function ImportExportModal({ isOpen, onClose, initialTab, displayLeads }: ImportExportModalProps) {
  const { leads, team, supabase, showToast, currentUser, loadData } = useCrm()
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab)

  // Export state
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered')

  // Import state
  const [dragOver, setDragOver] = useState(false)
  const [csvData, setCsvData] = useState<string[][] | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<number, ExportKey | ''>>({})
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- Export ----

  const leadsToExport = exportScope === 'filtered' ? displayLeads : leads

  const handleExport = useCallback(() => {
    const headers = EXPORT_COLUMNS.map(c => c.label)
    const rows = leadsToExport.map(lead => {
      return EXPORT_COLUMNS.map(col => {
        const val = (lead as any)[col.key]
        if (col.key === 'status') return STATUS_LABELS[val] || val || ''
        if (col.key === 'assigned_to') return team.find(t => t.id === val)?.name || ''
        if (col.key === 'created_at' || col.key === 'updated_at') {
          return val ? new Date(val).toLocaleDateString('es-MX') : ''
        }
        if (col.key === 'score') return String(val ?? 0)
        return String(val || '')
      })
    })

    const csv = [headers, ...rows].map(r => r.map(c => escapeCSV(c)).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`${leadsToExport.length} leads exportados`, 'success')
    onClose()
  }, [leadsToExport, team, showToast, onClose])

  // ---- Import: file handling ----

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      showToast('Solo se aceptan archivos CSV', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) return
      const parsed = parseCSV(text)
      if (parsed.length < 2) {
        showToast('El archivo esta vacio o no tiene datos', 'error')
        return
      }
      const headers = parsed[0]
      setCsvHeaders(headers)
      setCsvData(parsed)

      // Auto-detect column mapping
      const mapping: Record<number, ExportKey | ''> = {}
      headers.forEach((h, i) => {
        const normalized = h.toLowerCase().replace(/[^a-z_]/g, '').trim()
        const match = HEADER_ALIASES[normalized]
        mapping[i] = match || ''
      })
      setColumnMapping(mapping)
      setImportResult(null)

      // Process rows
      processRows(parsed, mapping)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const processRows = useCallback((data: string[][], mapping: Record<number, ExportKey | ''>) => {
    if (!data || data.length < 2) return
    const existingPhones = new Set(leads.map(l => normalizePhone(l.phone)))
    const seenPhones = new Map<string, number>()
    const rows: ImportRow[] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const raw: Record<string, string> = {}
      const mapped: Partial<Lead> = {}
      const errors: string[] = []

      data[0].forEach((header, colIdx) => {
        raw[header] = row[colIdx] || ''
        const fieldKey = mapping[colIdx]
        if (!fieldKey) return

        let value = (row[colIdx] || '').trim()
        if (!value) return

        if (fieldKey === 'status') {
          // Try reverse-mapping from Spanish label
          const lower = value.toLowerCase()
          const reverseKey = STATUS_REVERSE[lower]
          if (reverseKey) {
            value = reverseKey
          } else if (!STATUS_LABELS[value]) {
            // If it doesn't match any known status, default to 'new'
            value = 'new'
          }
        }

        if (fieldKey === 'assigned_to') {
          // Try to find team member by name
          const member = team.find(t => t.name.toLowerCase() === value.toLowerCase())
          if (member) value = member.id
          else value = ''
        }

        if (fieldKey === 'score') {
          const num = parseInt(value)
          if (!isNaN(num)) (mapped as any).score = Math.max(0, Math.min(100, num))
          return
        }

        ;(mapped as any)[fieldKey] = value
      })

      // Validate required fields
      if (!mapped.name) errors.push('Nombre requerido')
      if (!mapped.phone) errors.push('Telefono requerido')
      else if (!isValidPhone(mapped.phone)) errors.push('Telefono invalido')

      // Duplicate check
      const normalizedPhone = mapped.phone ? normalizePhone(mapped.phone) : ''
      let isDuplicate = false
      let duplicateOf = undefined

      if (normalizedPhone) {
        mapped.phone = normalizedPhone
        if (existingPhones.has(normalizedPhone)) {
          isDuplicate = true
          duplicateOf = 'BD existente'
        } else if (seenPhones.has(normalizedPhone)) {
          isDuplicate = true
          duplicateOf = `Fila ${seenPhones.get(normalizedPhone)}`
        } else {
          seenPhones.set(normalizedPhone, i)
        }
      }

      rows.push({ rowIndex: i, raw, mapped, errors, isDuplicate, duplicateOf })
    }

    setImportRows(rows)
  }, [leads, team])

  // Re-process when mapping changes
  const handleMappingChange = useCallback((colIdx: number, value: ExportKey | '') => {
    const newMapping = { ...columnMapping, [colIdx]: value }
    setColumnMapping(newMapping)
    if (csvData) processRows(csvData, newMapping)
  }, [columnMapping, csvData, processRows])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  // ---- Import: validation summary ----

  const validRows = useMemo(() => importRows.filter(r => r.errors.length === 0 && !r.isDuplicate), [importRows])
  const errorRows = useMemo(() => importRows.filter(r => r.errors.length > 0), [importRows])
  const duplicateRows = useMemo(() => importRows.filter(r => r.isDuplicate), [importRows])

  // ---- Import: execute ----

  const handleImport = useCallback(async () => {
    if (validRows.length === 0) return
    setImporting(true)
    setImportProgress(0)
    let imported = 0
    let skipped = 0

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i]
      try {
        const { error } = await supabase.from('leads').insert({
          name: row.mapped.name || '',
          phone: row.mapped.phone || '',
          property_interest: row.mapped.property_interest || '',
          budget: row.mapped.budget || '',
          status: row.mapped.status || 'new',
          score: row.mapped.score ?? 0,
          source: row.mapped.source || 'agency_import',
          assigned_to: row.mapped.assigned_to || currentUser?.id || null,
          temperature: row.mapped.temperature || null,
          credit_status: row.mapped.credit_status || null,
          created_at: new Date().toISOString(),
        })
        if (error) {
          console.error('Import row error:', error)
          skipped++
        } else {
          imported++
        }
      } catch {
        skipped++
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100))
    }

    // Reload leads in CRM context
    await loadData()

    setImporting(false)
    setImportResult({ imported, skipped })
    showToast(`${imported} leads importados, ${skipped} omitidos`, imported > 0 ? 'success' : 'error')
  }, [validRows, supabase, currentUser, showToast])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={22} className="text-blue-400" />
            <h2 className="text-xl font-bold text-white">Importar / Exportar Leads</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'export'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={16} /> Exportar
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'import'
                ? 'text-green-400 border-b-2 border-green-400 bg-slate-700/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={16} /> Importar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'export' ? (
            <ExportTab
              exportScope={exportScope}
              setExportScope={setExportScope}
              filteredCount={displayLeads.length}
              allCount={leads.length}
              handleExport={handleExport}
            />
          ) : (
            <ImportTab
              dragOver={dragOver}
              setDragOver={setDragOver}
              onDrop={onDrop}
              onFileSelect={onFileSelect}
              fileInputRef={fileInputRef}
              csvHeaders={csvHeaders}
              csvData={csvData}
              columnMapping={columnMapping}
              handleMappingChange={handleMappingChange}
              importRows={importRows}
              validRows={validRows}
              errorRows={errorRows}
              duplicateRows={duplicateRows}
              importing={importing}
              importProgress={importProgress}
              importResult={importResult}
              handleImport={handleImport}
              resetImport={() => {
                setCsvData(null)
                setCsvHeaders([])
                setColumnMapping({})
                setImportRows([])
                setImportResult(null)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Export Tab ----

function ExportTab({
  exportScope,
  setExportScope,
  filteredCount,
  allCount,
  handleExport,
}: {
  exportScope: 'filtered' | 'all'
  setExportScope: (s: 'filtered' | 'all') => void
  filteredCount: number
  allCount: number
  handleExport: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold mb-3">Alcance de la exportacion</h3>
        <div className="space-y-2">
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
            exportScope === 'filtered' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
          }`}>
            <input
              type="radio"
              checked={exportScope === 'filtered'}
              onChange={() => setExportScope('filtered')}
              className="accent-blue-500"
            />
            <div>
              <span className="text-white font-medium">Leads filtrados</span>
              <span className="text-slate-400 text-sm ml-2">({filteredCount} leads)</span>
              <p className="text-xs text-slate-500 mt-0.5">Solo los leads que se ven actualmente con los filtros aplicados</p>
            </div>
          </label>
          <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
            exportScope === 'all' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
          }`}>
            <input
              type="radio"
              checked={exportScope === 'all'}
              onChange={() => setExportScope('all')}
              className="accent-blue-500"
            />
            <div>
              <span className="text-white font-medium">Todos los leads</span>
              <span className="text-slate-400 text-sm ml-2">({allCount} leads)</span>
              <p className="text-xs text-slate-500 mt-0.5">Exportar la base de datos completa</p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-2">Columnas incluidas</h3>
        <div className="flex flex-wrap gap-1.5">
          {EXPORT_COLUMNS.map(col => (
            <span key={col.key} className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full">
              {col.label}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Download size={18} /> Exportar {exportScope === 'filtered' ? filteredCount : allCount} leads a CSV
      </button>
    </div>
  )
}

// ---- Import Tab ----

function ImportTab({
  dragOver,
  setDragOver,
  onDrop,
  onFileSelect,
  fileInputRef,
  csvHeaders,
  csvData,
  columnMapping,
  handleMappingChange,
  importRows,
  validRows,
  errorRows,
  duplicateRows,
  importing,
  importProgress,
  importResult,
  handleImport,
  resetImport,
}: {
  dragOver: boolean
  setDragOver: (v: boolean) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  csvHeaders: string[]
  csvData: string[][] | null
  columnMapping: Record<number, ExportKey | ''>
  handleMappingChange: (colIdx: number, value: ExportKey | '') => void
  importRows: ImportRow[]
  validRows: ImportRow[]
  errorRows: ImportRow[]
  duplicateRows: ImportRow[]
  importing: boolean
  importProgress: number
  importResult: { imported: number; skipped: number } | null
  handleImport: () => void
  resetImport: () => void
}) {
  // Import complete
  if (importResult) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle size={48} className="text-green-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Importacion completada</h3>
        <div className="text-slate-300 space-y-1">
          <p><span className="text-green-400 font-semibold">{importResult.imported}</span> leads importados</p>
          {importResult.skipped > 0 && (
            <p><span className="text-amber-400 font-semibold">{importResult.skipped}</span> omitidos por error</p>
          )}
        </div>
        <button
          onClick={resetImport}
          className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm"
        >
          Importar otro archivo
        </button>
      </div>
    )
  }

  // Importing in progress
  if (importing) {
    return (
      <div className="text-center py-8 space-y-4">
        <Loader2 size={40} className="text-blue-400 mx-auto animate-spin" />
        <h3 className="text-lg font-semibold text-white">Importando leads...</h3>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${importProgress}%` }}
          />
        </div>
        <p className="text-slate-400 text-sm">{importProgress}% completado</p>
      </div>
    )
  }

  // No file loaded yet
  if (!csvData) {
    return (
      <div className="space-y-4">
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-green-400 bg-green-400/5'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
          }`}
        >
          <Upload size={40} className={`mx-auto mb-3 ${dragOver ? 'text-green-400' : 'text-slate-500'}`} />
          <p className="text-white font-medium mb-1">Arrastra tu archivo CSV aqui</p>
          <p className="text-slate-400 text-sm">o haz clic para seleccionar un archivo</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFileSelect}
          className="hidden"
        />
        <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <File size={14} /> Formato esperado
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Archivo CSV con encabezados. Columnas reconocidas automaticamente:
            Nombre, Telefono, Estado, Score, Interes, Presupuesto, Fuente, Vendedor, Temperatura, Estatus Credito.
            <br />Campos obligatorios: <span className="text-amber-400">Nombre</span> y <span className="text-amber-400">Telefono</span>.
          </p>
        </div>
      </div>
    )
  }

  // File loaded — show mapping + preview + validation
  return (
    <div className="space-y-5">
      {/* Column mapping */}
      <div>
        <h3 className="text-white font-semibold mb-2 text-sm">Mapeo de columnas</h3>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
          {csvHeaders.map((header, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 truncate w-28 shrink-0" title={header}>{header}</span>
              <select
                value={columnMapping[idx] || ''}
                onChange={(e) => handleMappingChange(idx, e.target.value as ExportKey | '')}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg text-xs text-white px-2 py-1.5"
              >
                <option value="">-- Ignorar --</option>
                {EXPORT_COLUMNS.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Validation summary */}
      <div className="flex gap-3">
        <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
          <CheckCircle size={18} className="text-green-400 mx-auto mb-1" />
          <p className="text-green-400 font-bold text-lg">{validRows.length}</p>
          <p className="text-green-400/70 text-xs">Validos</p>
        </div>
        <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
          <AlertCircle size={18} className="text-red-400 mx-auto mb-1" />
          <p className="text-red-400 font-bold text-lg">{errorRows.length}</p>
          <p className="text-red-400/70 text-xs">Errores</p>
        </div>
        <div className="flex-1 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
          <AlertCircle size={18} className="text-amber-400 mx-auto mb-1" />
          <p className="text-amber-400 font-bold text-lg">{duplicateRows.length}</p>
          <p className="text-amber-400/70 text-xs">Duplicados</p>
        </div>
      </div>

      {/* Preview table */}
      <div>
        <h3 className="text-white font-semibold mb-2 text-sm">Vista previa (primeras 10 filas)</h3>
        <div className="overflow-x-auto border border-slate-700 rounded-xl">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-700/50">
                <th className="px-2 py-2 text-left text-slate-400 font-medium">#</th>
                <th className="px-2 py-2 text-left text-slate-400 font-medium">Nombre</th>
                <th className="px-2 py-2 text-left text-slate-400 font-medium">Telefono</th>
                <th className="px-2 py-2 text-left text-slate-400 font-medium">Estado</th>
                <th className="px-2 py-2 text-left text-slate-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {importRows.slice(0, 10).map((row) => {
                const hasError = row.errors.length > 0
                const isDup = row.isDuplicate
                return (
                  <tr
                    key={row.rowIndex}
                    className={`border-t border-slate-700/50 ${
                      hasError ? 'bg-red-500/5' : isDup ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-2 py-1.5 text-slate-500">{row.rowIndex}</td>
                    <td className="px-2 py-1.5 text-white">{row.mapped.name || '-'}</td>
                    <td className="px-2 py-1.5 text-slate-300">{row.mapped.phone || '-'}</td>
                    <td className="px-2 py-1.5">
                      {row.mapped.status ? (
                        <span className="bg-slate-600 px-1.5 py-0.5 rounded text-slate-200">
                          {STATUS_LABELS[row.mapped.status] || row.mapped.status}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1.5">
                      {hasError ? (
                        <span className="text-red-400 flex items-center gap-1">
                          <AlertCircle size={12} /> {row.errors[0]}
                        </span>
                      ) : isDup ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertCircle size={12} /> Duplicado ({row.duplicateOf})
                        </span>
                      ) : (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircle size={12} /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {importRows.length > 10 && (
          <p className="text-xs text-slate-500 mt-1 text-right">...y {importRows.length - 10} filas mas</p>
        )}
      </div>

      {/* Error details */}
      {errorRows.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
          <h4 className="text-red-400 text-xs font-semibold mb-1">Filas con errores:</h4>
          <div className="text-xs text-red-300/80 max-h-20 overflow-y-auto space-y-0.5">
            {errorRows.slice(0, 20).map(row => (
              <p key={row.rowIndex}>Fila {row.rowIndex}: {row.errors.join(', ')}</p>
            ))}
            {errorRows.length > 20 && <p>...y {errorRows.length - 20} mas</p>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={resetImport}
          className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleImport}
          disabled={validRows.length === 0}
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Upload size={16} /> Importar {validRows.length} leads
        </button>
      </div>
    </div>
  )
}
