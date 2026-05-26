import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from './Toast'
import InstructorModal from './InstructorModal'
import ExitModal from './ExitModal'

const PAGE = 25

function uniq(arr) { return [...new Set(arr.filter(Boolean))].sort() }

export default function InstructorsTable({ data, onRefresh, filterCM, onClearCM }) {
  const [search, setSearch]   = useState('')
  const [fCM, setFCM]         = useState(filterCM || '')
  const [fDept, setFDept]     = useState('')
  const [fLoc, setFLoc]       = useState('')
  const [fGender, setFGender] = useState('')
  const [page, setPage]       = useState(1)
  const [modal, setModal]     = useState(null)
  const [exitRec, setExitRec] = useState(null)

  useMemo(() => { if (filterCM) setFCM(filterCM) }, [filterCM])

  const cms   = useMemo(() => uniq(data.map(r => r.capability_manager)), [data])
  const depts = useMemo(() => uniq(data.map(r => r.department)), [data])
  const locs  = useMemo(() => uniq(data.map(r => r.work_location)), [data])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return data.filter(r => {
      if (fCM     && r.capability_manager !== fCM)     return false
      if (fDept   && r.department         !== fDept)   return false
      if (fLoc    && r.work_location      !== fLoc)    return false
      if (fGender && r.gender             !== fGender) return false
      if (s) {
        const hay = [r.employee_id, r.name, r.email, r.role, r.department].join(' ').toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [data, search, fCM, fDept, fLoc, fGender])

  const totalPages = Math.ceil(filtered.length / PAGE)
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE)

  function clearFilters() {
    setSearch(''); setFCM(''); setFDept(''); setFLoc(''); setFGender('')
    setPage(1); onClearCM?.()
  }

  function removeFilter(setter) { setter(''); setPage(1) }

  const chips = [
    fCM     && { label: fCM,          clear: () => { setFCM(''); setPage(1); onClearCM?.() } },
    fDept   && { label: fDept,         clear: () => removeFilter(setFDept)   },
    fLoc    && { label: fLoc,          clear: () => removeFilter(setFLoc)    },
    fGender && { label: fGender,       clear: () => removeFilter(setFGender) },
    search  && { label: `"${search}"`, clear: () => { setSearch(''); setPage(1) } },
  ].filter(Boolean)

  async function handleDelete(r) {
    if (!window.confirm(`Delete "${r.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('instructors').delete().eq('id', r.id)
    if (error) { toast('Error: ' + error.message, 'error'); return }
    toast('Record deleted')
    onRefresh()
  }

  function deptShort(d) { return (d || '').replace('Instructors - ', '') }

  return (
    <div>
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
        <select value={fLoc} onChange={e => { setFLoc(e.target.value); setPage(1) }}>
          <option value="">All Locations</option>
          {locs.map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={fGender} onChange={e => { setFGender(e.target.value); setPage(1) }}>
          <option value="">All Genders</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
        {chips.length > 0 && (
          <button className="btn btn-sm" onClick={clearFilters}>Clear all</button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="chips">
          {chips.map((c, i) => (
            <div key={i} className="chip">
              {c.label}
              <button className="chip-x" onClick={c.clear}>×</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <span className="card-title">
            {fCM ? `${fCM}'s Instructors` : 'All Instructors'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{filtered.length} records</span>
            <button className="btn btn-sm btn-primary" onClick={() => setModal('add')}>
              + Add Instructor
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Emp ID</th>
                <th style={{ width: 150 }}>Name</th>
                <th style={{ width: 130 }}>Role</th>
                <th style={{ width: 160 }}>Capability Manager</th>
                <th style={{ width: 160 }}>Department</th>
                <th style={{ width: 90 }}>Location</th>
                <th style={{ width: 70 }}>Gender</th>
                <th style={{ width: 100 }}>DOJ</th>
                <th>Email</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan={10} className="loading-row">No records found</td></tr>
              ) : slice.map(r => (
                <tr key={r.id}>
                  <td><code style={{ fontSize: 11 }}>{r.employee_id}</code></td>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td style={{ color: '#6b7280' }}>{r.role}</td>
                  <td>{r.capability_manager}</td>
                  <td><span className="pill pill-green">{deptShort(r.department)}</span></td>
                  <td>{r.work_location}</td>
                  <td>
                    <span className={`pill ${r.gender === 'Female' ? 'pill-pink' : 'pill-blue'}`}>
                      {r.gender}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{r.doj?.substring(0, 10)}</td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>{r.email}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-sm btn-icon"
                        title="Edit"
                        onClick={() => setModal(r)}
                      >✏️</button>
                      <button
                        className="btn btn-sm btn-icon"
                        title="Mark as Exited"
                        onClick={() => setExitRec(r)}
                        style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' }}
                      >🚪</button>
                      <button
                        className="btn btn-sm btn-icon btn-danger"
                        title="Delete permanently"
                        onClick={() => handleDelete(r)}
                      >🗑</button>
                    </div>
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

      {modal && (
        <InstructorModal
          record={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={onRefresh}
        />
      )}

      {exitRec && (
        <ExitModal
          record={exitRec}
          onClose={() => setExitRec(null)}
          onDone={onRefresh}
        />
      )}
    </div>
  )
}