import { useEffect, useState } from 'react'
import { FileUpload } from '../components/FileUpload.jsx'
import { summarize, explainClauses, ask } from '../lib/api.js'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Sparkles, ClipboardCopy, Download, Loader2, ListChecks, FileText, MessageSquareText, Scale, FileSearch, SendHorizonal, ShieldAlert } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import jsPDF from 'jspdf'

export function Summary() {
  const { t, language } = useLanguage()
  const [docId, setDocId] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [previewUrl, setPreviewUrl] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'clauses' | 'chat'
  const [clausesLoading, setClausesLoading] = useState(false)
  const [clausesItems, setClausesItems] = useState([])
  const [question, setQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [detectedLanguage, setDetectedLanguage] = useState(null)

  useEffect(() => {
    if (!previewUrl) setShowPreview(false)
  }, [previewUrl])

  useEffect(() => {
    const saved = localStorage.getItem('legalease_doc_id')
    if (saved) setDocId(saved)
  }, [])

  const handleSummarize = async () => {
    if (!docId) return toast.error(t('common.uploadFirst'))
    setLoading(true)
    try {
      const data = await summarize(docId, language)
      setResult(data.summary)
      // Store detected language if available
      if (data.detected_language) {
        setDetectedLanguage(data.detected_language)
      }
    } catch (e) {
      const message = e?.message || t('common.error')
      if (e?.status === 404) {
        toast.error(t('upload.error'))
        try { localStorage.removeItem('legalease_doc_id') } catch {}
        setDocId(null)
      } else if (e?.status === 500) {
        toast.error(t('common.error'))
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExplain = async () => {
    if (!docId) return toast.error(t('common.uploadFirst'))
    setClausesLoading(true)
    try {
      const data = await explainClauses(docId, language)
      setClausesItems(data.clauses || [])
    } catch (e) {
      toast.error(t('common.error'))
    } finally {
      setClausesLoading(false)
    }
  }

  const handleAsk = async () => {
    if (!docId) return toast.error(t('common.uploadFirst'))
    if (!question.trim()) return
    const q = question.trim()
    setMessages((m) => [...m, { role: 'user', content: q }])
    setQuestion('')
    setChatLoading(true)
    try {
      const data = await ask(docId, q, language)
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
    } catch (e) {
      toast.error(t('common.error'))
    } finally {
      setChatLoading(false)
    }
  }

  const copySummary = () => {
    if (!result) return
    navigator.clipboard.writeText(result).then(()=>toast.success(t('summary.copied')))
  }

  const downloadPDF = () => {
    if (!result) return
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 40
    const maxWidth = 515
    
    // Try to use a Unicode font, fallback to default
    try {
      // For better Unicode support, we'll use the default font which has better Unicode coverage
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('LegalEase Summary', margin, margin)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      
      // Split text with better Unicode handling
      const lines = doc.splitTextToSize(result, maxWidth)
      doc.text(lines, margin, margin + 24)
    } catch (error) {
      // Fallback for complex Unicode characters
      console.warn('PDF generation with Unicode characters:', error)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('LegalEase Summary', margin, margin)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(result.substring(0, 2000), margin, margin + 24) // Truncate if too complex
    }
    
    doc.save('summary.pdf')
  }

  return (
    <div className="relative -mx-6 -mt-8 mb-8">
      <div className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-[#0b122a] dark:via-[#0e1630] dark:to-[#0b1220] dark:text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center overflow-visible">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs tracking-wide">
              <span className="text-slate-700 dark:text-white">⚡ AI-Powered Legal Document Analysis</span>
            </div>
            <div className="text-3xl md:text-5xl font-bold leading-relaxed">
              <div className="pb-1">{t('nav.upload')}</div>
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200 gradient-text-fix" style={{ minHeight: '1.5em', paddingBottom: '0.4em' }}>{t('upload.title')}</div>
            </div>
            <p className="mt-1 mx-auto max-w-2xl text-sm md:text-base text-slate-600 dark:text-slate-300">
              {t('upload.description')}
            </p>
            <div className="mt-8">
              <FileUpload onUploaded={setDocId} centered onPreviewReady={setPreviewUrl} />
            </div>
            {docId && (
              <div className="mt-8 max-w-2xl mx-auto">
                <div className="relative border-b border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-3">
                    {['summary','clauses','chat'].map((tab)=> (
                      <button
                        key={tab}
                        onClick={()=>setActiveTab(tab)}
                        className={`relative px-5 py-2.5 text-sm text-center transition-all ${activeTab===tab? 'scale-[1.02]' : 'scale-100'}`}
                      >
                        <span className={`inline-flex items-center gap-2 transition-colors ${activeTab===tab ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-300 dark:to-brand-100 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                          {tab==='summary' && <FileText size={16} />}
                          {tab==='clauses' && <Scale size={16} />}
                          {tab==='chat' && <MessageSquareText size={16} />}
                          {t(`nav.${tab}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <motion.span
                    className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-gradient-to-r from-brand-600 to-brand-700"
                    animate={{ left: activeTab==='summary'? '0%' : activeTab==='clauses'? '33.3333%' : '66.6667%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                  <motion.span
                    className="pointer-events-none absolute -bottom-1 left-0 h-6 w-1/3 bg-brand-500/0 blur-xl"
                    animate={{ left: activeTab==='summary'? '0%' : activeTab==='clauses'? '33.3333%' : '66.6667%', backgroundColor: 'rgba(91,120,255,0.125)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-8 relative z-[1]">
        {docId && (
        <div className="card p-6 overflow-hidden">
          <div className="grid grid-cols-1">
            {activeTab === 'summary' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h2 inline-flex items-center gap-2"><Sparkles size={18} className="text-brand-600" /> {t('summary.title')}</div>
                    <div className="muted">
                      {detectedLanguage && detectedLanguage !== 'english' ? (
                        <span>{t('summary.analysisIn', { language: detectedLanguage.charAt(0).toUpperCase() + detectedLanguage.slice(1) })}</span>
                      ) : (
                        <span>{t('summary.description')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-primary" onClick={handleSummarize} disabled={loading}>
                      {loading ? (<span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('summary.generating')}</span>) : t('summary.generate')}
                    </button>
                  </div>
                </div>
                {!result ? (
                  <div className="text-slate-500 dark:text-slate-300 text-sm">{t('summary.noSummary')}</div>
                ) : (
                  <motion.div
                    id="summary-content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="space-y-4"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white content-text">{result.split('\n')[0]}</div>
                    <ul className="space-y-2">
                      {result.split('\n').slice(1, 4).map((line, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 content-text">
                          <ListChecks size={16} className="mt-0.5 text-brand-600" />
                          <span className="whitespace-pre-wrap">{line}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 pt-2">
                      <button className="btn btn-outline" onClick={copySummary} aria-label={t('summary.copy')}><ClipboardCopy size={16} /> {t('summary.copy')}</button>
                      <button className="btn btn-outline" onClick={downloadPDF} aria-label={t('summary.download')}><Download size={16} /> {t('summary.download')}</button>
                    </div>
                  </motion.div>
                )}
                {previewUrl && showPreview && (
                  <div className="mt-6">
                    <div className="h2 mb-3">Preview</div>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <iframe title="PDF Preview" src={previewUrl} className="w-full h-[60vh]" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'clauses' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h2 inline-flex items-center gap-2"><Scale size={18} className="text-brand-600" /> Clauses</div>
                    <div className="muted">Plain-English explanations and risk indicators</div>
                  </div>
                  <button className="btn btn-primary" onClick={handleExplain} disabled={clausesLoading}>
                    {clausesLoading ? 'Analyzing…' : 'Analyze Clauses'}
                  </button>
                </div>
                {!clausesItems.length ? (
                  <div className="text-slate-500 dark:text-slate-300 text-sm">No analysis yet.</div>
                ) : (
                  <div className="space-y-4">
                    {clausesItems.map((it, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-slate-800 dark:text-slate-100 truncate inline-flex items-center gap-2">
                            <ShieldAlert size={16} className="text-slate-400" /> Clause {idx + 1}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{it.analysis}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div>
                <div className="h2 inline-flex items-center gap-2 mb-3"><MessageSquareText size={18} className="text-brand-600" /> Chat about this document</div>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 thin-scrollbar" role="log" aria-live="polite">
                  {!messages.length && <div className="text-slate-500 dark:text-slate-300 text-sm">No messages yet.</div>}
                  {messages.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <div className={`inline-block px-3 py-2 rounded-2xl text-sm ${m.role==='user'?'bg-brand-600 text-white':'bg-slate-100 dark:bg-slate-800 dark:text-slate-100'}`}>{m.content}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 bg-white dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="Ask a question..."
                    value={question}
                    onChange={(e)=>setQuestion(e.target.value)}
                    onKeyDown={(e)=>{ if(e.key==='Enter') handleAsk() }}
                  />
                  <button className="btn btn-primary" onClick={handleAsk} disabled={chatLoading}>{chatLoading?'Thinking…':(<span className="inline-flex items-center gap-2"><SendHorizonal size={16} /> Send</span>)}</button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}


