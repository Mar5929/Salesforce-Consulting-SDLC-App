// Dashboards tab — role-adaptive saved dashboards per PRD §17
const { useState: useStateDash } = React;

const DASHBOARDS = [
  { id: 'pm',       label: 'PM Overview',     roles: ['sarah','jamie'], desc: 'Velocity, risks, deliverables' },
  { id: 'sprint',   label: 'Sprint',          roles: ['all'],           desc: 'Burndown · status · workload' },
  { id: 'roadmap',  label: 'Roadmap',         roles: ['all'],           desc: 'Phases · epics · milestones' },
  { id: 'qa',       label: 'QA',              roles: ['sarah','marcus','jamie'], desc: 'Test execution · defects' },
  { id: 'usage',    label: 'Usage & Costs',   roles: ['sarah','jamie','michael'], desc: 'AI tokens · Inngest events' },
  { id: 'health',   label: 'Health score',    roles: ['all'],           desc: 'Signals driving Yellow/Red' },
];

function Dashboards({ viewingAs, onOpenWi, onOpenReprop, onTab }) {
  const D = window.DATA;
  const [active, setActive] = useStateDash('pm');
  const [range, setRange] = useStateDash('30d');

  return (
    <div className="content" style={{display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'flex-start'}}>
      {/* Left: dashboard picker */}
      <div className="card" style={{padding: 8, position: 'sticky', top: 0}}>
        <div style={{padding: '6px 8px 8px', fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600}}>Dashboards</div>
        {DASHBOARDS.map(d => (
          <div key={d.id}
            onClick={() => setActive(d.id)}
            style={{
              padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
              background: active === d.id ? '#EEF2FF' : 'transparent',
              borderLeft: active === d.id ? '2px solid #4F46E5' : '2px solid transparent',
              marginBottom: 2,
            }}>
            <div style={{fontSize: 12.5, fontWeight: active === d.id ? 600 : 500, color: active === d.id ? '#312E81' : '#0F172A'}}>{d.label}</div>
            <div style={{fontSize: 11, color: '#64748B', marginTop: 1}}>{d.desc}</div>
          </div>
        ))}
        <div style={{margin: '8px 4px 2px', padding: '8px 8px 2px', borderTop: '1px dashed #E2E8F0', fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600}}>Saved views</div>
        <div style={{padding: '6px 10px', fontSize: 12, color: '#475569', cursor: 'pointer'}}>◆ My sprint snapshot</div>
        <div style={{padding: '6px 10px', fontSize: 12, color: '#475569', cursor: 'pointer'}}>◆ Client weekly readout</div>
        <button className="btn sm" style={{margin: '6px 4px'}}><Icon name="plus" size={11} /> New view</button>
      </div>

      {/* Right: active dashboard */}
      <div>
        <div className="toolbar" style={{marginBottom: 14}}>
          <div style={{fontSize: 15, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em'}}>
            {DASHBOARDS.find(d => d.id === active).label}
          </div>
          <div className="muted small" style={{marginLeft: 10}}>Last refreshed 2 min ago · auto-refresh on state change</div>
          <div className="spacer" />
          <div className="seg">
            {['7d','30d','sprint','custom'].map(r => (
              <div key={r} className={`seg-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r === '7d' ? 'Last 7d' : r === '30d' ? 'Last 30d' : r === 'sprint' ? 'Current sprint' : 'Custom'}</div>
            ))}
          </div>
          <button className="btn sm"><Icon name="refresh" size={11} /> Refresh</button>
          <button className="btn sm"><Icon name="download" size={11} /> Export</button>
        </div>

        {active === 'pm'      && <PMDashboard onOpenWi={onOpenWi} onOpenReprop={onOpenReprop} onTab={onTab} />}
        {active === 'sprint'  && <SprintDashboard onOpenWi={onOpenWi} />}
        {active === 'roadmap' && <RoadmapDashboard onTab={onTab} />}
        {active === 'qa'      && <QADashboard onOpenWi={onOpenWi} />}
        {active === 'usage'   && <UsageDashboard range={range} />}
        {active === 'health'  && <HealthDashboard onOpenWi={onOpenWi} />}
      </div>
    </div>
  );
}

// ---------------- PM Dashboard ----------------
function PMDashboard({ onOpenWi, onOpenReprop, onTab }) {
  const D = window.DATA;
  return (
    <div className="col">
      {/* Top KPI band */}
      <div className="grid g-4">
        <div className="kpi">
          <div className="label">Health</div>
          <div className="value" style={{fontSize: 22, color: '#D97706'}}>Yellow</div>
          <div className="sub">2 signals · timeline risk</div>
        </div>
        <div className="kpi">
          <div className="label">Velocity · last 3 sprints</div>
          <div className="value">32.7<span style={{fontSize: 12, color: '#64748B', fontWeight: 500, marginLeft: 4}}>pts/spr</span></div>
          <div className="sub"><span className="delta up">+8%</span> vs prior three</div>
        </div>
        <div className="kpi">
          <div className="label">Roadmap progress</div>
          <div className="value">38%</div>
          <div className="progress" style={{marginTop: 8}}><div className="fill" style={{width: '38%'}}></div></div>
        </div>
        <div className="kpi">
          <div className="label">Client-owned Qs overdue</div>
          <div className="value" style={{color: '#B91C1C'}}>2</div>
          <div className="sub">&gt; 3 days since follow-up</div>
        </div>
      </div>

      {/* Velocity + Risks */}
      <div className="grid g-2to1">
        <div className="card">
          <h3>Velocity · last 8 sprints</h3>
          <VelocityChart />
          <div style={{display: 'flex', gap: 16, fontSize: 11, color: '#64748B', marginTop: 8}}>
            <span><i style={{display:'inline-block', width:10, height:10, background:'#4F46E5', borderRadius:2, marginRight:4}}></i>Completed</span>
            <span><i style={{display:'inline-block', width:10, height:10, background:'#CBD5E1', borderRadius:2, marginRight:4}}></i>Committed</span>
            <span style={{marginLeft: 'auto'}}>Avg commit 37 · avg complete 33 · spillover 10%</span>
          </div>
        </div>

        <div className="card">
          <h3>Active risks <span className="pill">3</span></h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {D.risks.map(r => (
              <div key={r.id} style={{borderLeft: `3px solid ${r.sev === 'High' ? '#EF4444' : r.sev === 'Medium' ? '#F59E0B' : '#94A3B8'}`, paddingLeft: 10}}>
                <div style={{fontSize: 12.5, fontWeight: 500, color: '#0F172A', lineHeight: 1.4}}>{r.text}</div>
                <div style={{fontSize: 11, color: '#64748B', marginTop: 3, display: 'flex', gap: 8}}>
                  <Chip tone={r.sev === 'High' ? 'red' : r.sev === 'Medium' ? 'amber' : 'gray'}>{r.sev}</Chip>
                  <span>{r.owner.split(' ')[0]}</span>
                  <span className="mono">{r.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deliverables + Client-Owned + Phase readiness */}
      <div className="grid g-3">
        <div className="card">
          <h3>Upcoming deliverables</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12}}>
            {[
              { name: 'Sprint 3 status report', due: 'Apr 28', owner: 'jamie', state: 'draft' },
              { name: 'BRD v3 · CPQ addendum',  due: 'May 2',  owner: 'priya', state: 'pending reprop' },
              { name: 'Phase 2 readout deck',    due: 'May 8',  owner: 'sarah', state: 'not started' },
              { name: 'SDD · Lead Assignment',  due: 'May 12', owner: 'sarah', state: 'on track' },
            ].map((d, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #F1F5F9'}}>
                <Avatar person={d.owner} size="xs" />
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 12, fontWeight: 500, color: '#0F172A'}}>{d.name}</div>
                  <div style={{fontSize: 11, color: '#64748B'}}>Due {d.due} · {d.state}</div>
                </div>
                <Chip tone={d.state === 'on track' ? 'green' : d.state === 'draft' ? 'amber' : d.state === 'pending reprop' ? 'red' : 'gray'}>{d.state === 'on track' ? '✓' : d.state === 'draft' ? 'wip' : d.state === 'pending reprop' ? '!' : '—'}</Chip>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Client-owned Qs · needs follow-up</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12}}>
            {D.questions.filter(q => q.ownerType === 'client' && q.state === 'open').slice(0, 4).map(q => (
              <div key={q.id} style={{padding: '7px 10px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6}}>
                <div style={{display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3}}>
                  <span className="mono" style={{fontSize: 10.5, color: '#92400E', fontWeight: 600}}>{q.id}</span>
                  <span className="muted small" style={{marginLeft: 'auto'}}>asked {q.askedDate.slice(5)}</span>
                </div>
                <div style={{fontSize: 12, color: '#1F2937', lineHeight: 1.4}}>{q.text}</div>
                <div style={{marginTop: 6, fontSize: 10.5, color: '#78350F'}}>Owner: {q.owner} · blocks {q.blocks || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card clickable-card" style={{cursor: 'pointer'}} onClick={() => onTab && onTab('work')}>
          <h3>Phase readiness</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {D.phases.map(p => (
              <div key={p.id} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <div style={{width: 28, height: 22, borderRadius: 4, background: '#F1F5F9', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, color: '#475569'}}>{p.id}</div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 12, fontWeight: 500, color: '#0F172A'}}>{p.name}</div>
                  <div style={{fontSize: 10.5, color: '#64748B'}}>{p.duration}</div>
                </div>
                <Readiness score={p.readiness} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VelocityChart() {
  const data = [
    { name: 'S-4', c: 28, d: 25 },
    { name: 'S-3', c: 34, d: 30 },
    { name: 'S-2', c: 36, d: 32 },
    { name: 'S-1', c: 38, d: 40 },
    { name: 'S+0', c: 32, d: 28 },
    { name: 'S1',  c: 32, d: 28 },
    { name: 'S2',  c: 38, d: 36 },
    { name: 'S3',  c: 40, d: 24 },
  ];
  const max = 45, w = 620, h = 180, pad = 28, bw = (w - pad*2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{width: '100%', height: 200}}>
      {[0.25, 0.5, 0.75, 1].map((p, i) => (
        <g key={i}>
          <line x1={pad} x2={w - pad} y1={h - h*p} y2={h - h*p} stroke="#F1F5F9" />
          <text x={pad - 6} y={h - h*p + 3} fontSize="9" fill="#94A3B8" textAnchor="end" fontFamily="Inter">{Math.round(max*p)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pad + bw*i + 4;
        const cH = (d.c / max) * h;
        const dH = (d.d / max) * h;
        return (
          <g key={d.name}>
            <rect x={x} y={h - cH} width={bw*0.4} height={cH} fill="#CBD5E1" rx="2" />
            <rect x={x + bw*0.42} y={h - dH} width={bw*0.4} height={dH} fill={i === data.length - 1 ? '#4F46E5' : '#6366F1'} rx="2" />
            <text x={x + bw*0.42} y={h + 14} fontSize="9.5" fill="#64748B" fontFamily="Inter">{d.name}</text>
          </g>
        );
      })}
      {/* trend line */}
      <polyline
        fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3"
        points={data.map((d, i) => {
          const avg = (d.c + d.d) / 2;
          return `${pad + bw*i + bw/2},${h - (avg/max)*h}`;
        }).join(' ')} />
    </svg>
  );
}

// ---------------- Sprint Dashboard ----------------
function SprintDashboard({ onOpenWi }) {
  const D = window.DATA;
  const sprint = D.sprint;
  const byStatus = {};
  D.workItems.filter(w => w.sprint === 3).forEach(w => {
    byStatus[w.status] = (byStatus[w.status] || 0) + 1;
  });
  const mandatoryMissing = [
    { id: 'WI-LM-LC-02', missing: ['GWT acceptance criteria'] },
    { id: 'WI-LM-LC-04', missing: ['GWT acceptance criteria', 'impacted components'] },
  ];
  const conflicts = [
    { text: 'WI-LM-LA-02 and WI-LM-LC-04 both modify Lead object', sev: 'serialize' },
  ];
  const byDev = [
    { who: 'david',  wips: 4, pts: 21 },
    { who: 'sarah',  wips: 1, pts: 5 },
    { who: 'priya',  wips: 0, pts: 0 },
    { who: 'marcus', wips: 1, pts: 3 },
  ];
  return (
    <div className="col">
      <div className="grid g-4">
        <div className="kpi"><div className="label">Sprint</div><div className="value" style={{fontSize: 16, fontWeight: 600}}>{sprint.name}</div><div className="sub mono">{sprint.window}</div></div>
        <div className="kpi"><div className="label">Committed</div><div className="value">{sprint.committed}<span style={{color:'#94A3B8', fontSize:13, marginLeft:4}}>pts</span></div><div className="sub">capacity {sprint.capacity}</div></div>
        <div className="kpi"><div className="label">Completed</div><div className="value" style={{color:'#16A34A'}}>{sprint.completed}<span style={{color:'#94A3B8', fontSize:13, marginLeft:4}}>pts</span></div><div className="progress" style={{marginTop:8}}><div className="fill" style={{width: '60%', background:'#16A34A'}}></div></div></div>
        <div className="kpi"><div className="label">Remaining</div><div className="value">{sprint.remaining}<span style={{color:'#94A3B8', fontSize:13, marginLeft:4}}>pts</span></div><div className="sub">4 days left</div></div>
      </div>

      <div className="grid g-2to1">
        <div className="card">
          <h3>Burndown</h3>
          <BurndownMini />
          <div style={{fontSize: 11, color: '#64748B', marginTop: 8}}>
            On track — behind ideal by 2 points. Weekend dip typical; trajectory remains inside the sprint window.
          </div>
        </div>

        <div className="card">
          <h3>Workload by developer</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {byDev.map(d => (
              <div key={d.who} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <Avatar person={d.who} size="xs" />
                <span style={{flex: 1, fontSize: 12, fontWeight: 500, color: '#0F172A'}}>{d.who[0].toUpperCase() + d.who.slice(1)}</span>
                <div style={{width: 80, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden'}}>
                  <div style={{width: `${Math.min(d.pts*4, 100)}%`, height: '100%', background: d.pts > 15 ? '#F59E0B' : '#4F46E5'}}></div>
                </div>
                <span className="mono" style={{fontSize: 11, color: '#475569', width: 52, textAlign: 'right'}}>{d.pts}pts · {d.wips}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid g-2">
        <div className="card">
          <h3>Items by status</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
            {[
              { s: 'sprint',   label: 'Sprint Planned', n: byStatus.sprint   || 0 },
              { s: 'progress', label: 'In Progress',    n: byStatus.progress || 0 },
              { s: 'review',   label: 'In Review',      n: byStatus.review   || 0 },
              { s: 'qa',       label: 'QA',             n: byStatus.qa       || 0 },
            ].map(b => (
              <div key={b.s} style={{padding: '10px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6}}>
                <div style={{fontSize: 22, fontWeight: 600, color: '#0F172A'}}>{b.n}</div>
                <StatusChip status={b.s} />
                <div style={{fontSize: 10.5, color: '#64748B', marginTop: 3}}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Alerts <span className="pill hot">3</span></h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {conflicts.map((c, i) => (
              <div key={i} className="conflict">
                <div className="ch"><Icon name="warn" size={13} color="#78350F" /> Sprint conflict</div>
                <div className="cb">{c.text}. Recommended: serialize or split Lead-object changes.</div>
              </div>
            ))}
            {mandatoryMissing.map((m, i) => (
              <div key={i} style={{padding: '8px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 12}}>
                <div style={{fontWeight: 600, color: '#991B1B', marginBottom: 2}}><span className="mono" style={{fontSize: 11}}>{m.id}</span> · missing fields</div>
                <div style={{color: '#7F1D1D'}}>{m.missing.join(' · ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Roadmap Dashboard ----------------
function RoadmapDashboard({ onTab }) {
  const D = window.DATA;
  const phases = [
    { id: 'Discovery', done: 'done' },
    { id: 'Design',    done: 'done' },
    { id: 'Build',     done: 'current' },
    { id: 'Test',      done: 'upcoming' },
    { id: 'Deploy',    done: 'upcoming' },
  ];
  const statusFor = (epic, phase) => {
    if (epic.readiness >= 90 && phase === 'Discovery') return 'done';
    if (epic.readiness >= 90 && phase === 'Design')    return 'done';
    if (epic.readiness >= 70 && phase === 'Discovery') return 'done';
    if (epic.readiness >= 70 && phase === 'Design')    return epic.id === 'LM-LA' ? 'done' : 'current';
    if (epic.readiness >= 50 && phase === 'Discovery') return 'done';
    if (epic.readiness >= 50 && phase === 'Design')    return 'current';
    if (phase === 'Discovery') return 'current';
    return 'upcoming';
  };
  const cellStyle = (s) => ({
    padding: '6px 8px',
    background: s === 'done' ? '#DCFCE7' : s === 'current' ? '#EEF2FF' : s === 'skipped' ? '#F1F5F9' : 'white',
    color:      s === 'done' ? '#166534' : s === 'current' ? '#3730A3' : s === 'skipped' ? '#94A3B8' : '#94A3B8',
    border: '1px solid #E2E8F0',
    borderRadius: 4, fontSize: 10.5, fontWeight: 500, textAlign: 'center',
  });
  const milestones = [
    { name: 'M1 · Lead Mgmt ready for UAT',  date: 'Apr 28', progress: 78, blocks: 1 },
    { name: 'M2 · Opportunity flow live',     date: 'May 19', progress: 52, blocks: 2 },
    { name: 'M3 · Quoting Phase 3 sign-off',  date: 'Jun 12', progress: 18, blocks: 4, risk: true },
    { name: 'M4 · Reporting & hand-off',      date: 'Jul 03', progress: 6,  blocks: 0 },
  ];
  return (
    <div className="col">
      <div className="card">
        <h3>Epic × phase grid</h3>
        <div style={{display: 'grid', gridTemplateColumns: '200px repeat(5, 1fr)', gap: 6}}>
          <div></div>
          {phases.map(p => (
            <div key={p.id} style={{padding: '4px 6px', fontSize: 10.5, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center'}}>{p.id}</div>
          ))}
          {D.epics.map(e => (
            <React.Fragment key={e.id}>
              <div style={{padding: '6px 8px', fontSize: 12}}>
                <div style={{fontWeight: 500, color: '#0F172A'}}>{e.name}</div>
                <div style={{fontSize: 10.5, color: '#64748B'}} className="mono">{e.id} · {e.phase}</div>
              </div>
              {phases.map(p => {
                const s = statusFor(e, p.id);
                return <div key={p.id} style={cellStyle(s)}>{s === 'done' ? '✓ done' : s === 'current' ? 'in progress' : '—'}</div>;
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Milestones</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
          <div style={{display: 'grid', gridTemplateColumns: '2fr 80px 1fr 80px 80px', gap: 12, padding: '4px 8px', fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>
            <div>Milestone</div><div>Target</div><div>Progress</div><div>Blocks</div><div>State</div>
          </div>
          {milestones.map((m, i) => (
            <div key={i} style={{display: 'grid', gridTemplateColumns: '2fr 80px 1fr 80px 80px', gap: 12, padding: '9px 8px', borderTop: '1px solid #F1F5F9', alignItems: 'center', fontSize: 12}}>
              <div>
                <div style={{fontWeight: 500, color: '#0F172A'}}>{m.name}</div>
                {m.risk && <Chip tone="red" className="">reprop pending</Chip>}
              </div>
              <div className="mono small">{m.date}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                <div style={{flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3}}>
                  <div style={{width: `${m.progress}%`, height: '100%', background: m.progress >= 70 ? '#16A34A' : m.progress >= 40 ? '#F59E0B' : '#94A3B8', borderRadius: 3}}></div>
                </div>
                <span className="mono small" style={{width: 32, textAlign: 'right'}}>{m.progress}%</span>
              </div>
              <div>{m.blocks > 0 ? <span style={{color: '#B91C1C', fontWeight: 500}}>{m.blocks}</span> : <span className="muted">—</span>}</div>
              <div><Chip tone={m.progress >= 70 ? 'green' : m.progress >= 40 ? 'amber' : 'gray'}>{m.progress >= 70 ? 'on track' : m.progress >= 40 ? 'at risk' : 'upcoming'}</Chip></div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g-2">
        <div className="ai-card">
          <div className="ai-head"><div className="sparkle"><Icon name="sparkle" size={11} color="white" /></div>WHAT MUST HAPPEN</div>
          <p style={{fontSize: 12.5}}>
            To hit <b>M1 Apr 28</b>, QA needs to close DEF-011 on WI-LM-LA-04 (2 pts), and WI-LM-LC-01 must un-block by getting Q-LM-LC-003 answered.
            For <b>M3 Jun 12</b>, the P3 re-proposal must be accepted or rejected this week — every day of delay pushes the milestone by ~1 day.
          </p>
          <div className="ai-foot"><Icon name="sparkle" size={11} /> Synthesized from blocking questions + linked stories</div>
        </div>

        <div className="card">
          <h3>Dependency chains</h3>
          <div style={{fontSize: 12, color: '#334155', lineHeight: 1.8}}>
            <div><span className="mono">WI-LM-LA-04</span> → <span className="mono">WI-LM-LA-05</span> → <Chip tone="violet">M1</Chip></div>
            <div><span className="mono">WI-OPP-MG-01</span> → <span className="mono">WI-OPP-ST-01</span> → <Chip tone="violet">M2</Chip></div>
            <div><span className="mono">WI-CPQ-IM-01</span> → <span className="mono">WI-CPQ-PR-01</span> → <span className="mono">WI-QT-TG-02</span> → <Chip tone="violet">M3</Chip></div>
            <div style={{marginTop: 8, fontSize: 11, color: '#64748B'}}>Computed from overlapping impacted components and explicit deps.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- QA Dashboard ----------------
function QADashboard({ onOpenWi }) {
  const coverage = 78;
  const byResult = { pass: 124, fail: 11, blocked: 3, pending: 42 };
  const defects = [
    { id: 'DEF-011', sev: 'High',   title: 'Audit trail missing reassignment events',     wi: 'WI-LM-LA-04', state: 'Open',     age: 2 },
    { id: 'DEF-008', sev: 'Medium', title: 'Manager override UI shifts on long names',    wi: 'WI-LM-LA-02', state: 'Assigned', age: 4 },
    { id: 'DEF-005', sev: 'Low',    title: 'CSV import rejects UTF-8 BOM',                wi: 'WI-LM-LC-02', state: 'Fixed',    age: 1 },
    { id: 'DEF-003', sev: 'Medium', title: 'Round-robin skips inactive reps incorrectly', wi: 'WI-LM-LA-01', state: 'Verified', age: 0 },
  ];
  return (
    <div className="col">
      <div className="grid g-4">
        <div className="kpi">
          <div className="label">Coverage</div>
          <div className="value">{coverage}%</div>
          <div className="sub">stories with all tests passed</div>
        </div>
        <div className="kpi">
          <div className="label">Tests executed</div>
          <div className="value">{byResult.pass + byResult.fail + byResult.blocked}<span style={{color:'#94A3B8', fontSize:13, marginLeft:4}}>/{byResult.pass + byResult.fail + byResult.blocked + byResult.pending}</span></div>
          <div className="sub">{byResult.pending} pending</div>
        </div>
        <div className="kpi">
          <div className="label">Open defects</div>
          <div className="value" style={{color: '#B91C1C'}}>{defects.filter(d => d.state !== 'Verified' && d.state !== 'Closed').length}</div>
          <div className="sub">1 High · 1 Medium · 1 Low</div>
        </div>
        <div className="kpi">
          <div className="label">Stories missing tests</div>
          <div className="value" style={{color: '#D97706'}}>4</div>
          <div className="sub">Draft items without test cases</div>
        </div>
      </div>

      <div className="grid g-2to1">
        <div className="card">
          <h3>Test execution</h3>
          <div style={{display: 'flex', height: 18, borderRadius: 4, overflow: 'hidden', marginBottom: 12}}>
            <div style={{flex: byResult.pass,    background: '#16A34A'}} title={`Pass ${byResult.pass}`}></div>
            <div style={{flex: byResult.fail,    background: '#EF4444'}} title={`Fail ${byResult.fail}`}></div>
            <div style={{flex: byResult.blocked, background: '#F59E0B'}} title={`Blocked ${byResult.blocked}`}></div>
            <div style={{flex: byResult.pending, background: '#E2E8F0'}} title={`Pending ${byResult.pending}`}></div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 11.5}}>
            {[
              { l: 'Pass',    n: byResult.pass,    c: '#16A34A' },
              { l: 'Fail',    n: byResult.fail,    c: '#EF4444' },
              { l: 'Blocked', n: byResult.blocked, c: '#F59E0B' },
              { l: 'Pending', n: byResult.pending, c: '#94A3B8' },
            ].map(r => (
              <div key={r.l}>
                <div style={{display:'flex', alignItems:'center', gap:5}}><i style={{width: 8, height: 8, background: r.c, borderRadius: 50, display:'inline-block'}}></i><span style={{color:'#64748B'}}>{r.l}</span></div>
                <div style={{fontSize: 18, fontWeight: 600, color: '#0F172A', marginTop: 2}}>{r.n}</div>
              </div>
            ))}
          </div>

          <div style={{marginTop: 16, paddingTop: 12, borderTop: '1px solid #F1F5F9'}}>
            <div style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', fontWeight: 600, marginBottom: 8}}>Per sprint</div>
            {[
              { s: 'Sprint 1', pass: 92, total: 92 },
              { s: 'Sprint 2', pass: 88, total: 94 },
              { s: 'Sprint 3', pass: 44, total: 86 },
            ].map(s => (
              <div key={s.s} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', fontSize: 12}}>
                <span style={{width: 80, color: '#475569'}}>{s.s}</span>
                <div style={{flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden'}}>
                  <div style={{width: `${(s.pass/s.total)*100}%`, height: '100%', background: '#16A34A'}}></div>
                </div>
                <span className="mono small" style={{width: 60, textAlign: 'right'}}>{s.pass}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Defect trend · 14 days</h3>
          <DefectTrendChart />
          <div style={{fontSize: 11, color: '#64748B', marginTop: 8, lineHeight: 1.5}}>
            Opens peaked Apr 15 after round-robin rule test run. Fix rate catching up; <b>MTTR 2.1d</b>.
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Defects <span className="pill">{defects.length}</span></h3>
        <table className="tbl">
          <thead><tr>
            <th style={{width: 90}}>ID</th>
            <th>Defect</th>
            <th style={{width: 110}}>Work item</th>
            <th style={{width: 90}}>Severity</th>
            <th style={{width: 100}}>State</th>
            <th style={{width: 60}}>Age</th>
          </tr></thead>
          <tbody>
            {defects.map(d => (
              <tr key={d.id} onClick={() => onOpenWi && onOpenWi(d.wi)}>
                <td className="id mono">{d.id}</td>
                <td className="title-cell">{d.title}</td>
                <td className="mono small">{d.wi}</td>
                <td><Chip tone={d.sev === 'High' ? 'red' : d.sev === 'Medium' ? 'amber' : 'gray'}>{d.sev}</Chip></td>
                <td><Chip tone={d.state === 'Open' ? 'red' : d.state === 'Assigned' ? 'amber' : d.state === 'Fixed' ? 'blue' : d.state === 'Verified' ? 'green' : 'gray'}>{d.state}</Chip></td>
                <td className="small muted">{d.age}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DefectTrendChart() {
  const opens = [1, 0, 2, 1, 3, 1, 2, 1, 0, 1, 2, 0, 1, 0];
  const fixes = [0, 1, 0, 1, 1, 2, 1, 2, 1, 1, 1, 1, 2, 1];
  const w = 320, h = 120, pad = 14;
  const max = 4;
  const step = (w - pad*2) / (opens.length - 1);
  const pts = (arr) => arr.map((v, i) => `${pad + i*step},${h - (v/max)*(h-pad*2) - pad}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width: '100%', height: 140}}>
      {[0, 1, 2, 3, 4].map(v => <line key={v} x1={pad} x2={w-pad} y1={h - (v/max)*(h-pad*2) - pad} y2={h - (v/max)*(h-pad*2) - pad} stroke="#F1F5F9" />)}
      <polyline fill="none" stroke="#EF4444" strokeWidth="1.8" points={pts(opens)} />
      <polyline fill="none" stroke="#16A34A" strokeWidth="1.8" points={pts(fixes)} />
      {opens.map((v, i) => <circle key={i} cx={pad + i*step} cy={h - (v/max)*(h-pad*2) - pad} r="2.5" fill="#EF4444" />)}
      {fixes.map((v, i) => <circle key={i} cx={pad + i*step} cy={h - (v/max)*(h-pad*2) - pad} r="2.5" fill="#16A34A" />)}
      <text x={pad} y={h-2} fontSize="8.5" fill="#94A3B8" fontFamily="Inter">Apr 11</text>
      <text x={w-pad-20} y={h-2} fontSize="8.5" fill="#94A3B8" fontFamily="Inter">Today</text>
    </svg>
  );
}

// ---------------- Usage & Costs ----------------
function UsageDashboard({ range }) {
  const tokensIn  = 2_840_000;
  const tokensOut =   612_000;
  const cost = (tokensIn / 1000) * 0.003 + (tokensOut / 1000) * 0.015;
  const byTask = [
    { t: 'Transcript processing', tok: 1_180_000, pct: 34, cost: 4.45 },
    { t: 'Story generation',       tok:   720_000, pct: 21, cost: 2.72 },
    { t: 'Briefing synthesis',     tok:   480_000, pct: 14, cost: 1.82 },
    { t: 'Org knowledge refresh',  tok:   420_000, pct: 12, cost: 1.58 },
    { t: 'Impact analysis',        tok:   280_000, pct:  8, cost: 1.05 },
    { t: 'Document generation',    tok:   192_000, pct:  6, cost: 0.72 },
    { t: 'Other',                  tok:   180_000, pct:  5, cost: 0.68 },
  ];
  const byUser = [
    { who: 'priya',  tok: 1_120_000, cost: 4.21 },
    { who: 'sarah',  tok:   880_000, cost: 3.34 },
    { who: 'david',  tok:   740_000, cost: 2.78 },
    { who: 'jamie',  tok:   480_000, cost: 1.82 },
    { who: 'marcus', tok:   232_000, cost: 0.86 },
  ];
  return (
    <div className="col">
      <div style={{padding: '10px 12px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 12, color: '#1E40AF', marginBottom: 4}}>
        <Icon name="shield" size={12} /> &nbsp;Visible to Solution Architects, PMs, and Firm Admins only. Individual consumption shown in aggregate; users cannot see each other's detail.
      </div>

      <div className="grid g-4">
        <div className="kpi">
          <div className="label">Total tokens · {range === '30d' ? 'last 30d' : range === '7d' ? 'last 7d' : 'sprint'}</div>
          <div className="value">{(tokensIn/1_000_000).toFixed(2)}M<span style={{color:'#94A3B8', fontSize:12, marginLeft:6}}>in</span></div>
          <div className="sub">{(tokensOut/1000).toFixed(0)}K out · haiku-4.5 default</div>
        </div>
        <div className="kpi">
          <div className="label">Estimated cost</div>
          <div className="value">${cost.toFixed(2)}</div>
          <div className="sub">Within soft cap ($40/mo)</div>
        </div>
        <div className="kpi">
          <div className="label">AI sessions</div>
          <div className="value">312</div>
          <div className="sub">218 chat · 94 background</div>
        </div>
        <div className="kpi">
          <div className="label">Inngest events</div>
          <div className="value">4,820</div>
          <div className="sub">of 5,000 free tier · {(4820/5000*100).toFixed(0)}%</div>
          <div className="progress" style={{marginTop: 4}}><div className="fill" style={{width: '96%', background: '#F59E0B'}}></div></div>
        </div>
      </div>

      <div className="grid g-2">
        <div className="card">
          <h3>Daily tokens · trend</h3>
          <UsageTrend />
          <div style={{fontSize: 11, color: '#64748B', marginTop: 6}}>Spike on Apr 16 from bulk transcript reprocessing.</div>
        </div>
        <div className="card">
          <h3>By task type</h3>
          <table className="tbl" style={{fontSize: 11.5}}>
            <thead><tr><th>Task</th><th style={{width: 80, textAlign: 'right'}}>Tokens</th><th style={{width: 50, textAlign: 'right'}}>%</th><th style={{width: 60, textAlign: 'right'}}>Cost</th></tr></thead>
            <tbody>
              {byTask.map(r => (
                <tr key={r.t}>
                  <td>{r.t}</td>
                  <td className="mono" style={{textAlign: 'right'}}>{(r.tok/1000).toFixed(0)}K</td>
                  <td style={{textAlign: 'right'}}>
                    <div style={{display: 'inline-flex', alignItems: 'center', gap: 6}}>
                      <div style={{width: 34, height: 4, background: '#F1F5F9', borderRadius: 2}}>
                        <div style={{width: `${r.pct*2.2}%`, height: '100%', background: '#4F46E5', borderRadius: 2}}></div>
                      </div>
                      <span className="mono small" style={{width: 24}}>{r.pct}%</span>
                    </div>
                  </td>
                  <td className="mono" style={{textAlign: 'right'}}>${r.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>By team member</h3>
        <table className="tbl" style={{fontSize: 11.5}}>
          <thead><tr><th>Member</th><th>Role</th><th style={{width: 100, textAlign: 'right'}}>Tokens</th><th style={{width: 120}}>Share</th><th style={{width: 80, textAlign: 'right'}}>Cost</th><th style={{width: 100, textAlign: 'right'}}>Top task</th></tr></thead>
          <tbody>
            {byUser.map(u => {
              const who = window.DATA.team.find(p => p.id === u.who);
              const pct = (u.tok / tokensIn) * 100;
              return (
                <tr key={u.who}>
                  <td style={{display: 'flex', alignItems: 'center', gap: 8}}><Avatar person={u.who} size="xs" />{who.name}</td>
                  <td className="muted small">{who.role}</td>
                  <td className="mono" style={{textAlign: 'right'}}>{(u.tok/1000).toFixed(0)}K</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                      <div style={{flex: 1, height: 5, background: '#F1F5F9', borderRadius: 2}}>
                        <div style={{width: `${pct}%`, height: '100%', background: '#4F46E5', borderRadius: 2}}></div>
                      </div>
                      <span className="mono small" style={{width: 34, textAlign: 'right'}}>{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="mono" style={{textAlign: 'right'}}>${u.cost.toFixed(2)}</td>
                  <td className="small muted" style={{textAlign: 'right'}}>{u.who === 'priya' ? 'Transcript' : u.who === 'sarah' ? 'Briefings' : u.who === 'david' ? 'Context pkg' : u.who === 'jamie' ? 'Status gen' : 'Test gen'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsageTrend() {
  const data = [80, 120, 140, 90, 110, 160, 180, 150, 130, 240, 200, 170, 190, 210, 160, 140, 180, 150, 120, 140, 160, 130, 110, 150, 170, 140, 100, 130, 150, 110];
  const w = 420, h = 130, pad = 16;
  const max = 250;
  const step = (w - pad*2) / (data.length - 1);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width: '100%', height: 150}}>
      <defs>
        <linearGradient id="usageFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4F46E5" stopOpacity="0.22"/>
          <stop offset="1" stopColor="#4F46E5" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(p => <line key={p} x1={pad} x2={w-pad} y1={h - p*(h - pad*2) - pad} y2={h - p*(h - pad*2) - pad} stroke="#F1F5F9" />)}
      <polyline fill="url(#usageFill)" stroke="none"
        points={`${pad},${h-pad} ${data.map((v, i) => `${pad + i*step},${h - (v/max)*(h-pad*2) - pad}`).join(' ')} ${pad + (data.length-1)*step},${h-pad}`} />
      <polyline fill="none" stroke="#4F46E5" strokeWidth="1.6"
        points={data.map((v, i) => `${pad + i*step},${h - (v/max)*(h-pad*2) - pad}`).join(' ')} />
      <text x={pad} y={h-2} fontSize="9" fill="#94A3B8" fontFamily="Inter">Mar 25</text>
      <text x={w-pad-30} y={h-2} fontSize="9" fill="#94A3B8" fontFamily="Inter">Today</text>
    </svg>
  );
}

// ---------------- Health score ----------------
function HealthDashboard({ onOpenWi }) {
  const signals = [
    { kind: 'Stale open question',       count: 2, thresh: '> 7 days',  examples: ['Q-CPQ-003 · 11 days', 'Q-OPP-002 · 9 days'], impact: 'yellow' },
    { kind: 'Client Qs past follow-up',  count: 2, thresh: '> 3 days',  examples: ['Q-LM-LC-003 · 5 days', 'Q-OPP-001 · 4 days'], impact: 'yellow' },
    { kind: 'Blocked items',             count: 1, thresh: '> 5 days',  examples: ['WI-LM-LC-01 · 6 days'], impact: 'yellow' },
    { kind: 'High-severity risks w/o plan', count: 0, thresh: 'any open', examples: [], impact: 'ok' },
  ];
  return (
    <div className="col">
      <div className="grid g-3">
        <div style={{gridColumn: 'span 1', padding: 20, background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: '1px solid #FCD34D', borderRadius: 10}}>
          <div style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: '#92400E'}}>Current score</div>
          <div style={{fontSize: 38, fontWeight: 700, color: '#78350F', marginTop: 6, letterSpacing: '-0.02em'}}>Yellow</div>
          <div style={{fontSize: 12, color: '#92400E', marginTop: 2}}>3 active signals · thresholds per PRD §17.6</div>
          <div style={{marginTop: 14, paddingTop: 12, borderTop: '1px dashed #FCD34D', fontSize: 11.5, color: '#78350F'}}>
            Drop below 4 signals to stay Yellow. One more signal → <b>Red</b>.
          </div>
        </div>

        <div className="card" style={{gridColumn: 'span 2'}}>
          <h3>Score history · 30 days</h3>
          <HealthHistoryChart />
          <div style={{fontSize: 11, color: '#64748B', marginTop: 6}}>Flipped to Yellow on Apr 12 after Q-LM-LC-003 crossed the client follow-up threshold.</div>
        </div>
      </div>

      <div className="card">
        <h3>Signals driving score</h3>
        {signals.map((s, i) => (
          <div key={i} style={{display: 'grid', gridTemplateColumns: '20px 1fr auto auto', gap: 12, padding: '10px 4px', borderBottom: i < signals.length - 1 ? '1px solid #F1F5F9' : 'none', alignItems: 'center'}}>
            <div style={{width: 12, height: 12, borderRadius: 50, background: s.count === 0 ? '#16A34A' : s.impact === 'yellow' ? '#F59E0B' : '#EF4444'}}></div>
            <div>
              <div style={{fontSize: 12.5, fontWeight: 500, color: '#0F172A'}}>{s.kind}</div>
              <div style={{fontSize: 11, color: '#64748B', marginTop: 2}}>Threshold {s.thresh} · {s.examples.length ? s.examples.join(' · ') : 'none active'}</div>
            </div>
            <div style={{fontSize: 18, fontWeight: 600, color: s.count === 0 ? '#16A34A' : '#D97706', minWidth: 30, textAlign: 'right'}}>{s.count}</div>
            <button className="btn sm">Configure</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthHistoryChart() {
  // Band chart: Green=0, Yellow=1, Red=2
  const d = [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
  const w = 560, h = 100, pad = 14;
  const step = (w - pad*2) / (d.length - 1);
  const y = (v) => pad + (2 - v) / 2 * (h - pad*2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width: '100%', height: 110}}>
      <rect x={pad} y={pad}             width={w-pad*2} height={(h-pad*2)/3} fill="#FEE2E2" opacity="0.35"/>
      <rect x={pad} y={pad + (h-pad*2)/3} width={w-pad*2} height={(h-pad*2)/3} fill="#FEF3C7" opacity="0.45"/>
      <rect x={pad} y={pad + 2*(h-pad*2)/3} width={w-pad*2} height={(h-pad*2)/3} fill="#DCFCE7" opacity="0.4"/>
      <polyline fill="none" stroke="#0F172A" strokeWidth="1.8" points={d.map((v,i) => `${pad + i*step},${y(v)}`).join(' ')} />
      {d.map((v,i) => <circle key={i} cx={pad + i*step} cy={y(v)} r="1.8" fill="#0F172A" />)}
      <text x={w - pad} y={y(2) + 3} fontSize="9" fill="#16A34A" textAnchor="end" fontFamily="Inter">Green</text>
      <text x={w - pad} y={y(1) + 3} fontSize="9" fill="#D97706" textAnchor="end" fontFamily="Inter">Yellow</text>
      <text x={w - pad} y={y(0) + 3} fontSize="9" fill="#DC2626" textAnchor="end" fontFamily="Inter">Red</text>
    </svg>
  );
}

window.Dashboards = Dashboards;
