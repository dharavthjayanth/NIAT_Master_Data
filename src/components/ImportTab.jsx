import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { IMPORT_KEYS } from '../lib/fields'
import { toast } from './Toast'

export default function ImportTab({ onRefresh }) {
  const [text, setText] = useState('')
  const [log, setLog]   = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleImport() {
    const raw = text.trim()
    if (!raw) { toast('Paste some data first', 'error'); return }

    const lines = raw.split('\n').map(l => l.split('\t'))
    if (lines.length < 2) { toast('Need at least a header row + 1 data row', 'error'); return }

    setLoading(true)
    setLog(null)

    const rows = lines.slice(1).map(cols => {
      const obj = {}
      IMPORT_KEYS.forEach((k, i) => {
        obj[k] = cols[i] ? cols[i].trim().replace(/^"|"$/g, '') || null : null
      })
      return obj
    }).filter(r => r.employee_id && r.name)

    let ok = 0, fail = 0
    const BATCH = 50
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const { error } = await supabase
        .from('instructors')
        .upsert(batch, { onConflict: 'employee_id' })
      if (error) { fail += batch.length; console.error(error) }
      else ok += batch.length
    }

    setLoading(false)
    setLog({ ok, fail, total: rows.length })
    if (ok > 0) { onRefresh(); toast(`${ok} records imported`) }
    if (fail > 0) toast(`${fail} rows failed`, 'error')
  }

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Import Tab-Separated Data</span>
      </div>
      <div style={{ padding: 24 }}>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Copy rows directly from your Excel sheet (include the header row) and paste below.
          Existing records are updated by Employee ID — no duplicates created.
          <br />
          <strong style={{ color: '#374151' }}>Expected column order:</strong> Employee ID, Name, Department,
          Capability Manager, Work Location, Contribution, Contribution Region, Reporting Manager,
          Payroll, Role, Phone, Email, University Email, DOJ, Qualification, Domain, UID, Gender,
          Native Language, Portal Access, CM Employee ID, Exit Date, Remarks
        </p>

        <div className="import-area">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste tab-separated data here..."
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
            {loading ? 'Importing...' : '⬆ Import Data'}
          </button>
          <button className="btn" onClick={() => { setText(''); setLog(null) }}>Clear</button>
        </div>

        {log && (
          <div className={`import-log ${log.fail === 0 ? 'success' : 'error'}`}>
            {log.ok > 0 && `✓ ${log.ok} of ${log.total} rows imported successfully. `}
            {log.fail > 0 && `✗ ${log.fail} rows failed (check console for details).`}
          </div>
        )}
      </div>
    </div>
  )
}
