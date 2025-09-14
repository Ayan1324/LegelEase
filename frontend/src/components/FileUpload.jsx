import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { API } from '../lib/api.js'
import { UploadCloud, FileBadge, Loader2, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '../contexts/LanguageContext.jsx'

export function FileUpload({ onUploaded, centered = false, onPreviewReady }) {
  const { t } = useLanguage()
  const inputRef = useRef(null)
  const previewUrlRef = useRef('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedName, setSelectedName] = useState('')

  useEffect(() => {
    const savedName = localStorage.getItem('legalease_doc_name') || ''
    if (savedName) setSelectedName(savedName)
  }, [])

  const handleSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check if file format is supported
    const supportedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    if (!supportedExtensions.includes(fileExtension)) {
      toast.error(t('upload.unsupported', { formats: supportedExtensions.join(', ') }))
      return
    }
    try {
      const blobUrl = URL.createObjectURL(file)
      if (previewUrlRef.current) {
        try { URL.revokeObjectURL(previewUrlRef.current) } catch {}
      }
      previewUrlRef.current = blobUrl
      onPreviewReady?.(blobUrl)
    } catch {}
    setIsLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(API + '/upload', {
        method: 'POST',
        body: form
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      toast.success(t('upload.success'))
      setSelectedName(file.name)
      try {
        localStorage.setItem('legalease_doc_id', data.doc_id)
        localStorage.setItem('legalease_doc_name', file.name)
      } catch {}
      onUploaded?.(data.doc_id)
    } catch (err) {
      console.error(err)
      toast.error(t('upload.error'))
    } finally {
      setIsLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    try {
      localStorage.removeItem('legalease_doc_id')
      localStorage.removeItem('legalease_doc_name')
    } catch {}
    setSelectedName('')
    onUploaded?.(null)
    if (previewUrlRef.current) {
      try { URL.revokeObjectURL(previewUrlRef.current) } catch {}
      previewUrlRef.current = ''
    }
    onPreviewReady?.('')
    toast.success(t('upload.removed'))
  }

  if (centered) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-center">
        <input ref={inputRef} onChange={handleSelect} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.tiff,.gif" className="hidden" aria-label={t('upload.button')} />
        <button
          className="relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white shadow-soft bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          aria-live="polite"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('upload.uploading')}</span>
          ) : (
            <span className="inline-flex items-center gap-2"><UploadCloud size={18} /> {t('upload.button')}</span>
          )}
        </button>
        {selectedName && (
          <div className="mt-3 inline-flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span className="truncate max-w-[40ch]">{selectedName}</span>
            <button type="button" onClick={handleRemove} aria-label={t('upload.remove')} className="inline-grid place-items-center rounded-xl w-8 h-8 text-white shadow-soft bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 transition-transform">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="card p-6 flex items-center justify-between gap-4" role="region" aria-label="File upload">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-2xl bg-brand-50 text-brand-700 grid place-items-center" aria-hidden>
          <UploadCloud size={20} />
        </div>
        <div>
          <div className="font-medium">{t('upload.title')}</div>
          <div className="text-sm text-slate-600">{t('upload.description')}</div>
          {selectedName && (
            <div className="mt-2 inline-flex items-center gap-2 text-sm">
              <span className="text-slate-700">{selectedName}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input ref={inputRef} onChange={handleSelect} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.tiff,.gif" className="hidden" aria-label={t('upload.button')} />
        <button className="btn btn-outline" onClick={() => inputRef.current?.click()} disabled={isLoading} aria-live="polite">
          {isLoading ? (<span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('upload.uploading')}</span>) : t('upload.button')}
        </button>
      </div>
    </div>
  )
}


