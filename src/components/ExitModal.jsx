import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from './Toast'

const EXIT_REASONS = [
  'Resigned',
  'Contract ended',
  'Terminated',
  'Absconded',
  'Moved to different role',
  'Other',
]

export default function ExitModal({ record, onClose, onDone }) {
  const [exitDate, setExitDate]     = useState(new Date().toISOString().split('T')[0])
  const [exitReason, setExitReason] = useState('')
  const [remarks, setRemarks]       = useState('')
  const [saving, setSaving]         = useState(false)

  async function handleExit() {
    if (!exitDate)   { toast('Exit date is required', 'error'); return }
    if (!exitReason) { toast('Exit reason is required', 'error'); return }

    setSaving(true)

    const exitRecord = {
      employee_id:               record.employee_id,
      name:                      record.name,
      department:                record.department,
      capability_manager:        record.capability_manager,
      capability_manager_emp_id: record.capability_manager_emp_id,
      work_location:             record.work_location,
      contribution:              record.contribution,
      contribution_region:       record.contribution_region,
      reporting_manager:         record.reporting_manager,
      payroll:                   record.payroll,
      role:                      record.role,
      phone:                     record.phone,
      email:                     record.email,
      university_email:          record.university_email,
      doj:                       record.doj,
      qualification:             record.qualification,
      domain:                    record.domain,
      uid:                       record.uid,
      gender:                    record.gender,
      native_language:           record.native_language,
      portal_access:             record.portal_access,
      exit_date:                 exitDate,
      exit_reason:               exitReason,
      remarks:                   remarks.trim() || record.remarks || null,
    }

    const { error: insertError } = await supabase.from('exits').insert(exitRecord)
    if (insertError) {
      toast('Error saving exit record: ' + insertError.message, 'error')
      setSaving(false)
      return
    }

    const { error: deleteError } = await supabase
      .from('instructors')
      .delete()
      .eq('id', record.id)

    if (deleteError) {
      toast('Saved to exits but failed to remove from master: ' + deleteError.message, 'error')
      setSaving(false)
      return
    }

    setSaving(false)
    toast(`${record.name} moved to Exit Records`)
    onDone()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 500 }}>
        <div className="modal-head">
          <h2>Mark as Exited</h2>
          <button className="btn btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: 10, padding: '14px 16px', marginBottom: 18
          }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{record.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
              {record.employee_id} · {record.role}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {record.department} · CM: {record.capability_manager}
            </div>
          </div>

          <div style={{
            background: '#FEF3C7', border: '1px solid #FCD34D',
            borderRadius: 8, padding: '10px 14px', marginBottom: 18,
            fontSize: 13, color: '#92400E', lineHeight: 1.5
          }}>
            ⚠️ This instructor will be <strong>removed from Master Data</strong> and moved to the Exit Records tab.
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>Exit Date <span className="required">*</span></label>
              <input
                type="date"
                value={exitDate}
                onChange={e => setExitDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Exit Reason <span className="required">*</span></label>
              <select value={exitReason} onChange={e => setExitReason(e.target.value)}>
                <option value="">Select reason...</option>
                {EXIT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label>Additional Remarks</label>
              <textarea
                placeholder="Any additional notes about this exit..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-danger" onClick={handleExit} disabled={saving}>
            {saving ? 'Processing...' : '🚪 Confirm Exit'}
          </button>
        </div>
      </div>
    </div>
  )
}