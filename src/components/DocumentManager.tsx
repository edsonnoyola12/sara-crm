import { useState, useEffect, useRef, useCallback } from 'react'
import { FileText, Image, File, Upload, Download, Trash2, FolderOpen, X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Document, DOCUMENT_CATEGORIES } from '../types/crm'

interface DocumentManagerProps {
  entityType: 'lead' | 'property' | 'mortgage'
  entityId: string
  currentUser?: { id: string; name: string }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const CATEGORY_COLORS: Record<string, string> = {
  ine: 'bg-blue-600/30 text-blue-300 border-blue-600/40',
  comprobante_domicilio: 'bg-green-600/30 text-green-300 border-green-600/40',
  comprobante_ingresos: 'bg-emerald-600/30 text-emerald-300 border-emerald-600/40',
  estado_cuenta: 'bg-purple-600/30 text-purple-300 border-purple-600/40',
  contrato: 'bg-amber-600/30 text-amber-300 border-amber-600/40',
  escritura: 'bg-rose-600/30 text-rose-300 border-rose-600/40',
  avaluo: 'bg-cyan-600/30 text-cyan-300 border-cyan-600/40',
  otro: 'bg-slate-600/30 text-slate-300 border-slate-600/40',
}

function getFileType(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  return 'otro'
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case 'pdf': return <FileText size={20} className="text-red-400" />
    case 'image': return <Image size={20} className="text-blue-400" />
    case 'doc': return <FileText size={20} className="text-slate-400" />
    default: return <File size={20} className="text-slate-400" />
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `hace ${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `hace ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `hace ${diffDays}d`
  const diffMonths = Math.floor(diffDays / 30)
  return `hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`
}

function getCategoryLabel(key: string): string {
  return DOCUMENT_CATEGORIES.find(c => c.key === key)?.label || key
}

export default function DocumentManager({ entityType, entityId, currentUser }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [uploadCategory, setUploadCategory] = useState<string>('otro')
  const [uploadNotes, setUploadNotes] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error loading documents:', fetchError)
      setError('Error al cargar documentos')
    } else {
      setDocuments(data || [])
    }
    setLoading(false)
  }, [entityType, entityId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  async function handleUpload(files: FileList | File[]) {
    const fileArray = Array.from(files)
    setError(null)

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" excede el limite de 10MB`)
        return
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" no es un tipo de archivo permitido (PDF, imagen, Word)`)
        return
      }
    }

    setUploading(true)
    setUploadProgress(0)

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const fileExt = file.name.split('.').pop() || 'bin'
      const storagePath = `${entityType}/${entityId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setError(`Error al subir "${file.name}": ${uploadError.message}`)
        setUploading(false)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(storagePath)

      const fileUrl = urlData.publicUrl

      // Save record to documents table
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          name: file.name,
          file_url: fileUrl,
          file_type: getFileType(file.type),
          file_size: file.size,
          category: uploadCategory,
          uploaded_by: currentUser?.id || 'unknown',
          uploaded_by_name: currentUser?.name || 'Usuario',
          notes: uploadNotes || null,
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        setError(`Error al guardar registro de "${file.name}"`)
        setUploading(false)
        return
      }

      setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100))
    }

    setUploading(false)
    setUploadProgress(0)
    setUploadNotes('')
    setUploadCategory('otro')
    loadDocuments()
  }

  async function handleDelete(doc: Document) {
    // Extract storage path from URL
    const urlParts = doc.file_url.split('/documents/')
    const storagePath = urlParts[urlParts.length - 1]

    // Delete from storage
    if (storagePath) {
      await supabase.storage.from('documents').remove([storagePath])
    }

    // Delete record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      setError('Error al eliminar documento')
    } else {
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    }
    setDeleteConfirm(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  const filteredDocuments = selectedCategory === 'all'
    ? documents
    : documents.filter(d => d.category === selectedCategory)

  const categoryCounts = documents.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600/30 text-blue-300 border border-blue-600/40'
              : 'text-slate-400 hover:text-slate-200 bg-slate-700/30 border border-slate-700/50'
          }`}
        >
          Todos ({documents.length})
        </button>
        {DOCUMENT_CATEGORIES.map(cat => {
          const count = categoryCounts[cat.key] || 0
          if (count === 0 && selectedCategory !== cat.key) return null
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors border ${
                selectedCategory === cat.key
                  ? CATEGORY_COLORS[cat.key]
                  : 'text-slate-400 hover:text-slate-200 bg-slate-700/30 border-slate-700/50'
              }`}
            >
              {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-600/10'
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <Loader2 size={28} className="mx-auto text-blue-400 animate-spin" />
            <p className="text-sm text-slate-300">Subiendo archivos...</p>
            <div className="w-full bg-slate-700 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-400 mb-1">
              Arrastra archivos aqui o{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                selecciona
              </button>
            </p>
            <p className="text-xs text-slate-600">PDF, imagenes (JPG/PNG), Word. Max 10MB</p>

            {/* Upload options */}
            <div className="flex items-center gap-3 mt-4 justify-center flex-wrap">
              <select
                value={uploadCategory}
                onChange={e => setUploadCategory(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-sm rounded-lg px-3 py-1.5 text-slate-200 focus:ring-blue-500 focus:border-blue-500"
              >
                {DOCUMENT_CATEGORIES.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Notas (opcional)"
                value={uploadNotes}
                onChange={e => setUploadNotes(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-sm rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          className="hidden"
          onChange={e => {
            if (e.target.files && e.target.files.length > 0) {
              handleUpload(e.target.files)
              e.target.value = ''
            }
          }}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-600/20 border border-red-600/30 text-red-300 rounded-lg px-4 py-2 text-sm">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:text-red-200"><X size={14} /></button>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 size={24} className="mx-auto text-slate-500 animate-spin" />
          <p className="text-sm text-slate-500 mt-2">Cargando documentos...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p>Sin documentos. Arrastra archivos aqui para subirlos.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className="bg-slate-700/40 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-700/60 transition-colors group"
            >
              {/* File icon */}
              <div className="w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center shrink-0">
                {getFileIcon(doc.file_type)}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate" title={doc.name}>
                  {doc.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.otro}`}>
                    {getCategoryLabel(doc.category)}
                  </span>
                  <span className="text-[11px] text-slate-500">{formatFileSize(doc.file_size)}</span>
                  <span className="text-[11px] text-slate-500">{timeAgo(doc.created_at)}</span>
                  <span className="text-[11px] text-slate-500">por {doc.uploaded_by_name}</span>
                </div>
                {doc.notes && (
                  <p className="text-xs text-slate-500 mt-1 truncate">{doc.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-slate-600/50 text-blue-400 hover:text-blue-300"
                  title="Descargar"
                >
                  <Download size={16} />
                </a>
                {deleteConfirm === doc.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(doc)}
                      className="px-2 py-1 text-xs bg-red-600/30 text-red-300 rounded hover:bg-red-600/50"
                    >
                      Eliminar
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 text-xs bg-slate-600/30 text-slate-300 rounded hover:bg-slate-600/50"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(doc.id)}
                    className="p-2 rounded-lg hover:bg-red-600/20 text-slate-500 hover:text-red-400"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Export document count hook for use in tab badges
export function useDocumentCount(entityType: string, entityId: string) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!entityId) return
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .then(({ count: c }) => {
        setCount(c || 0)
      })
  }, [entityType, entityId])

  return count
}
