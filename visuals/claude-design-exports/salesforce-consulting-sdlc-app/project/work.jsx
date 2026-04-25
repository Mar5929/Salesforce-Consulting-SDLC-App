// Work tab — subnav with Roadmap, Work Items (Tree/Board), Sprints
const { useState: useStateW } = React;

function Work({ sub, onSub, onOpenWi, onOpenReprop }) {
  return (
    <div className="content">
      <div className="subnav">
        {[
          { id: 'home', label: 'Home' },
          { id: 'admin', label: 'Admin Tasks' },
          { id: 'roadmap', label: 'Roadmap' },
          { id: 'items', label: 'Work Items' },
          { id: 'sprints', label: 'Sprints' },
        ].map(s => (
          <div key={s.id} className={`subnav-item ${sub === s.id ? 'active' : ''}`} onClick={() => onSub(s.id)}>
            {s.label}
          </div>
        ))}
      </div>
      {sub === 'home' && <WorkHome onOpenWi={onOpenWi} onOpenReprop={onOpenReprop} />}
      {sub === 'admin' && <AdminTasks />}
      {sub === 'roadmap' && <Roadmap onOpenReprop={onOpenReprop} />}
      {sub === 'items' && <WorkItems onOpenWi={onOpenWi} />}
      {sub === 'sprints' && <Sprints onOpenWi={onOpenWi} />}
    </div>
  );
}

