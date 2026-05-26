import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { useToast, ToastContainer } from './components/Toast'
import Dashboard from './components/Dashboard'
import InstructorsTable from './components/InstructorsTable'
import ExitRecords from './components/ExitRecords'
import ImportTab from './components/ImportTab'

const TABS = ['Dashboard', 'Instructors', 'Exit Records', 'Import CSV']

export default function App() {
  const [tab, setTab]         = useState(0)
  const [data, setData]       = useState([])
  const [exits, setExits]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCM, setFilterCM] = useState('')
  const { toasts, addToast }  = useToast()

  const loadData = useCallback(async () => {
    const [{ data: instructors, error: e1 }, { data: exitRows, error: e2 }] = await Promise.all([
      supabase.from('instructors').select('*').order('name'),
      supabase.from('exits').select('*').order('exit_date', { ascending: false }),
    ])
    if (e1) { addToast('Failed to load instructors: ' + e1.message, 'error') }
    if (e2) { addToast('Failed to load exit records: ' + e2.message, 'error') }
    setData(instructors || [])
    setExits(exitRows || [])
    setLoading(false)
  }, [addToast])

  useEffect(() => { loadData() }, [loadData])

  function handleCMClick(cm) {
    setFilterCM(cm)
    setTab(1)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          Instructor <span className="brand-dot">DB</span>
          {!loading && (
            <span className="badge">{data.length} active</span>
          )}
          {!loading && exits.length > 0 && (
            <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', marginLeft: 4 }}>
              {exits.length} exited
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {loading ? 'Loading...' : `Refreshed ${new Date().toLocaleTimeString()}`}
          </span>
          <button className="btn btn-sm" onClick={loadData}>↻ Refresh</button>
        </div>
      </header>

      <main className="content">
        <div className="tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`tab${tab === i ? ' active' : ''}`}
              onClick={() => setTab(i)}
            >
              {t}
              {i === 2 && exits.length > 0 && (
                <span style={{
                  background: '#F59E0B', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 20, marginLeft: 6
                }}>{exits.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
            Loading data...
          </div>
        ) : (
          <>
            {tab === 0 && <Dashboard data={data} onCMClick={handleCMClick} />}
            {tab === 1 && (
              <InstructorsTable
                data={data}
                onRefresh={loadData}
                filterCM={filterCM}
                onClearCM={() => setFilterCM('')}
              />
            )}
            {tab === 2 && <ExitRecords data={exits} />}
            {tab === 3 && <ImportTab onRefresh={loadData} />}
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  )
}