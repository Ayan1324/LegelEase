export const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function summarize(docId, language = 'en') {
  const res = await fetch(`${API}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, language })
  })
  if (!res.ok) {
    let detail = 'Summarize failed'
    try { const j = await res.json(); detail = j.detail || detail } catch {}
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function explainClauses(docId, language = 'en') {
  const res = await fetch(`${API}/clauses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, language })
  })
  if (!res.ok) {
    let detail = 'Clauses failed'
    try { const j = await res.json(); detail = j.detail || detail } catch {}
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  return res.json()
}

export async function ask(docId, question, language = 'en') {
  const res = await fetch(`${API}/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, question, language })
  })
  if (!res.ok) {
    let detail = 'QA failed'
    try { const j = await res.json(); detail = j.detail || detail } catch {}
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  return res.json()
}


