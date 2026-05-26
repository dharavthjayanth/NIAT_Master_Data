import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FIELDS } from '../lib/fields'
import { toast } from './Toast'

export default function InstructorModal({ record, onClose, onSaved }) {
  const isEdit = !!record?.id
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = {}
    FIELDS.forEach(f => { init[f.k] = record?.[f.k] ?? '' })
    setForm(init)
  }, [record])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    for (const f of FIELDS) {
      if (f.req && !form[f.k]?.trim()) {
        toast(`"${f.l}" is required`, 'error'); return
      }
    }
    const payload = {}
    FIELDS.forEach(f => { payload[f.k] = form[f.k]?.trim() || null })

    setSaving(true)
    const { error } = isEdit
      ? await supabase.from('instructors').update(payload).eq('id', record.id)
      : await supabase.from('instructors').insert(payload)
    setSaving(false)

    if (error) { toast('Error: ' + error.message, 'error'); return }
    toast(isEdit ? 'Record updated' : 'Instructor added')
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{isEdit ? `Edit — ${record.name}` : 'Add Instructor'}</h2>
          <button className="btn btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            {FIELDS.map(f => (
              <div key={f.k} className={`form-group${f.full ? ' full' : ''}`}>
                <label>{f.l}{f.req && <span className="required"> *</span>}</label>
                {f.type === 'select' ? (
                  <select value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)}>
                    {f.opts.map(o => <option key={o} value={o}>{o || 'Select...'}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea value={form[f.k] || ''} onChange={e => set(f.k, e.target.value)} />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.k] || ''}
                    onChange={e => set(f.k, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
