// Home tab (Project Briefing) — role-adaptive
const { useState: useStateH } = React;

function Home({ viewingAs, onOpenReprop, onOpenWi, onOpenQuestion, onTab, onNav }) {
  const nav = onNav || ((t, s) => onTab && onTab(t));
  const D = window.DATA;
  return (
    <div className="content">
      {/* Re-proposal banner — always visible for SA */}
      <div className="reprop-banner">
        <div className="ico"><Icon name="sparkle" size={16} color="white" /></div>
        <div style={{flex: 1}}>
          <div className="title">AI has proposed a roadmap change</div>
          <div className="sub">Phase 3 restructure triggered by Q-P3-001 answer · 13 work items affected · 1 in-flight build impacted · fired 08:14 today</div>
        </div>
        <button className="btn ghost" style={{color: '#92400E'}}>Dismiss</button>
        <button className="btn amber" onClick={onOpenReprop}>Review diff <Icon name="arrowRight" size={12} color="white" /></button>
      </div>

      {/* KPIs */}
      <div className="grid g-4" style={{marginBottom: 14}}>
        <div className="kpi">
          <div className="label">Open questions</div>
          <div className="value">4 <span className="delta down">+1</span></div>
          <div className="sub">2 client-owned · 1 blocks in-flight</div>
        </div>
        <div className="kpi">
          <div className="label">Blocked items</div>
          <div className="value">1 <span className="delta" style={{color:'#64748B'}}>·</span></div>
          <div className="sub">WI-LM-LC-01 · blocked by Q-LM-LC-003</div>
        </div>
        <div className="kpi">
          <div className="label">Roadmap progress</div>
          <div className="value">38%</div>
          <div className="progress" style={{marginTop: 8}}><div className="fill" style={{width: '38%'}}></div></div>
        </div>
        <div className="kpi">
          <div className="label">Requirements mapped</div>
          <div className="value">47<span style={{color:'#94A3B8', fontSize:14}}> /54</span></div>
          <div className="sub">87% · 7 unmapped in P3</div>
        </div>
      </div>

      {/* Current Focus + Recommended */}
      <div className="grid g-2to1" style={{marginBottom: 14}}>
        <div className="ai-card">
          <div className="ai-head">
            <div className="sparkle"><Icon name="sparkle" size={11} color="white" /></div>
            CURRENT FOCUS
            <span className="ts">{D.currentFocusTs}</span>
            <span className="icon-btn" style={{width: 22, height: 22, color: '#8B5CF6'}}><Icon name="refresh" size={12} /></span>
          </div>
          <p>
            Build is on track for <span className="bold">Sprint 3</span> — 60% burned with 4 days left.
            The <span className="tlink" onClick={onOpenReprop}>CPQ re-proposal</span> is the most consequential open item;
            Sarah hasn't yet reviewed the diff. Priya can unblock{' '}
            <span className="tlink" onClick={() => onOpenWi('WI-LM-LC-01')}>WI-LM-LC-01</span> this week by answering{' '}
            <span className="tlink" onClick={() => onOpenQuestion('Q-LM-LC-003')}>Q-LM-LC-003</span>.
          </p>
          <div className="ai-foot">
            <Icon name="sparkle" size={11} />
            Synthesized from roadmap state, sprint burn, and 4 open questions · claude-haiku-4.5
          </div>
        </div>

        <div className="card">
          <h3>Recommended focus <span className="pill hot">top 4</span></h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {D.recommendedFocus.map(r => (
              <div key={r.rank} style={{display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer'}}
                   onClick={() => r.qid.startsWith('Q-P3') ? onOpenReprop() : onOpenQuestion(r.qid)}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: r.rank === 1 ? '#4F46E5' : '#E0E7FF',
                  color: r.rank === 1 ? 'white' : '#4F46E5',
                  display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{r.rank}</div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 12.5, color: '#0F172A', fontWeight: 500, lineHeight: 1.35}}>{r.text}</div>
                  <div style={{fontSize: 11, color: '#64748B', marginTop: 3}}>{r.reason}</div>
                </div>
                <Avatar person={r.owner} size="xs" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role-adaptive widget band */}
      <RoleWidgets viewingAs={viewingAs} onOpenReprop={onOpenReprop} onOpenWi={onOpenWi} onOpenQuestion={onOpenQuestion} onTab={onTab} nav={nav} />

      {/* Activity */}
      <div className="grid g-2" style={{marginTop: 14}}>
        <div className="card">
          <h3>Recent activity · last 48h</h3>
          <div className="activity">
            {[
              { who: 'AI', what: 'fired roadmap re-proposal on P3 CPQ restructure', when: '08:14', a: 'a-michael', init: 'AI' },
              { who: 'Priya Patel', what: 'processed transcript: Acme Sales & IT Joint Session', when: 'Yesterday', a: 'a-priya', init: 'PP' },
              { who: 'Sarah Chen', what: 'answered Q-P3-001 · Salesforce CPQ', when: 'Apr 16', a: 'a-sarah', init: 'SC' },
              { who: 'David Kim', what: 'moved WI-LM-LA-01 to In Review', when: 'Apr 16', a: 'a-david', init: 'DK' },
              { who: 'Marcus Thompson', what: 'logged defect DEF-011 on WI-LM-LA-04', when: 'Apr 15', a: 'a-marcus', init: 'MT' },
            ].map((r, i) => (
              <div key={i} className="activity-row">
                <div className={`avatar xs ${r.a}`}>{r.init}</div>
                <div className="line">
                  <span className="who">{r.who}</span> <span className="what">{r.what}</span>
                  <span className="when">· {r.when}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card clickable-card" onClick={() => nav('work', 'roadmap')} style={{cursor: 'pointer'}}>
          <h3>Phase readiness <span className="pill" style={{cursor:'pointer'}}>Open roadmap →</span></h3>
          <div style={{display:'flex', flexDirection: 'column', gap: 10}}>
            {D.phases.map(p => (
              <div key={p.id} style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <div style={{width: 28, height: 22, borderRadius: 4, background: '#F1F5F9', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, color: '#475569'}}>{p.id}</div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 12.5, fontWeight: 500, color: '#0F172A'}}>
                    {p.name} {p.reprop && <Chip tone="amber" className="">re-proposal pending</Chip>}
                  </div>
                  <div style={{fontSize: 11, color: '#64748B'}}>{p.descriptor} · {p.duration}</div>
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

function RoleWidgets({ viewingAs, onOpenReprop, onOpenWi, onOpenQuestion, onTab, nav }) {
  const go = nav || ((t, s) => onTab && onTab(t));
  const D = window.DATA;
  const SectionLink = ({ to, sub, label }) => (
    <span className="pill" style={{cursor: 'pointer', color: '#4F46E5', background: '#EEF2FF'}} onClick={(e) => { e.stopPropagation(); go(to, sub); }}>{label || 'View all →'}</span>
  );
  const cardNav = (to, sub) => ({ style: { cursor: 'pointer' }, onClick: (e) => { if (e.target.closest('button, .btn, .tlink, [data-stop]')) return; go(to, sub); } });

  const widgets = {
    sarah: [
      {
        title: 'Pending AI proposals',
        pill: '2 pending',
        pillHot: true,
        cardNav: () => ({}),
        render: () => (
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{padding: '10px 12px', border: '1px solid #FCD34D', background: '#FFFBEB', borderRadius: 6, cursor: 'pointer'}} onClick={onOpenReprop}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <Icon name="warn" size={14} color="#D97706" />
                <div style={{fontWeight: 600, fontSize: 12.5}}>P3 CPQ restructure</div>
                <Chip tone="amber" className="">requires SA</Chip>
              </div>
              <div style={{fontSize: 11.5, color: '#92400E', marginTop: 4}}>13 work items · 1 in-flight build · fired 4h ago</div>
            </div>
            <div style={{padding: '10px 12px', border: '1px solid #DDD6FE', background: '#FAFAFF', borderRadius: 6, cursor: 'pointer'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <Icon name="database" size={14} color="#6D28D9" />
                <div style={{fontWeight: 600, fontSize: 12.5}}>Opportunity Workflow domain</div>
                <Chip tone="violet">AI-proposed</Chip>
              </div>
              <div style={{fontSize: 11.5, color: '#5B21B6', marginTop: 4}}>22 components clustered · awaiting SA confirm</div>
            </div>
          </div>
        )
      },
      {
        title: 'Epic readiness rollup',
        link: <SectionLink to="work" sub="roadmap" />,
        cardNav: () => cardNav('work', 'roadmap'),
        render: () => (
          <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
            {D.epics.slice(0, 5).map(e => (
              <div key={e.id} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 12}}>
                <span className="mono" style={{color: '#475569', fontSize: 10.5, width: 52}}>{e.id}</span>
                <span style={{flex: 1, color: '#0F172A'}}>{e.name}</span>
                {e.openQs > 0 && <span className="chip amber" style={{fontSize: 10.5}}>{e.openQs}Q</span>}
                <Readiness score={e.readiness} />
              </div>
            ))}
          </div>
        )
      },
      {
        title: 'Decisions awaiting my signoff',
        link: <SectionLink to="knowledge" label="Open Knowledge →" />,
        cardNav: () => cardNav('knowledge'),
        render: () => (
          <div style={{color: '#64748B', fontSize: 12.5, padding: '10px 0'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #F1F5F9'}}>
              <span className="mono" style={{fontSize: 10.5, color: '#475569'}}>D-?-DRAFT</span>
              <span style={{flex: 1, color: '#0F172A'}}>Migrate closed-lost opps only if client IT confirms format</span>
              <button className="btn sm">Review</button>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0'}}>
              <span className="mono" style={{fontSize: 10.5, color: '#475569'}}>D-?-DRAFT</span>
              <span style={{flex: 1, color: '#0F172A'}}>Adopt Acme 7-stage opportunity model globally</span>
              <button className="btn sm">Review</button>
            </div>
          </div>
        )
      },
    ],
    jamie: [
      {
        title: 'Sprint 3 burndown',
        link: <SectionLink to="work" sub="sprints" label="Open Sprints →" />,
        cardNav: () => cardNav('work', 'sprints'),
        render: () => <BurndownMini />
      },
      {
        title: 'Blockers',
        pill: '1 blocker',
        pillHot: true,
        link: <SectionLink to="work" sub="items" label="Open Work Items →" />,
        cardNav: () => cardNav('work', 'items'),
        render: () => (
          <div style={{padding: '8px 0', color: '#334155', fontSize: 12.5}}>
            <div><span className="mono" style={{fontSize:10.5}}>WI-LM-LC-01</span> blocked by <span className="tlink" data-stop onClick={(e) => { e.stopPropagation(); onOpenQuestion('Q-LM-LC-003'); }}>Q-LM-LC-003</span> · owner Priya</div>
          </div>
        )
      },
      {
        title: 'Admin tasks due this week',
        link: <SectionLink to="work" sub="admin" label="Open Admin Tasks →" />,
        cardNav: () => cardNav('work', 'admin'),
        render: () => (
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            {D.adminTasks.filter(t => t.status !== 'Done').slice(0, 3).map(t => (
              <div key={t.id} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 12}}>
                <Avatar person={t.owner} size="xs" />
                <span style={{flex: 1}}>{t.title}</span>
                <span className="muted small">{t.due.slice(5)}</span>
              </div>
            ))}
          </div>
        )
      },
    ],
    david: [
      {
        title: 'My work items',
        pill: '4 assigned',
        link: <SectionLink to="work" sub="items" label="Open Work Items →" />,
        cardNav: () => cardNav('work', 'items'),
        render: () => (
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            {D.workItems.filter(w => w.assignee === 'david').slice(0, 5).map(w => (
              <div key={w.id} style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, cursor: 'pointer'}} onClick={() => onOpenWi(w.id)}>
                <span className="mono" style={{fontSize: 10.5, color: '#475569', width: 100}}>{w.id}</span>
                <span style={{flex: 1, color: '#0F172A'}}>{w.title}</span>
                <StatusChip status={w.status} />
              </div>
            ))}
          </div>
        )
      },
      {
        title: 'Context-package readiness',
        link: <SectionLink to="work" sub="items" />,
        cardNav: () => cardNav('work', 'items'),
        render: () => (
          <div style={{fontSize: 12, color: '#334155', lineHeight: 1.6}}>
            <div style={{cursor:'pointer'}} data-stop onClick={(e) => { e.stopPropagation(); onOpenWi('WI-LM-LA-02'); }}>WI-LM-LA-02: <Chip tone="green">plan approved</Chip></div>
            <div style={{cursor:'pointer'}} data-stop onClick={(e) => { e.stopPropagation(); onOpenWi('WI-LM-LA-03'); }}>WI-LM-LA-03: <Chip tone="amber">needs solutioning</Chip></div>
            <div style={{cursor:'pointer'}} data-stop onClick={(e) => { e.stopPropagation(); onOpenWi('WI-LM-LC-04'); }}>WI-LM-LC-04: <Chip tone="red">plan stale · BR changed</Chip></div>
          </div>
        )
      },
      {
        title: 'Sprint conflicts touching me',
        link: <SectionLink to="work" sub="sprints" label="Open Sprints →" />,
        cardNav: () => cardNav('work', 'sprints'),
        render: () => (
          <div style={{fontSize: 12, color: '#92400E'}}>
            <div>WI-LM-LA-02 and WI-LM-LC-04 both modify Lead object — serialize?</div>
          </div>
        )
      },
    ],
    priya: [
      {
        title: 'Stories to write',
        pill: '7 in queue',
        link: <SectionLink to="work" sub="items" label="Open Work Items →" />,
        cardNav: () => cardNav('work', 'items'),
        render: () => (
          <div style={{display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12}}>
            {['WI-CPQ-IM-01 Bundle data model', 'WI-CPQ-IM-02 Attribute picklists', 'WI-CPQ-PR-01 Volume tiers', 'WI-OPP-MG-02 Renewal stage path'].map((t, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <Icon name="edit" size={12} color="#64748B" />
                <span style={{flex:1}}>{t}</span>
                <span className="chip gray" style={{fontSize: 10.5}}>draft</span>
              </div>
            ))}
          </div>
        )
      },
      {
        title: 'Pending review from my transcripts',
        pill: '6 items',
        pillHot: true,
        link: <SectionLink to="discovery" label="Open Discovery →" />,
        cardNav: () => cardNav('discovery'),
        render: () => (
          <div style={{fontSize: 12, color: '#334155'}}>
            <div>2 requirements · 2 questions · 1 scope change · 1 annotation</div>
            <button className="btn sm primary" style={{marginTop: 8}} data-stop onClick={(e) => { e.stopPropagation(); go('discovery'); }}>Open review queue</button>
          </div>
        )
      },
      {
        title: 'My open questions',
        link: <SectionLink to="questions" label="Open Questions →" />,
        cardNav: () => cardNav('questions'),
        render: () => (
          <div style={{fontSize: 12}}>
            <div style={{padding: '5px 0', cursor:'pointer'}} data-stop onClick={(e) => { e.stopPropagation(); onOpenQuestion('Q-LM-LC-003'); }}>Q-LM-LC-003 · blocks WI-LM-LC-01</div>
          </div>
        )
      },
    ],
    marcus: [
      {
        title: 'Items waiting for QA',
        pill: '1 in QA',
        link: <SectionLink to="work" sub="items" label="Open Work Items →" />,
        cardNav: () => cardNav('work', 'items'),
        render: () => (
          <div style={{fontSize: 12, cursor:'pointer'}} data-stop onClick={(e) => { e.stopPropagation(); onOpenWi('WI-LM-LA-04'); }}>
            <div>WI-LM-LA-04 Assignment audit trail · 3 tests · 1 open defect</div>
          </div>
        )
      },
      {
        title: 'Open defects',
        link: <SectionLink to="work" sub="items" label="Open Work Items →" />,
        cardNav: () => cardNav('work', 'items'),
        render: () => (
          <div style={{fontSize: 12}}>
            <div>DEF-011 · High · audit trail missing reassignment events</div>
            <div>DEF-008 · Medium · manager override UI shifts on long names</div>
          </div>
        )
      },
      {
        title: 'Test cases to write',
        link: <SectionLink to="work" sub="items" label="Open Work Items →" />,
        cardNav: () => cardNav('work', 'items'),
        render: () => (
          <div style={{fontSize: 12}}>
            <div>4 work items in Draft have zero test cases.</div>
          </div>
        )
      },
    ],
  };

  const wlist = widgets[viewingAs] || widgets.sarah;
  return (
    <div className="grid g-3">
      {wlist.map((w, i) => {
        const navProps = w.cardNav ? w.cardNav() : {};
        return (
          <div key={i} className="card" {...navProps}>
            <h3>
              {w.title}
              {w.pill && <span className={`pill ${w.pillHot ? 'hot' : ''}`} style={{marginLeft: 'auto'}}>{w.pill}</span>}
              {w.link && !w.pill && w.link}
            </h3>
            {w.render()}
            {w.link && w.pill && (
              <div style={{marginTop: 10, paddingTop: 8, borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'flex-end'}}>
                {w.link}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BurndownMini() {
  // Simple SVG burndown
  return (
    <svg viewBox="0 0 260 100" style={{width: '100%', height: 100}}>
      <defs>
        <linearGradient id="burnFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4F46E5" stopOpacity="0.2"/>
          <stop offset="1" stopColor="#4F46E5" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {[20, 40, 60, 80].map(y => <line key={y} x1="20" x2="250" y1={y} y2={y} stroke="#F1F5F9"/>)}
      {/* ideal */}
      <line x1="20" y1="20" x2="250" y2="80" stroke="#CBD5E1" strokeDasharray="3 3" strokeWidth="1.2" />
      {/* actual */}
      <polyline fill="none" stroke="#4F46E5" strokeWidth="2" points="20,20 60,28 100,34 140,42 180,54" />
      <polyline fill="url(#burnFill)" stroke="none" points="20,20 60,28 100,34 140,42 180,54 180,80 20,80" />
      {/* today marker */}
      <line x1="180" y1="15" x2="180" y2="80" stroke="#4F46E5" strokeWidth="1" strokeDasharray="2 2"/>
      <text x="186" y="22" fontSize="9" fill="#4F46E5" fontFamily="Inter">Today · 16 pts left</text>
      {/* axis */}
      <text x="20"  y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">Apr 14</text>
      <text x="110" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">Apr 21</text>
      <text x="228" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">Apr 28</text>
    </svg>
  );
}

window.Home = Home;
window.BurndownMini = BurndownMini;
