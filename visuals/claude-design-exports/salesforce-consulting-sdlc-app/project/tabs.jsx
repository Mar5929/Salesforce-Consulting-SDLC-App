// Other tabs: Discovery, Questions, Knowledge, Org
const { useState: useStateT } = React;

function Discovery({ onOpenQuestion }) {
  const D = window.DATA;
  const T = D.transcriptReview;
  return (
    <div className="content">
      <div className="grid g-4" style={{marginBottom: 14}}>
        <div className="kpi"><div className="label">Open questions</div><div className="value">4</div><div className="sub">2 client-owned</div></div>
        <div className="kpi"><div className="label">Requirements captured</div><div className="value">54</div><div className="sub">+6 this week</div></div>
        <div className="kpi"><div className="label">Transcripts processed</div><div className="value">12</div><div className="sub">Last: 2 min ago</div></div>
        <div className="kpi"><div className="label">Pending review</div><div className="value" style={{color: '#D97706'}}>6</div><div className="sub">from Apr 10 session</div></div>
      </div>

      <div className="grid g-2to1">
        {/* Main: Transcript review */}
        <div>
          <div className="sec-head"><h2>Transcript processing · review</h2>
            <div className="actions">
              <button className="btn"><Icon name="upload" size={12} /> Upload transcript</button>
              <button className="btn primary"><Icon name="plus" size={12} color="white" /> Start chat session</button>
            </div>
          </div>
          <div className="card" style={{marginBottom: 14}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10}}>
              <div style={{width: 36, height: 36, borderRadius: 8, background: '#EEF2FF', display: 'grid', placeItems: 'center'}}><Icon name="file" size={16} color="#4F46E5" /></div>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 600, fontSize: 13}}>{T.meeting}</div>
                <div style={{fontSize: 11.5, color: '#64748B'}}>{T.date} · {T.duration} · {T.attendees.join(', ')}</div>
              </div>
              <Chip tone="green">processed {T.processed}</Chip>
            </div>
            <div style={{display: 'flex', gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 6, fontSize: 12, marginBottom: 12}}>
              <span><b style={{color: '#16A34A'}}>{T.applied}</b> applied auto</span>
              <span style={{color: '#CBD5E1'}}>·</span>
              <span><b style={{color: '#D97706'}}>{T.review}</b> awaiting review</span>
              <span style={{marginLeft: 'auto', color: '#94A3B8'}}>High conf ≥ 0.85 → auto-apply · below → review</span>
            </div>
            <div style={{fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8}}>Needs review · {T.review} items</div>
            {T.items.filter(i => i.action === 'review').map((it, i) => (
              <div key={i} className="t-item" style={{marginBottom: 6}}>
                <div>
                  <div className="ic">
                    <Chip tone={it.kind === 'question' ? 'amber' : it.kind === 'requirement' ? 'sky' : it.kind === 'scope' ? 'violet' : 'slate'}>{it.kind}</Chip>
                    {' '}{it.text}
                  </div>
                  <div className="imeta">
                    <span className={`conf ${it.conf}`}>{it.conf === 'hi' ? '92%' : it.conf === 'md' ? '74%' : '58%'}</span>
                    <span>→ {it.applyTo}</span>
                  </div>
                </div>
                <div className="t-actions">
                  <button className="btn sm"><Icon name="edit" size={11} /></button>
                  <button className="btn sm danger">Discard</button>
                  <button className="btn sm primary">Approve</button>
                </div>
              </div>
            ))}
            <div style={{fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '14px 0 8px'}}>Auto-applied · {T.applied - 11} more</div>
            {T.items.filter(i => i.action === 'applied').map((it, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#F0FDF4', borderRadius: 6, marginBottom: 4, fontSize: 12}}>
                <Icon name="check" size={12} color="#16A34A" />
                <Chip tone={it.kind === 'decision' ? 'indigo' : it.kind === 'risk' ? 'red' : 'slate'}>{it.kind}</Chip>
                <span style={{flex:1, color: '#334155'}}>{it.text}</span>
                <span className="conf hi">92%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: intelligence */}
        <div className="col">
          <div className="ai-card">
            <div className="ai-head"><div className="sparkle"><Icon name="sparkle" size={11} color="white"/></div>AI INTELLIGENCE</div>
            <div style={{fontSize: 12.5, color: '#1E1B4B', lineHeight: 1.55}}>
              CPQ scope emerging from Apr 10 workshop. 2 requirements contradict prior v3 roadmap on quoting. Re-proposal fired — review in Work tab.
            </div>
          </div>

          <div className="card">
            <h3>Gap detection per epic</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}><Chip tone="red">high gap</Chip><span style={{flex:1}}>R-CU Custom Analytics</span><span className="muted small">2Q</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}><Chip tone="amber">medium</Chip><span style={{flex:1}}>OPP-MG Opportunity</span><span className="muted small">1Q</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}><Chip tone="amber">medium</Chip><span style={{flex:1}}>LM-LC Lead Capture</span><span className="muted small">1Q</span></div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}><Chip tone="green">ready</Chip><span style={{flex:1}}>LM-LA Lead Assignment</span></div>
            </div>
          </div>

          <div className="card">
            <h3>Follow-up recommendations</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12}}>
              {D.recommendedFocus.slice(1, 4).map(r => (
                <div key={r.rank} style={{cursor: 'pointer'}} onClick={() => onOpenQuestion(r.qid)}>
                  <div style={{fontWeight: 500, color: '#0F172A'}}>{r.text}</div>
                  <div className="muted small" style={{marginTop: 2}}>{r.reason}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Conflict detection</h3>
            <div className="conflict">
              <div className="ch"><Icon name="warn" size={13} color="#78350F" /> Quote engine contradiction</div>
              <div className="cb">WI-QT-TG-02 references "native template engine" but Q-P3-001 (answered Apr 16) specifies CPQ.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Questions({ onOpenQuestion }) {
  const D = window.DATA;
  const [filter, setFilter] = useStateT('open');
  const list = D.questions.filter(q =>
    filter === 'all' ? true :
    filter === 'open' ? q.state === 'open' :
    filter === 'answered' ? q.state === 'answered' :
    q.state === 'parked'
  );
  return (
    <div className="content">
      <div className="toolbar">
        <div className="seg">
          <div className={`seg-btn ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')}>Open · 4</div>
          <div className={`seg-btn ${filter === 'answered' ? 'active' : ''}`} onClick={() => setFilter('answered')}>Answered · 2</div>
          <div className={`seg-btn ${filter === 'parked' ? 'active' : ''}`} onClick={() => setFilter('parked')}>Parked · 1</div>
          <div className={`seg-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</div>
        </div>
        <div className="filter"><span className="k">Scope</span><span className="v">Any</span><Icon name="chevronDown" size={11} /></div>
        <div className="filter"><span className="k">Owner</span><span className="v">Anyone</span><Icon name="chevronDown" size={11} /></div>
        <div className="filter"><span className="k">Blocks</span><span className="v">Any</span><Icon name="chevronDown" size={11} /></div>
        <div className="spacer" />
        <button className="btn primary"><Icon name="plus" size={12} color="white" /> New question</button>
      </div>

      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr>
            <th style={{width: 110}}>ID</th>
            <th>Question</th>
            <th style={{width: 140}}>Scope</th>
            <th style={{width: 150}}>Owner</th>
            <th style={{width: 100}}>State</th>
            <th style={{width: 90}}>Asked</th>
            <th style={{width: 90}}>Blocks</th>
          </tr></thead>
          <tbody>
            {list.map(q => (
              <tr key={q.id} onClick={() => onOpenQuestion(q.id)}>
                <td className="id mono">{q.id}</td>
                <td className="title-cell">{q.text}</td>
                <td><Chip tone={q.scope.startsWith('Engagement') ? 'violet' : q.scope.startsWith('Phase') ? 'indigo' : q.scope.startsWith('Epic') ? 'sky' : 'teal'}>{q.scope}</Chip></td>
                <td>{q.ownerType === 'client' ? <><Avatar person="client" size="xs" /> <span style={{marginLeft: 4}}>{q.owner}</span></> : q.owner}</td>
                <td><Chip tone={q.state === 'open' ? 'amber' : q.state === 'answered' ? 'green' : 'gray'}>{q.state}</Chip></td>
                <td className="mono small">{q.askedDate.slice(5)}</td>
                <td>{q.blocks > 0 ? <span style={{color: '#B91C1C', fontWeight: 500}}>{q.blocks}</span> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Knowledge() {
  const D = window.DATA;
  return (
    <div className="content">
      <div className="grid g-4" style={{marginBottom: 14}}>
        <div className="knw-card"><div style={{fontSize: 10.5, color: '#64748B', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight: 600, marginBottom: 8}}>Decisions</div><div style={{fontSize: 22, fontWeight: 600}}>12</div><div className="muted small">+2 this week</div></div>
        <div className="knw-card"><div style={{fontSize: 10.5, color: '#64748B', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight: 600, marginBottom: 8}}>Requirements</div><div style={{fontSize: 22, fontWeight: 600}}>54</div><div className="muted small">47 mapped · 7 unmapped</div></div>
        <div className="knw-card"><div style={{fontSize: 10.5, color: '#64748B', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight: 600, marginBottom: 8}}>Risks</div><div style={{fontSize: 22, fontWeight: 600}}>3</div><div className="muted small">1 High · 2 Medium</div></div>
        <div className="knw-card"><div style={{fontSize: 10.5, color: '#64748B', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight: 600, marginBottom: 8}}>Action items</div><div style={{fontSize: 22, fontWeight: 600}}>8</div><div className="muted small">3 overdue</div></div>
      </div>

      <div className="grid g-2">
        <div>
          <div className="sec-head"><h2>Client context</h2><div className="actions"><button className="btn sm"><Icon name="sparkle" size={11} /> Research & propose</button><button className="btn sm">Edit</button></div></div>
          <div className="card" style={{lineHeight: 1.65, fontSize: 13, color: '#334155'}}>
            <div style={{fontWeight: 600, color: '#0F172A', marginBottom: 8}}>Acme Manufacturing</div>
            <p style={{margin: '0 0 8px'}}>B2B industrial parts distributor. ~$500M annual revenue. Operates across US and Canada with separate legal entities. 240 sales reps across 12 territories. Migrating from a homegrown Access-based CRM originally built in 2008.</p>
            <p style={{margin: '0 0 8px'}}><b>Primary stakeholders:</b> Amanda Ross (CFO), Tom Nguyen (VP Sales), Kelly Park (IT Director), Raj Patel (Sales Ops Lead).</p>
            <p style={{margin: 0}}><b>Engagement goals:</b> unified Lead→Cash flow, eliminate Access dependency, territory-based assignment, CPQ-backed quoting for configurable bundles.</p>
          </div>
        </div>
        <div>
          <div className="sec-head"><h2>Recent decisions</h2><div className="actions"><button className="btn sm"><Icon name="plus" size={11} /> Record</button></div></div>
          <div className="card" style={{padding: 0}}>
            <table className="tbl">
              <tbody>
                {D.decisions.map(d => (
                  <tr key={d.id}>
                    <td className="id mono" style={{width: 90}}>{d.id}</td>
                    <td className="title-cell">{d.text}</td>
                    <td style={{width: 100}}><Avatar person="sarah" size="xs"/> <span style={{marginLeft: 4}}>Sarah</span></td>
                    <td className="mono small" style={{width: 90}}>{d.date.slice(5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid g-2" style={{marginTop: 14}}>
        <div>
          <div className="sec-head"><h2>Risks</h2><div className="actions"><button className="btn sm"><Icon name="plus" size={11}/> Create</button></div></div>
          <div className="card" style={{padding: 0}}>
            <table className="tbl">
              <thead><tr><th>ID</th><th>Risk</th><th>Severity</th><th>Owner</th><th>Status</th></tr></thead>
              <tbody>
                {D.risks.map(r => (
                  <tr key={r.id}>
                    <td className="id mono">{r.id}</td>
                    <td className="title-cell">{r.text}</td>
                    <td><Chip tone={r.sev === 'High' ? 'red' : r.sev === 'Medium' ? 'amber' : 'gray'}>{r.sev}</Chip></td>
                    <td><Avatar person={r.owner.includes('Priya') ? 'priya' : 'jamie'} size="xs" /> <span style={{marginLeft: 4}} className="small">{r.owner.split(' ')[0]}</span></td>
                    <td><Chip tone="gray">{r.status}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="sec-head"><h2>Requirements · unmapped</h2><div className="actions"><span className="muted small">7 of 54 unmapped</span></div></div>
          <div className="card" style={{padding: 0}}>
            <table className="tbl">
              <tbody>
                {[
                  { id: 'REQ-091', t: 'Branded quote PDFs per customer', pri: 'High' },
                  { id: 'REQ-092', t: 'Volume-tier pricing on configurable bundles', pri: 'High' },
                  { id: 'REQ-093', t: 'Quote expiration + renewal reminder', pri: 'Medium' },
                  { id: 'REQ-094', t: 'Canada-specific tax handling', pri: 'High' },
                  { id: 'REQ-095', t: 'Quote approval matrix by deal size', pri: 'Medium' },
                ].map(r => (
                  <tr key={r.id}>
                    <td className="id mono">{r.id}</td>
                    <td className="title-cell">{r.t}</td>
                    <td><Chip tone={r.pri === 'High' ? 'red' : 'amber'}>{r.pri}</Chip></td>
                    <td><Chip tone="gray">unmapped</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Org() {
  const D = window.DATA;
  const [sel, setSel] = useStateT('Lead');
  return (
    <div className="content">
      <div className="grid g-4" style={{marginBottom: 14}}>
        <div className="kpi"><div className="label">Sandbox</div><div className="value" style={{fontSize: 14, fontWeight: 500}}>acme-build · Partial Copy</div><div className="sub" style={{color: '#16A34A'}}>● Connected · last sync 14m ago</div></div>
        <div className="kpi"><div className="label">Components</div><div className="value">847</div><div className="sub">124 custom · 723 standard</div></div>
        <div className="kpi"><div className="label">Annotations</div><div className="value">34</div><div className="sub">21 human · 13 AI-derived</div></div>
        <div className="kpi"><div className="label">Domains</div><div className="value">2</div><div className="sub">1 confirmed · 1 proposed</div></div>
      </div>

      <div className="grid" style={{gridTemplateColumns: '1fr 420px', gap: 12}}>
        <div>
          <div className="toolbar">
            <div className="filter"><span className="k">Type</span><span className="v">All</span><Icon name="chevronDown" size={11} /></div>
            <div className="filter"><span className="k">Domain</span><span className="v">Any</span><Icon name="chevronDown" size={11} /></div>
            <div className="filter"><span className="k">Changed since</span><span className="v">Last sync</span><Icon name="chevronDown" size={11} /></div>
            <div className="spacer" />
            <button className="btn"><Icon name="refresh" size={11} /> Sync</button>
            <button className="btn"><Icon name="sparkle" size={11} /> Refresh KB</button>
          </div>
          <div className="card" style={{padding: 0}}>
            <table className="tbl">
              <thead><tr>
                <th>API name</th>
                <th>Type</th>
                <th>Ns</th>
                <th>Domains</th>
                <th>Ann.</th>
                <th>Last modified</th>
              </tr></thead>
              <tbody>
                {D.components.map(c => (
                  <tr key={c.apiName} className={sel === c.apiName ? 'selected' : ''} onClick={() => setSel(c.apiName)}>
                    <td>
                      <span className="mono" style={{fontWeight: 500, fontSize: 11.5}}>{c.apiName}</span>
                      {c.parent && <span className="muted small" style={{marginLeft: 6}}>on {c.parent}</span>}
                    </td>
                    <td><Chip tone={c.type === 'Object' ? 'indigo' : c.type === 'Field' ? 'sky' : c.type === 'Flow' ? 'teal' : c.type === 'Apex class' ? 'violet' : 'gray'}>{c.type}</Chip></td>
                    <td>{c.ns === 'custom' ? <Chip tone="amber">custom</Chip> : <Chip tone="gray">standard</Chip>}</td>
                    <td className="small">{c.domains.length ? c.domains.join(', ') : <span className="muted">—</span>}</td>
                    <td className="small">{c.annotations}</td>
                    <td className="mono small">{c.lastMod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sec-head" style={{marginTop: 20}}><h2>Domains</h2></div>
          <div className="grid g-2">
            <div className="knw-card">
              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}>
                <Icon name="database" size={14} color="#4F46E5" />
                <span style={{fontWeight: 600}}>Lead Management</span>
                <Chip tone="green">confirmed</Chip>
              </div>
              <div className="muted small">14 members · human-created</div>
              <div style={{marginTop: 8, fontSize: 11.5, color: '#475569'}}>Lead · 8 custom fields · LeadAssignmentHandler · Lead_Web_Form_Routing · Acme_Territory__c + 3 more</div>
            </div>
            <div className="knw-card" style={{borderColor: '#DDD6FE', background: '#FAFAFF'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6}}>
                <Icon name="sparkle" size={14} color="#7C3AED" />
                <span style={{fontWeight: 600}}>Opportunity Workflow</span>
                <Chip tone="violet">AI-proposed</Chip>
              </div>
              <div className="muted small">22 members · awaiting SA confirmation</div>
              <div style={{marginTop: 8, display: 'flex', gap: 6}}>
                <button className="btn sm primary">Confirm</button>
                <button className="btn sm">Edit</button>
                <button className="btn sm">Reject</button>
              </div>
            </div>
          </div>
        </div>

        {/* Component detail sidebar */}
        <div>
          <div className="card">
            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10}}>
              <Icon name="database" size={16} color="#4F46E5" />
              <div style={{fontWeight: 600, fontSize: 14}} className="mono">{sel}</div>
            </div>
            <dl className="dl" style={{fontSize: 12}}>
              <dt>Type</dt><dd>Standard Object</dd>
              <dt>Domains</dt><dd>Lead Management</dd>
              <dt>Custom fields</dt><dd>12</dd>
              <dt>Last sync</dt><dd className="mono small">2026-04-17 09:43</dd>
              <dt>Work items</dt><dd>7 items declare impact</dd>
            </dl>

            <div className="sec-head" style={{marginTop: 14}}><h2>1-hop graph</h2></div>
            <svg viewBox="0 0 360 200" style={{width: '100%', height: 200, background: '#F8FAFC', borderRadius: 6}}>
              <line x1="180" y1="100" x2="70"  y2="50"  stroke="#CBD5E1" strokeWidth="1.2"/>
              <line x1="180" y1="100" x2="290" y2="50"  stroke="#CBD5E1" strokeWidth="1.2"/>
              <line x1="180" y1="100" x2="70"  y2="150" stroke="#CBD5E1" strokeWidth="1.2"/>
              <line x1="180" y1="100" x2="290" y2="150" stroke="#CBD5E1" strokeWidth="1.2"/>
              <text x="125" y="45" fontSize="9" fill="#64748B" fontFamily="Inter">trigger</text>
              <text x="235" y="45" fontSize="9" fill="#64748B" fontFamily="Inter">lookup</text>
              <text x="115" y="145" fontSize="9" fill="#64748B" fontFamily="Inter">invokes</text>
              <text x="235" y="145" fontSize="9" fill="#64748B" fontFamily="Inter">flow-on</text>
              <rect x="130" y="80" width="100" height="40" rx="8" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2"/>
              <text x="180" y="105" fontSize="12" fill="#3730A3" textAnchor="middle" fontWeight="600" fontFamily="Inter">Lead</text>
              {[
                { x: 10, y: 30, t: 'LeadTrigger' },
                { x: 240, y: 30, t: 'Territory__c' },
                { x: 10, y: 130, t: 'LeadAssign...' },
                { x: 240, y: 130, t: 'Web_Form_Routing' },
              ].map((n, i) => (
                <g key={i}>
                  <rect x={n.x} y={n.y} width="110" height="40" rx="6" fill="white" stroke="#E2E8F0"/>
                  <text x={n.x + 55} y={n.y + 25} fontSize="10.5" fill="#0F172A" textAnchor="middle" fontFamily="JetBrains Mono">{n.t}</text>
                </g>
              ))}
            </svg>

            <div className="sec-head" style={{marginTop: 14}}><h2>Annotations · 2</h2><div className="actions"><button className="btn sm">+ Add</button></div></div>
            <div style={{fontSize: 12, padding: '8px 10px', background: '#FAFAFF', borderLeft: '3px solid #8B5CF6', borderRadius: 4, marginBottom: 6}}>
              <div style={{fontSize: 10.5, color: '#6D28D9', fontWeight: 600, marginBottom: 3}}>AI-DERIVED · 2026-04-12</div>
              Region__c is used as a territory proxy, not a geographic filter. Treat as categorical assignment key.
            </div>
            <div style={{fontSize: 12, padding: '8px 10px', background: '#F0F9FF', borderLeft: '3px solid #0EA5E9', borderRadius: 4}}>
              <div style={{fontSize: 10.5, color: '#075985', fontWeight: 600, marginBottom: 3}}>SARAH CHEN · 2026-04-05</div>
              Lead ownership transfers to Sales at conversion; Marketing releases ownership automatically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericTab({ label }) {
  return (
    <div className="content">
      <div className="card" style={{padding: 40, textAlign: 'center'}}>
        <div style={{fontSize: 14, fontWeight: 600, marginBottom: 6}}>{label}</div>
        <div className="muted small">Screen out of hero scope — wireframed only.<br/>Switch to Home, Discovery, Questions, Work, Knowledge, or Org to see the built flows.</div>
      </div>
    </div>
  );
}

Object.assign(window, { Discovery, Questions, Knowledge, Org, GenericTab });
