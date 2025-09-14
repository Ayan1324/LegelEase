import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeProvider.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="relative inline-flex h-10 w-[72px] items-center rounded-2xl border border-slate-200 px-2 transition-all hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:border-slate-700/60 dark:hover:border-slate-600"
      onClick={toggleTheme}
    >
      <span className="absolute inset-0 -z-10 rounded-2xl bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:bg-slate-900/60" />
      <span className="grid grid-cols-2 gap-2 items-center w-full">
        <Sun size={16} className={`mx-auto transition-colors ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
        <Moon size={16} className={`mx-auto transition-colors ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
      </span>
      <span
        className={`pointer-events-none absolute top-1 bottom-1 w-1/2 rounded-xl bg-white shadow-soft transition-[transform] duration-300 ease-out dark:bg-slate-800 ${theme === 'dark' ? 'translate-x-[calc(100%+0.5rem)]' : 'translate-x-0'}`}
      />
    </button>
  )
}


