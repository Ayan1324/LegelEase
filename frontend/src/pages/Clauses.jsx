import { useEffect, useState } from 'react'
import { FileUpload } from '../components/FileUpload.jsx'
import { explainClauses } from '../lib/api.js'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ListTree, ShieldAlert, Scale, MessageSquareText, FileText } from 'lucide-react'

function RiskBadge({ text }) {
  let color = 'border-slate-200 text-slate-700'
  if (text.includes('🟢')) color = 'border-emerald-200 text-emerald-700'
  if (text.includes('🟡')) color = 'border-amber-200 text-amber-800'
  if (text.includes('🔴')) color = 'border-red-200 text-red-700'
  return <span className={`badge ${color}`}>{text.split('—')[0]}</span>
}

export function Clauses() {
  const [docId, setDocId] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('legalease_doc_id')
    if (saved) setDocId(saved)
  }, [])

  const handleExplain = async () => {
    if (!docId) return toast.error('Upload a PDF first')
    setLoading(true)
    try {
      const data = await explainClauses(docId)
      setItems(data.clauses || [])
    } catch (e) {
      toast.error('Failed to analyze clauses')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative -mx-6 -mt-8 mb-8">
      <div className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-[#0b122a] dark:via-[#0e1630] dark:to-[#0b1220] dark:text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs tracking-wide">
              <span className="text-slate-700 dark:text-white">🧩 AI Clause Analysis</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Understand Key Clauses
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">Plain English, With Risk Indicators</span>
            </h1>
            <p className="mt-4 mx-auto max-w-2xl text-sm md:text-base text-slate-600 dark:text-slate-300">
              Upload your contract and get human-friendly explanations for important clauses.
            </p>
            <div className="mt-8">
              <FileUpload onUploaded={setDocId} centered />
            </div>
            {docId && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                <button onClick={handleExplain} disabled={loading} className="relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-white shadow-soft bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-60 disabled:cursor-not-allowed">
                  <Scale size={18} /> {loading ? 'Analyzing…' : 'Analyze'}
                </button>
                <a href="/" className="relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-white shadow-soft bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300">
                  <FileText size={18} /> Summary
                </a>
                <a href="/chat" className="relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-white shadow-soft bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300">
                  <MessageSquareText size={18} /> Chat
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-8 relative z-[1]">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h2 inline-flex items-center gap-2"><ListTree size={18} className="text-brand-600" /> Clauses</div>
              <div className="muted">Plain-English explanations and risk indicators</div>
            </div>
          </div>
          {!items.length ? (
            <div className="text-slate-500 dark:text-slate-300 text-sm">No analysis yet.</div>
          ) : (
            <div className="space-y-4">
              {items.map((it, idx) => (
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
                    <RiskBadge text={it.analysis || ''} />
                  </div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{it.analysis}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


