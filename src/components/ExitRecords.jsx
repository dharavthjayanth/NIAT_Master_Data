import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from './Toast'

const PAGE = 25
function uniq(arr) { return [...new Set(arr.filter(Boolean))].sort() }

const REASON_COLORS = {
  'Resigned':               'pill-amber',
  'Contract ended':         'pill-blue',
  'Terminated':             'pill-gray',
  'Absconded':              'pill-gray',
  'Moved to different role':'pill-green',
  'Other':                  'pill-gray',
}

export default function ExitRecords({ data, onRefresh }) {
  const [search, setSearch]   = useState('')
  const [fCM, setFCM]         = useState('')
  const [fDept, setFDept]     = useState('')
  const [fReason, setFReason] = useState('')
  const [page, setPage]       = useState(1)
  const [restoring, setRestoring] = useState(null) // id being restored

  const cms     = useMemo(() => uniq(data.map(r => r.capability_manager)), [data])
  const depts   = useMemo(() => uniq(data.map(r => r.department)), [data])
  const reasons = useMemo(() => uniq(data.map(r => r.exit_reason)), [data])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return data.filter(r => {
      if (fCM     && r.capability_manager !== fCM)     return false
      if (fDept   && r.department         !== fDept)   return false
      if (fReason && r.exit_reason        !== fReason) return false
      if (s) {
        const hay = [r.employee_id, r.name, r.email, r.role].join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [data, search, fCM, fDept, fReason])

  const totalPages = Math.ceil(filtered.length / PAGE)
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE)

  function deptShort(d) { return (d || '').replace('Instructors - ', '') }

  async function handleRestore(r) {
    if (!window.confirm(`Restore "${r.name}" back to Master Data?`)) return

    setRestoring(r.id)

    // Build instructor record (exclude exit-specific fields)
    const instructorRecord = {
      employee_id:               r.employee_id,
      name:                      r.name,
      department:                r.department,
      capability_manager:        r.capability_manager,
      capability_manager_emp_id: r.capability_manager_emp_id,
      work_location:             r.work_location,
      contribution:              r.contribution,
      contribution_region:       r.contribution_region,
      reporting_manager:         r.reporting_manager,
      payroll:                   r.payroll,
      role:                      r.role,
      phone:                     r.phone,
      email:                     r.email,
      university_email:          r.university_email,
      doj:                       r.doj,
      qualification:             r.qualification,
      domain:                    r.domain,
      uid:                       r.uid,
      gender:                    r.gender,
      native_language:           r.native_language,
      portal_access:             r.portal_access,
      remarks:                   r.remarks,
    }

    // Step 1 — insert back into instructors
    const { error: insertError } = await supabase
      .from('instructors')
      .insert(instructorRecord)

    if (insertError) {
      toast('Error restoring to master: ' + insertError.message, 'error')
      setRestoring(null)
      return
    }

    // Step 2 — remove from exits
    const { error: deleteError } = await supabase
      .from('exits')
      .delete()
      .eq('id', r.id)

    if (deleteError) {
      toast('Restored to master but failed to remove from exits: ' + deleteError.message, 'error')
      setRestoring(null)
      return
    }

    setRestoring(null)
    toast(`${r.name} restored to Master Data ✓`)
    onRefresh()
  }

  return (
    <div>
      <div style={{
        background: '#FEF3C7', border: '1px solid #FCD34D',
        borderRadius: 10, padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 20, fontSize: 13, color: '#92400E'
      }}>
        <span style={{ fontSize: 20 }}>🚪</span>
        <div>
          <strong>{data.length} instructor{data.length !== 1 ? 's' : ''} have exited.</strong>
          {' '}Click <strong>Restore</strong> on any row to move them back to Master Data.
        </div>
      </div>

      <div className="filters-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search name, ID, email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <select value={fCM} onChange={e => { setFCM(e.target.value); setPage(1) }}>
          <option value="">All Capability Managers</option>
          {cms.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={fDept} onChange={e => { setFDept(e.target.value); setPage(1) }}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={fReason} onChange={e => { setFReason(e.target.value); setPage(1) }}>
          <option value="">All Exit Reasons</option>
          {reasons.map(r => <option key={r}>{r}</option>)}
        </select>
        {(search || fCM || fDept || fReason) && (
          <button className="btn btn-sm" onClick={() => {
            setSearch(''); setFCM(''); setFDept(''); setFReason(''); setPage(1)
          }}>Clear all</button>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Exit Records</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length} records</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Emp ID</th>
                <th style={{ width: 150 }}>Name</th>
                <th style={{ width: 130 }}>Role</th>
                <th style={{ width: 160 }}>Capability Manager</th>
                <th style={{ width: 140 }}>Department</th>
                <th style={{ width: 95 }}>DOJ</th>
                <th style={{ width: 95 }}>Exit Date</th>
                <th style={{ width: 140 }}>Exit Reason</th>
                <th>Email</th>
                <th style={{ width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr>
                  <td colSpan={10} className="loading-row">
                    {data.length === 0 ? 'No exit records yet.' : 'No records match your filters.'}
                  </td>
                </tr>
              ) : slice.map(r => (
                <tr key={r.id}>
                  <td><code style={{ fontSize: 11 }}>{r.employee_id}</code></td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td style={{ color: '#6b7280' }}>{r.role}</td>
                  <td>{r.capability_manager}</td>
                  <td><span className="pill pill-gray">{deptShort(r.department)}</span></td>
                  <td style={{ fontSize: 12 }}>{r.doj?.substring(0, 10)}</td>
                  <td style={{ fontSize: 12, fontWeight: 500, color: '#92400E' }}>
                    {r.exit_date?.substring(0, 10)}
                  </td>
                  <td>
                    <span className={`pill ${REASON_COLORS[r.exit_reason] || 'pill-gray'}`}>
                      {r.exit_reason}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{r.email}</td>
                  <td>
                    <button
                      className="btn btn-sm"
                      title="Restore to Master Data"
                      disabled={restoring === r.id}
                      onClick={() => handleRestore(r)}
                      style={{ background: '#E1F5EE', border: '1px solid #6EE7B7', color: '#065F46' }}
                    >
                      {restoring === r.id ? '...' : '↩ Restore'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span>Showing {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="page-controls">
              <button className="btn btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              <span style={{ fontSize: 12 }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}