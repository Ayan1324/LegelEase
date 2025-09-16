import { useEffect, useState } from 'react'
import { FileUpload } from '../components/FileUpload.jsx'
import { summarize, explainClauses, ask, compare } from '../lib/api.js'
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
  const [docIdB, setDocIdB] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)
  const [compareItems, setCompareItems] = useState([])
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

  const handleCompare = async () => {
    if (!docId || !docIdB) return toast.error(t('common.uploadFirst'))
    setCompareLoading(true)
    try {
      const data = await compare(docId, docIdB, language)
      setCompareItems(data.comparisons || [])
    } catch (e) {
      toast.error(t('common.error'))
    } finally {
      setCompareLoading(false)
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
              <div className="mt-8 max-w-4xl mx-auto">
                <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg p-1">
                  <div className="grid grid-cols-4 gap-1">
                    {['summary','clauses','compare','chat'].map((tab)=> (
                      <button
                        key={tab}
                        onClick={()=>setActiveTab(tab)}
                        className={`relative px-4 py-3 text-sm text-center transition-all duration-200 rounded-xl group ${
                          activeTab===tab 
                            ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg scale-[1.02]' 
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className={`inline-flex items-center gap-2 transition-all duration-200 ${
                          activeTab===tab 
                            ? 'text-white font-semibold' 
                            : 'group-hover:scale-105'
                        }`}>
                          {tab==='summary' && <FileText size={16} className={activeTab===tab ? 'text-white' : 'text-slate-500 group-hover:text-brand-600'} />}
                          {tab==='clauses' && <Scale size={16} className={activeTab===tab ? 'text-white' : 'text-slate-500 group-hover:text-brand-600'} />}
                          {tab==='compare' && <FileSearch size={16} className={activeTab===tab ? 'text-white' : 'text-slate-500 group-hover:text-brand-600'} />}
                          {tab==='chat' && <MessageSquareText size={16} className={activeTab===tab ? 'text-white' : 'text-slate-500 group-hover:text-brand-600'} />}
                          <span className="font-medium">{t(`nav.${tab}`)}</span>
                        </span>
                        {activeTab === tab && (
                          <motion.div
                            className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 -z-10"
                            layoutId="activeTab"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-8 relative z-[1]">
        {docId && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl p-8 overflow-hidden">
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
                      {result
                        .split('\n')
                        .slice(1)
                        .map((l) => l.replace(/^[\s>\-]*[-*•]\s*/, '').trim())
                        .map((l) => l.replace(/\u200B|\u200C|\u200D|\uFEFF/g, ''))
                        .filter((l) => l.length > 0)
                        .slice(0, 3)
                        .map((line, idx) => (
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

            {activeTab === 'compare' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="h2 inline-flex items-center gap-2"><FileSearch size={18} className="text-brand-600" /> {t('compare.title')}</div>
                    <div className="muted">{t('compare.description')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileUpload onUploaded={setDocIdB} centered={false} storageKey="b" />
                    <button className="btn btn-primary" onClick={handleCompare} disabled={compareLoading || !docIdB}>
                      {compareLoading ? (<span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('compare.comparing')}</span>) : t('compare.compare')}
                    </button>
                  </div>
                </div>
                {!compareItems.length ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                      <FileSearch size={24} className="text-slate-400" />
                    </div>
                    <div className="text-slate-500 dark:text-slate-300 text-sm">{t('compare.noComparison')}</div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {compareItems.map((it, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 6 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden"
                      >
                        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Clause {it.index}
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <div className="font-semibold text-slate-700 dark:text-slate-300">{t('compare.documentA')}</div>
                              </div>
                              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                  {it.a || '—'}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <div className="font-semibold text-slate-700 dark:text-slate-300">{t('compare.documentB')}</div>
                              </div>
                              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                  {it.b || '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 border border-brand-200 dark:border-brand-700">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                <div className="font-semibold text-brand-700 dark:text-brand-300">{t('compare.analysis')}</div>
                              </div>
                              {it.risk_level && (
                                <span className={`text-xs px-2 py-1 rounded-full border ${
                                  it.risk_level === 'high' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' :
                                  it.risk_level === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                                  it.risk_level === 'low' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                                  'bg-slate-50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                                }`}>{it.risk_level}</span>
                              )}
                            </div>

                            {it.summary && (
                              <div className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-200">{it.summary}</div>
                            )}

                            {Array.isArray(it.changes) && it.changes.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t('compare.changes')}</div>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                  {it.changes.map((c, i) => (<li key={i}>{c}</li>))}
                                </ul>
                              </div>
                            )}

                            {Array.isArray(it.impact) && it.impact.length > 0 && (
                              <div className="mb-1">
                                <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t('compare.impact')}</div>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                                  {it.impact.map((c, i) => (<li key={i}>{c}</li>))}
                                </ul>
                              </div>
                            )}

                            {(!it.summary && (!it.changes || it.changes.length===0) && (!it.impact || it.impact.length===0)) && (
                              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {it.analysis || 'No differences detected.'}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div>
                <div className="h2 inline-flex items-center gap-2 mb-6"><MessageSquareText size={18} className="text-brand-600" /> {t('chat.title')}</div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="space-y-4 p-6 max-h-[50vh] overflow-y-auto thin-scrollbar" role="log" aria-live="polite">
                    {!messages.length && (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 mb-3">
                          <MessageSquareText size={20} className="text-slate-400" />
                        </div>
                        <div className="text-slate-500 dark:text-slate-300 text-sm">{t('chat.noMessages')}</div>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                          m.role === 'user' 
                            ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg' 
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex gap-3">
                      <input
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent bg-white dark:bg-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                        placeholder={t('chat.placeholder')}
                        value={question}
                        onChange={(e)=>setQuestion(e.target.value)}
                        onKeyDown={(e)=>{ if(e.key==='Enter') handleAsk() }}
                      />
                      <button 
                        className="px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-xl font-medium hover:from-brand-500 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2" 
                        onClick={handleAsk} 
                        disabled={chatLoading}
                      >
                        {chatLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <SendHorizonal size={16} />
                        )}
                        {chatLoading ? t('chat.sending') : t('chat.send')}
                      </button>
                    </div>
                  </div>
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


