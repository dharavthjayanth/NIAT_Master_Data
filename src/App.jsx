import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { useToast, ToastContainer } from './components/Toast'
import Dashboard from './components/Dashboard'
import InstructorsTable from './components/InstructorsTable'
import ImportTab from './components/ImportTab'

const TABS = ['Dashboard', 'Instructors', 'Import CSV']

export default function App() {
  const [tab, setTab]       = useState(0)
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCM, setFilterCM] = useState('')
  const { toasts, addToast } = useToast()

  const loadData = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from('instructors')
      .select('*')
      .order('name')
    if (error) { addToast('Failed to load data: ' + error.message, 'error'); return }
    setData(rows || [])
    setLoading(false)
  }, [addToast])

  useEffect(() => { loadData() }, [loadData])

  function handleCMClick(cm) {
    setFilterCM(cm)
    setTab(1)
  }

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          Instructor <span className="brand-dot">DB</span>
          {!loading && (
            <span className="badge">{data.length} instructors</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {loading ? 'Loading...' : `Last refreshed ${new Date().toLocaleTimeString()}`}
          </span>
          <button
            className="btn btn-sm"
            onClick={loadData}
            title="Refresh data"
          >
            ↻ Refresh
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="content">
        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`tab${tab === i ? ' active' : ''}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af' }}>
            Loading instructors...
          </div>
        ) : (
          <>
            {tab === 0 && (
              <Dashboard data={data} onCMClick={handleCMClick} />
            )}
            {tab === 1 && (
              <InstructorsTable
                data={data}
                onRefresh={loadData}
                filterCM={filterCM}
                onClearCM={() => setFilterCM('')}
              />
            )}
            {tab === 2 && (
              <ImportTab onRefresh={loadData} />
            )}
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
