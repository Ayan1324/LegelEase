import { useEffect, useState } from 'react'
import { FileUpload } from '../components/FileUpload.jsx'
import { ask } from '../lib/api.js'
import { toast } from 'sonner'
import { SendHorizonal, MessageSquare, FileText, Scale } from 'lucide-react'

export function Chat() {
  const [docId, setDocId] = useState(null)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('legalease_doc_id')
    if (saved) setDocId(saved)
  }, [])

  const handleAsk = async () => {
    if (!docId) return toast.error('Upload a PDF first')
    if (!question.trim()) return
    const q = question.trim()
    setMessages((m) => [...m, { role: 'user', content: q }])
    setQuestion('')
    setLoading(true)
    try {
      const data = await ask(docId, q)
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
    } catch (e) {
      toast.error('Failed to answer')
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
              <span className="text-slate-700 dark:text-white">💬 Ask the Contract</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Chat with Your Document
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-400 dark:to-brand-200">Get Instant Clarifications</span>
            </h1>
            <p className="mt-4 mx-auto max-w-2xl text-sm md:text-base text-slate-600 dark:text-slate-300">
              Upload a PDF, then ask questions in plain English. We’ll cite relevant parts.
            </p>
            <div className="mt-8">
              <FileUpload onUploaded={setDocId} centered />
            </div>
            {docId && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                <a href="/" className="relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-white shadow-soft bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300">
                  <FileText size={18} /> Summary
                </a>
                <a href="/clauses" className="relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-white shadow-soft bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-700 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300">
                  <Scale size={18} /> Clauses
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 -mt-8 relative z-[1]">
        <div className="card p-6">
          <div className="h2 inline-flex items-center gap-2 mb-3"><MessageSquare size={18} className="text-brand-600" /> Chat about this document</div>
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
            <button className="btn btn-primary" onClick={handleAsk} disabled={loading}>{loading?'Thinking…':(<span className="inline-flex items-center gap-2"><SendHorizonal size={16} /> Send</span>)}</button>
          </div>
        </div>
      </div>
    </div>
  )
}


