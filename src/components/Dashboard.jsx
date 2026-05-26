export default function Dashboard({ data, onCMClick }) {
  const cms = {}
  const maxCount = { val: 0 }

  data.forEach(r => {
    if (!r.capability_manager) return
    if (!cms[r.capability_manager]) cms[r.capability_manager] = { count: 0, depts: new Set() }
    cms[r.capability_manager].count++
    if (r.department) cms[r.capability_manager].depts.add(r.department)
    if (cms[r.capability_manager].count > maxCount.val) maxCount.val = cms[r.capability_manager].count
  })

  const totalCMs = Object.keys(cms).length
  const totalDepts = new Set(data.map(r => r.department).filter(Boolean)).size
  const totalLocs  = new Set(data.map(r => r.work_location).filter(Boolean)).size

  const sorted = Object.entries(cms).sort((a, b) => b[1].count - a[1].count)

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Instructors</div>
          <div className="stat-value">{data.length}</div>
          <div className="stat-sub">across all teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Capability Managers</div>
          <div className="stat-value">{totalCMs}</div>
          <div className="stat-sub">managing teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Departments</div>
          <div className="stat-value">{totalDepts}</div>
          <div className="stat-sub">subject areas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Locations</div>
          <div className="stat-value">{totalLocs}</div>
          <div className="stat-sub">work sites</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Instructors per Capability Manager</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Click a card to filter the table</span>
        </div>
        <div className="cm-grid">
          {sorted.map(([cm, v]) => (
            <div
              key={cm}
              className="cm-card"
              onClick={() => onCMClick(cm)}
              title={`Filter by ${cm}`}
            >
              <div className="cm-count">{v.count}</div>
              <div className="cm-name">{cm}</div>
              <div className="cm-sub">{v.depts.size} dept{v.depts.size !== 1 ? 's' : ''}</div>
              <div className="cm-bar">
                <div className="cm-bar-fill" style={{ width: `${(v.count / maxCount.val) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