function WorkHome({ onOpenWi, onOpenReprop }) {
  const D = window.DATA;
  return (
    <>
      <div className="reprop-banner" style={{marginBottom: 14}}>
        <div className="ico"><Icon name="sparkle" size={16} color="white" /></div>
        <div style={{flex: 1}}>
          <div className="title">Roadmap re-proposal pending SA review</div>
          <div className="sub">P3 CPQ restructure · Jump to Roadmap to review diff</div>
        </div>
        <button className="btn amber" onClick={onOpenReprop}>Review diff</button>
      </div>
      <div className="grid g-4" style={{marginBottom: 14}}>
        <div className="kpi"><div className="label">Phases</div><div className="value">4</div></div>
        <div className="kpi"><div className="label">Epics</div><div className="value">7</div><div className="sub">1 being removed</div></div>
        <div className="kpi"><div className="label">Work items</div><div className="value">41</div><div className="sub">+12 proposed</div></div>
        <div className="kpi"><div className="label">Blocked</div><div className="value" style={{color: '#DC2626'}}>1</div></div>
      </div>
      <div className="grid g-2">
        <div className="card">
          <h3>Admin tasks due this week</h3>
          <table className="tbl">
            <tbody>
              {D.adminTasks.slice(0, 4).map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight: 500}}>{t.title}</td>
                  <td><Avatar person={t.owner} size="xs" /></td>
                  <td className="mono small">{t.due}</td>
                  <td>{t.status === 'Done' ? <Chip tone="green">Done</Chip> : t.status === 'In Progress' ? <Chip tone="amber">In Progress</Chip> : <Chip tone="gray">Open</Chip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Recent activity · 48h</h3>
          <div className="activity">
            {[
              { who: 'AI', what: 'fired P3 roadmap re-proposal', when: '08:14', a: 'a-michael', init: 'AI' },
              { who: 'David Kim', what: 'moved WI-LM-LA-01 to In Review', when: 'Yesterday', a: 'a-david', init: 'DK' },
              { who: 'Sarah Chen', what: 'approved v3 roadmap', when: 'Apr 2', a: 'a-sarah', init: 'SC' },
            ].map((r, i) => (
              <div key={i} className="activity-row">
                <div className={`avatar xs ${r.a}`}>{r.init}</div>
                <div className="line">
                  <span className="who">{r.who}</span> <span className="what">{r.what}</span> <span className="when">· {r.when}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function AdminTasks() {
  const D = window.DATA;
  return (
    <>
      <div className="sec-head"><h2>Admin tasks</h2>
        <div className="actions">
          <button className="btn">Filter</button>
          <button className="btn primary"><Icon name="plus" size={12} color="white" /> New task</button>
        </div>
      </div>
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr>
            <th>Title</th><th>Owner</th><th>Due</th><th>Status</th><th>Created</th>
          </tr></thead>
          <tbody>
            {D.adminTasks.map(t => (
              <tr key={t.id}>
                <td className="title-cell">{t.title}</td>
                <td><div style={{display: 'flex', alignItems: 'center', gap: 6}}><Avatar person={t.owner} size="xs" /><span>{D.team.find(m=>m.id===t.owner)?.name}</span></div></td>
                <td className="mono small">{t.due}</td>
                <td>{t.status === 'Done' ? <Chip tone="green">Done</Chip> : t.status === 'In Progress' ? <Chip tone="amber">In Progress</Chip> : <Chip tone="gray">Open</Chip>}</td>
                <td className="muted small">Apr 10</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Roadmap({ onOpenReprop }) {
  const D = window.DATA;
  return (
    <>
      <div className="reprop-banner" style={{marginBottom: 14}}>
        <div className="ico"><Icon name="sparkle" size={16} color="white" /></div>
        <div style={{flex: 1}}>
          <div className="title">AI roadmap re-proposal · fired 4h ago</div>
          <div className="sub">Phase 3 "Quoting" restructure · replace with "CPQ Implementation"</div>
        </div>
        <button className="btn amber" onClick={onOpenReprop}>Review diff <Icon name="arrowRight" size={12} color="white" /></button>
      </div>

      <div className="sec-head">
        <h2>Current roadmap</h2>
        <div style={{fontSize: 11.5, color: '#64748B'}}>{D.project.version}</div>
        <div className="actions">
          <button className="btn"><Icon name="refresh" size={12} /> Trigger re-proposal</button>
          <button className="btn"><Icon name="clock" size={12} /> Version history</button>
          <button className="btn primary"><Icon name="edit" size={12} color="white" /> Edit phases</button>
        </div>
      </div>

      {D.phases.map((p, i) => (
        <div key={p.id} className="card" style={{marginBottom: 10, padding: 0, overflow: 'hidden'}}>
          <div style={{display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 100px', alignItems: 'center', padding: '12px 14px', background: p.reprop ? '#FFFBEB' : 'white', borderBottom: '1px solid #F1F5F9'}}>
            <div>
              <div style={{width: 32, height: 32, borderRadius: 6, background: p.reprop ? '#F59E0B' : '#4F46E5', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12.5}}>
                P{i+1}
              </div>
            </div>
            <div>
              <div style={{fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10}}>
                {p.name}
                {p.reprop && <Chip tone="amber">re-proposal pending</Chip>}
              </div>
              <div style={{fontSize: 12, color: '#64748B', marginTop: 3}}>{p.descriptor}</div>
            </div>
            <div style={{fontSize: 11, color: '#64748B'}}>{p.epicCount} epics</div>
            <div style={{fontSize: 11, color: '#64748B'}}>{p.duration}</div>
            <div><Readiness score={p.readiness} /></div>
          </div>
        </div>
      ))}
    </>
  );
}

function WorkItems({ onOpenWi }) {
  const [lens, setLens] = useStateW('tree');
  return (
    <>
      <div className="toolbar">
        <div className="seg">
          <div className={`seg-btn ${lens === 'tree' ? 'active' : ''}`} onClick={() => setLens('tree')}>Tree</div>
          <div className={`seg-btn ${lens === 'board' ? 'active' : ''}`} onClick={() => setLens('board')}>Board</div>
          <div className={`seg-btn ${lens === 'timeline' ? 'active' : ''}`} onClick={() => setLens('timeline')}>Timeline</div>
        </div>
        <div className="filter"><span className="k">Phase</span> <span className="v">All</span> <Icon name="chevronDown" size={11} /></div>
        <div className="filter"><span className="k">Assignee</span> <span className="v">Anyone</span> <Icon name="chevronDown" size={11} /></div>
        <div className="filter"><span className="k">Status</span> <span className="v">All</span> <Icon name="chevronDown" size={11} /></div>
        <div className="filter"><span className="k">Sprint</span> <span className="v">{lens === 'board' ? 'Sprint 3 · active' : 'All'}</span> <Icon name="chevronDown" size={11} /></div>
        <div className="spacer" />
        <button className="btn"><Icon name="plus" size={12} /> New work item</button>
      </div>

      {lens === 'tree' && <TreeLens onOpenWi={onOpenWi} />}
      {lens === 'board' && <BoardLens onOpenWi={onOpenWi} />}
      {lens === 'timeline' && <TimelineLens onOpenWi={onOpenWi} />}
    </>
  );
}

function TreeLens({ onOpenWi }) {
  const D = window.DATA;
  const [expanded, setExpanded] = useStateW({ P1: true, 'LM-LA': true });
  const toggle = id => setExpanded(e => ({...e, [id]: !e[id]}));
  return (
    <div className="card" style={{padding: 0, overflow: 'hidden'}}>
      {/* header row */}
      <div className="tree-row" style={{background: '#F8FAFC', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B', fontWeight: 600}}>
        <div>Name</div><div>Readiness</div><div>Assignee</div><div>Status</div><div>Points / Qs</div><div></div>
      </div>
      <div className="tree">
        {D.phases.map(p => {
          const epics = D.epics.filter(e => e.phase === p.id);
          const open = expanded[p.id];
          return (
            <React.Fragment key={p.id}>
              <div className="tree-row phase" onClick={() => toggle(p.id)}>
                <div className="title-wrap">
                  <span className="caret"><Icon name={open ? "chevronDown" : "chevronRight"} size={12} /></span>
                  <span className="mono" style={{background: p.reprop ? '#F59E0B' : '#E0E7FF', color: p.reprop ? 'white' : '#3730A3', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 600}}>{p.id}</span>
                  <span className="t">{p.name}</span>
                  {p.reprop && <Chip tone="amber">re-proposal pending</Chip>}
                </div>
                <div><Readiness score={p.readiness} /></div>
                <div></div>
                <div></div>
                <div style={{fontSize: 11, color: '#64748B'}}>{epics.length} epics</div>
                <div></div>
              </div>
              {open && epics.map(e => {
                const wis = D.workItems.filter(w => w.epic === e.id);
                const eopen = expanded[e.id];
                return (
                  <React.Fragment key={e.id}>
                    <div className="tree-row epic" onClick={() => toggle(e.id)}>
                      <div className="title-wrap">
                        <span className="caret"><Icon name={eopen ? "chevronDown" : "chevronRight"} size={12} /></span>
                        <span className="mono" style={{background: e.reprop === 'remove' ? '#FEE2E2' : '#F1F5F9', color: e.reprop === 'remove' ? '#B91C1C' : '#475569', padding: '2px 6px', borderRadius: 4, fontSize: 10.5, fontWeight: 600, textDecoration: e.reprop === 'remove' ? 'line-through' : 'none'}}>{e.id}</span>
                        <span className="t">{e.name}</span>
                        {e.reprop === 'remove' && <Chip tone="red">removing</Chip>}
                      </div>
                      <div><Readiness score={e.readiness} /></div>
                      <div></div>
                      <div></div>
                      <div style={{fontSize: 11, color: '#64748B'}}>{e.wiCount} items{e.openQs > 0 && <span style={{color:'#B91C1C'}}> · {e.openQs} Qs</span>}</div>
                      <div></div>
                    </div>
                    {eopen && wis.map(w => (
                      <div key={w.id} className="tree-row wi" onClick={() => onOpenWi(w.id)}>
                        <div className="title-wrap">
                          <span className="mono" style={{color: '#64748B', fontSize: 10.5, width: 94, flexShrink: 0}}>{w.id}</span>
                          <span className="t" style={{color: '#0F172A', fontWeight: 500}}>{w.title}</span>
                          {w.blocked && <Chip tone="red">blocked</Chip>}
                          {w.affectedByReprop && <Chip tone="amber">reprop impact</Chip>}
                        </div>
                        <div></div>
                        <div>{w.assignee ? <Avatar person={w.assignee} size="xs" /> : <span className="muted small">—</span>}</div>
                        <div><StatusChip status={w.status} /></div>
                        <div style={{fontSize: 11, color: '#475569', fontWeight: 500}}>{w.points} pts</div>
                        <div></div>
                      </div>
                    ))}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function BoardLens({ onOpenWi }) {
  const D = window.DATA;
  const sprintItems = D.workItems.filter(w => w.sprint === 3);
  return (
    <div className="kanban">
      {D.statuses.map(s => {
        const cards = sprintItems.filter(w => w.status === s.id);
        return (
          <div key={s.id} className="kcol">
            <div className="kcol-head">
              <span className={`chip ${s.className}`} style={{fontSize: 10.5}}>{s.label}</span>
              <span className="k-count">{cards.length}</span>
            </div>
            {cards.map(w => (
              <div key={w.id} className="kcard" onClick={() => onOpenWi(w.id)}>
                <div className="kid">{w.id}</div>
                <div className="kt">{w.title}</div>
                <div className="kbot">
                  {w.assignee ? <Avatar person={w.assignee} size="xs" /> : <span className="muted small">unassigned</span>}
                  <span className="kpts">{w.points}</span>
                </div>
              </div>
            ))}
            {cards.length === 0 && <div style={{padding: 12, fontSize: 11, color: '#94A3B8', textAlign: 'center'}}>—</div>}
          </div>
        );
      })}
    </div>
  );
}

function TimelineLens({ onOpenWi }) {
  const D = window.DATA;
  // Render phases as horizontal bars
  const bands = [
    { id: 'P1', start: 0, end: 35, color: '#4F46E5' },
    { id: 'P2', start: 30, end: 55, color: '#0891B2' },
    { id: 'P3', start: 50, end: 80, color: '#F59E0B' },
    { id: 'P4', start: 75, end: 92, color: '#16A34A' },
  ];
  return (
    <div className="card" style={{padding: 16}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 8, paddingLeft: 180}}>
        {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map(m => <span key={m}>{m}</span>)}
      </div>
      {D.phases.map((p, i) => {
        const b = bands[i];
        return (
          <div key={p.id} style={{display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', marginBottom: 10, height: 32}}>
            <div style={{fontSize: 12.5}}>
              <span className="mono" style={{color: '#475569', fontSize: 10.5, marginRight: 6}}>{p.id}</span>
              <span style={{fontWeight: 500}}>{p.name}</span>
            </div>
            <div style={{position: 'relative', height: 28, background: '#F8FAFC', borderRadius: 4}}>
              <div style={{position: 'absolute', left: `${b.start}%`, width: `${b.end - b.start}%`, top: 2, bottom: 2, background: p.reprop ? 'repeating-linear-gradient(45deg, #FEF3C7, #FEF3C7 6px, #FDE68A 6px, #FDE68A 12px)' : b.color, borderRadius: 3, display: 'flex', alignItems: 'center', paddingLeft: 8, color: p.reprop ? '#92400E' : 'white', fontSize: 11, fontWeight: 500, border: p.reprop ? '1px dashed #F59E0B' : 'none'}}>
                {p.descriptor.split('·')[0].trim()}
              </div>
              {/* today marker */}
              <div style={{position: 'absolute', left: '42%', top: -4, bottom: -4, width: 2, background: '#4F46E5'}}></div>
            </div>
          </div>
        );
      })}
      <div style={{marginTop: 8, fontSize: 11, color: '#4F46E5', paddingLeft: 180}}>Today · Apr 17</div>
    </div>
  );
}

function Sprints({ onOpenWi }) {
  const D = window.DATA;
  const sprintItems = D.workItems.filter(w => w.sprint === 3);
  const backlog = D.workItems.filter(w => !w.sprint && w.status === 'ready');
  return (
    <>
      <div className="card" style={{marginBottom: 14}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div>
            <div style={{fontSize: 16, fontWeight: 600}}>Sprint 3 <Chip tone="green">active</Chip></div>
            <div style={{fontSize: 12, color: '#64748B'}}>{D.sprint.window} · 4 days left</div>
          </div>
          <div style={{flex: 1}} />
          <div style={{display: 'flex', gap: 20, alignItems: 'center', fontSize: 12}}>
            <div><div className="muted small">Committed</div><div style={{fontSize: 18, fontWeight: 600}}>{D.sprint.committed} pts</div></div>
            <div><div className="muted small">Completed</div><div style={{fontSize: 18, fontWeight: 600, color: '#16A34A'}}>{D.sprint.completed} pts</div></div>
            <div><div className="muted small">Capacity</div><div style={{fontSize: 18, fontWeight: 600}}>{D.sprint.capacity} pts</div></div>
          </div>
          <button className="btn">Plan next sprint</button>
          <button className="btn danger">Close Sprint 3</button>
        </div>
        <div className="progress" style={{marginTop: 12}}>
          <div className="fill" style={{width: `${100 * D.sprint.completed / D.sprint.committed}%`}}></div>
        </div>
      </div>

      {/* AI sprint intelligence callouts */}
      <div className="grid g-3" style={{marginBottom: 14}}>
        <div className="conflict">
          <div className="ch"><Icon name="warn" size={13} color="#78350F" /> Conflict · serialize</div>
          <div className="cb">WI-LM-LA-02 and WI-LM-LC-04 both modify the Lead object. Recommend serializing: LA-02 first, then LC-04.</div>
        </div>
        <div className="ai-card" style={{padding: 12}}>
          <div className="ai-head"><Icon name="sparkle" size={11} /> PARALLELIZATION</div>
          <div style={{fontSize: 12, color: '#1E1B4B', lineHeight: 1.5}}>WI-LM-LA-03 (notify) and WI-LM-LA-05 (reason logging) have no component overlap. Safe to run concurrently.</div>
        </div>
        <div className="ai-card" style={{padding: 12}}>
          <div className="ai-head"><Icon name="sparkle" size={11} /> CAPACITY</div>
          <div style={{fontSize: 12, color: '#1E1B4B', lineHeight: 1.5}}>David is at 29 pts · team capacity 45. Ship WI-LM-LC-02 to unassigned or spread across the team.</div>
        </div>
      </div>

      <div className="grid g-2">
        <div>
          <div className="sec-head"><h2>Backlog · Ready</h2><div className="actions"><span className="muted small">{backlog.length} items · drag into sprint →</span></div></div>
          <div className="card" style={{padding: 0}}>
            {backlog.map(w => (
              <div key={w.id} style={{padding: '10px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'grab', display: 'flex', alignItems: 'center', gap: 10}} onClick={() => onOpenWi(w.id)}>
                <Icon name="grid" size={12} color="#94A3B8" />
                <span className="mono small" style={{color: '#475569', width: 100}}>{w.id}</span>
                <span style={{flex: 1, fontSize: 12.5, fontWeight: 500}}>{w.title}</span>
                {w.blocked && <Chip tone="red">blocked</Chip>}
                <span className="small" style={{fontWeight: 600, color: '#475569'}}>{w.points}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="sec-head"><h2>Sprint 3 committed</h2><div className="actions"><span className="muted small">{sprintItems.length} items · {D.sprint.committed} pts</span></div></div>
          <div className="card" style={{padding: 0}}>
            {sprintItems.map(w => (
              <div key={w.id} style={{padding: '10px 12px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10}} onClick={() => onOpenWi(w.id)}>
                <span className="mono small" style={{color: '#475569', width: 100}}>{w.id}</span>
                <span style={{flex: 1, fontSize: 12.5, fontWeight: 500}}>{w.title}</span>
                {w.assignee ? <Avatar person={w.assignee} size="xs" /> : <span className="muted small">—</span>}
                <StatusChip status={w.status} />
                <span className="small" style={{fontWeight: 600, color: '#475569'}}>{w.points}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

window.Work = Work;
