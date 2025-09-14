import { NavLink, Route, Routes } from 'react-router-dom'
import { Scale, FileText, MessageSquareText } from 'lucide-react'
import ThemeToggle from './components/ThemeToggle.jsx'
import { LanguageSelector } from './components/LanguageSelector.jsx'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext.jsx'
import { Summary } from './pages/Summary.jsx'
import { Clauses } from './pages/Clauses.jsx'
import { Chat } from './pages/Chat.jsx'
import { Toaster } from 'sonner'

function AppContent() {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen">
      <Toaster position="top-right" richColors />
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-slate-100/80 dark:bg-slate-900/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between" role="navigation" aria-label="Primary">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-2xl bg-brand-600 grid place-items-center text-white shadow-soft" aria-hidden>
              <Scale size={18} />
            </div>
            <span className="font-semibold text-lg tracking-tight">{t('nav.legalEase')}</span>
          </div>
          <nav className="flex items-center gap-4 text-sm" role="tablist">
            <LanguageSelector />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Summary />} />
          <Route path="/clauses" element={<Clauses />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>
      <footer className="py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">
            {t('footer.disclaimer')}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}


