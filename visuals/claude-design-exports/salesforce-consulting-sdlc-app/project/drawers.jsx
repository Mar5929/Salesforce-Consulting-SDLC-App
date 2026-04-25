// Drawers — Re-proposal diff, Work Item detail, Readiness breakdown, Question detail
const { useState: useStateD } = React;

function ReproposalDrawer({ open, onClose }) {
  const D = window.DATA;
  const R = D.reproposal;
  const [mode, setMode] = useStateD('merge');
  const [selected, setSelected] = useStateD({ 0: true, 1: true, 2: true, 3: true });
  const [inflight, setInflight] = useStateD('confirm');
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer wide ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <div style={{width: 32, height: 32, borderRadius: 8, background: '#F59E0B', display: 'grid', placeItems: 'center'}}>
            <Icon name="sparkle" size={16} color="white" />
          </div>
          <div style={{flex: 1}}>
            <div style={{fontWeight: 600, fontSize: 14}}>AI Roadmap Re-proposal · P3 CPQ restructure</div>
            <div style={{fontSize: 11.5, color: '#64748B'}}>Fired {R.firedAt} · {R.trigger} · claude-sonnet-4.5</div>
          </div>
          <button className="btn ghost" onClick={onClose}><Icon name="x" size={14} /></button>
        </div>

        <div className="drawer-body">
          <p style={{margin: 0, marginBottom: 14, fontSize: 13, lineHeight: 1.55, color: '#0F172A'}}>
            {R.summary}
          </p>

          {/* Before / After phase view */}
          <div className="sec-head" style={{marginTop: 0}}><h2>Phase 3 · before / after</h2></div>
          <div className="before-after" style={{marginBottom: 16}}>
            <div className="ba-side rem">
              <div className="label">Current · v3</div>
              <div className="phasename">Quoting</div>
              <div className="epics">
                <div><span className="mono" style={{fontSize: 10.5, color: '#B91C1C'}}>Q-TG</span> Template-Gen Quoting <span style={{color: '#B91C1C'}}>· 4 items</span></div>
              </div>
            </div>
            <div className="ba-side add">
              <div className="label">Proposed · v4</div>
              <div className="phasename">CPQ Implementation</div>
              <div className="epics">
                <div><span className="mono" style={{fontSize: 10.5, color: '#15803D'}}>CPQ-IM</span> Product Catalog <span style={{color:'#64748B'}}>· 5 items</span></div>
                <div><span className="mono" style={{fontSize: 10.5, color: '#15803D'}}>CPQ-PR</span> Pricing Rules <span style={{color:'#64748B'}}>· 4 items</span></div>
                <div><span className="mono" style={{fontSize: 10.5, color: '#15803D'}}>CPQ-DC</span> Document Creation <span style={{color:'#64748B'}}>· 3 items</span></div>
              </div>
            </div>
          </div>

          {/* Changes grouped */}
          <div className="sec-head"><h2>Changes by type</h2><div className="actions"><span className="muted small">{Object.values(selected).filter(Boolean).length} of {R.changes.length} selected</span></div></div>
          {R.changes.map((c, i) => (
            <div key={i} className="diff-group">
              <div className="diff-group-head">
                {mode === 'selective' && (
                  <input type="checkbox" checked={!!selected[i]} onChange={e => setSelected({...selected, [i]: e.target.checked})} />
                )}
                <Chip tone={c.type === 'removed' ? 'red' : c.type === 'added' ? 'green' : c.type === 'renamed' ? 'indigo' : 'amber'}>
                  {c.label}
                </Chip>
                <span style={{fontWeight: 500}}>{c.title}</span>
              </div>
              <div className="diff-row">
                {c.detail && <div style={{fontSize: 12.5, color: '#334155', marginBottom: 6}}>{c.detail}</div>}
                <div className="diff-evidence">
                  <Icon name="link" size={11} /> Evidence: <span className="ts">{c.evidence}</span>
                </div>
              </div>
            </div>
          ))}

          {/* In-flight impact */}
          <div className="sec-head" style={{marginTop: 18}}><h2>In-flight impact · requires your decision</h2></div>
          <div className="impact-card">
            {R.impactInFlight.map(w => (
              <div key={w.id}>
                <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
                  <span className="mono" style={{fontSize: 11, fontWeight: 600, color: '#78350F'}}>{w.id}</span>
                  <span style={{fontWeight: 500, fontSize: 13}}>{w.title}</span>
                  <StatusChip status="progress" />
                  <Avatar person={w.assignee} size="xs" />
                  <span style={{marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#78350F'}}>{w.points} pts</span>
                </div>
                <div style={{fontSize: 12.5, color: '#78350F', marginBottom: 10, lineHeight: 1.5}}>
                  <span style={{fontWeight: 600}}>AI recommendation:</span> {w.recommendation}
                </div>
                <div style={{display: 'flex', gap: 6}}>
                  <button className={`btn sm ${inflight === 'confirm' ? 'primary' : ''}`} onClick={() => setInflight('confirm')}>
                    {inflight === 'confirm' && <Icon name="check" size={11} color="white" />} Confirm (close & replace)
                  </button>
                  <button className={`btn sm ${inflight === 'override' ? 'primary' : ''}`} onClick={() => setInflight('override')}>
                    {inflight === 'override' && <Icon name="check" size={11} color="white" />} Override (keep in place)
                  </button>
                  <button className={`btn sm ${inflight === 'flag' ? 'primary' : ''}`} onClick={() => setInflight('flag')}>
                    {inflight === 'flag' && <Icon name="check" size={11} color="white" />} Flag for later
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Apply mode */}
          <div className="sec-head" style={{marginTop: 18}}><h2>Apply mode</h2></div>
          <div className="apply-tabs">
            <div className={`apply-tab ${mode === 'adopt' ? 'active' : ''}`} onClick={() => setMode('adopt')}>
              <div>Adopt wholesale</div>
              <div className="d">Apply all changes as proposed</div>
            </div>
            <div className={`apply-tab ${mode === 'merge' ? 'active' : ''}`} onClick={() => setMode('merge')}>
              <div>Merge</div>
              <div className="d">Keep manual edits, integrate new</div>
            </div>
            <div className={`apply-tab ${mode === 'selective' ? 'active' : ''}`} onClick={() => setMode('selective')}>
              <div>Selective apply</div>
              <div className="d">Pick changes one by one</div>
            </div>
          </div>
        </div>

        <div className="drawer-foot">
          <span style={{fontSize: 11.5, color: '#64748B'}}>Approval writes a new version (v4). Prior versions remain viewable read-only.</span>
          <div style={{flex: 1}} />
          <button className="btn" onClick={onClose}>Defer</button>
          <button className="btn">Reject proposal</button>
          <button className="btn primary">Approve · create v4</button>
        </div>
      </div>
    </>
  );
}

function WorkItemDrawer({ open, id, onClose, onOpenQuestion }) {
  const D = window.DATA;
  const w = D.workItems.find(x => x.id === id) || D.workItems.find(x => x.id === 'WI-LM-LA-02');
  if (!w) return null;
  const epic = D.epics.find(e => e.id === w.epic);
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span className="mono" style={{fontSize: 11, color: '#475569', fontWeight: 500}}>{w.id}</span>
              <StatusChip status={w.status} />
              <Chip tone="outline">User Story</Chip>
              <span className="muted small">· {epic?.name}</span>
            </div>
            <div style={{fontWeight: 600, fontSize: 15, marginTop: 4}}>{w.title}</div>
          </div>
          <div style={{marginLeft: 'auto', display: 'flex', gap: 4}}>
            <button className="btn ghost"><Icon name="link" size={13} /> Open full</button>
            <button className="btn ghost" onClick={onClose}><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div className="drawer-body">
          <dl className="dl">
            <dt>Assignee</dt><dd>{w.assignee ? <><Avatar person={w.assignee} size="xs" /> {D.team.find(t=>t.id===w.assignee)?.name}</> : <span className="muted">Unassigned</span>}</dd>
            <dt>Reporter</dt><dd><Avatar person="sarah" size="xs" /> Sarah Chen</dd>
            <dt>Parent epic</dt><dd><span className="tlink">{epic?.id} {epic?.name}</span></dd>
            <dt>Sprint</dt><dd>Sprint 3 · active</dd>
            <dt>Story points</dt><dd><b>{w.points}</b></dd>
            <dt>Priority</dt><dd><Chip tone="orange">High</Chip></dd>
          </dl>

          <div className="sec-head" style={{marginTop: 16}}><h2>Description</h2></div>
          <div style={{fontSize: 12.5, lineHeight: 1.6, color: '#334155'}}>
            Sales managers need the ability to override the round-robin lead assignment when a specific rep is best-suited based on relationship history or territory expertise. The override must be auditable and reversible within a 24-hour window.
          </div>

          <div className="sec-head" style={{marginTop: 16}}><h2>Acceptance criteria</h2></div>
          <div className="gwt">
            <div><span className="kw">GIVEN</span> a lead has been auto-assigned via round-robin</div>
            <div><span className="kw">WHEN</span> a manager reassigns it to a specific rep with a reason</div>
            <div><span className="kw">THEN</span> the system records the override, notifies both reps, and logs audit entry</div>
          </div>
          <div className="gwt" style={{marginTop: 6}}>
            <div><span className="kw">GIVEN</span> an override was logged within the last 24 hours</div>
            <div><span className="kw">WHEN</span> the original rep requests reversal</div>
            <div><span className="kw">THEN</span> assignment rolls back and audit shows both entries</div>
          </div>

          <div className="sec-head" style={{marginTop: 16}}><h2>Linked discovery questions</h2></div>
          <div className="q-card" onClick={() => onOpenQuestion('Q-LM-LA-001')} style={{marginBottom: 6}}>
            <div className="qhead">
              <span className="qid">Q-LM-LA-001</span>
              <Chip tone="green">answered</Chip>
              <span className="muted small" style={{marginLeft: 'auto'}}>Apr 12</span>
            </div>
            <div className="qtext">What happens if a round-robin target is out of office?</div>
            <div className="qans">→ Skip to next available rep; log skip reason on audit trail. — Sarah Chen</div>
          </div>

          <div className="sec-head" style={{marginTop: 16}}><h2>Impacted Salesforce components</h2></div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            {[
              { api: 'Lead', type: 'Object', impact: 'Modify', chip: 'amber' },
              { api: 'LeadAssignmentHandler', type: 'Apex class', impact: 'Modify', chip: 'amber' },
              { api: 'Manager_Override__c', type: 'Field', impact: 'Create', chip: 'green' },
              { api: 'Lead_Audit_Trail__c', type: 'Object', impact: 'Modify', chip: 'amber' },
            ].map((c, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#F8FAFC', borderRadius: 6, fontSize: 12}}>
                <Icon name="database" size={12} color="#64748B" />
                <span className="mono" style={{fontSize: 11, fontWeight: 500}}>{c.api}</span>
                <span className="muted small">{c.type}</span>
                <span style={{marginLeft: 'auto'}}><Chip tone={c.chip}>{c.impact}</Chip></span>
              </div>
            ))}
          </div>

          <div className="sec-head" style={{marginTop: 16}}><h2>Test cases · 3</h2><div className="actions"><button className="btn sm">+ Test case</button></div></div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            {[
              { t: 'Manager can override via UI with reason captured', type: 'positive', s: 'Pass' },
              { t: 'Override audit entry written with manager ID', type: 'positive', s: 'Pass' },
              { t: 'Override blocked when manager lacks territory permission', type: 'negative', s: 'Not Executed' },
            ].map((t, i) => (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#F8FAFC', borderRadius: 6, fontSize: 12}}>
                <Icon name="check" size={12} color={t.s === 'Pass' ? '#16A34A' : '#94A3B8'} />
                <span style={{flex: 1}}>{t.t}</span>
                <Chip tone={t.type === 'positive' ? 'sky' : 'pink'}>{t.type}</Chip>
                <Chip tone={t.s === 'Pass' ? 'green' : 'gray'}>{t.s}</Chip>
              </div>
            ))}
          </div>

          <div className="sec-head" style={{marginTop: 16}}><h2>Activity</h2></div>
          <div className="activity">
            {[
              { who: 'David Kim', what: 'moved to In Progress', when: 'Apr 15', a: 'a-david', init: 'DK' },
              { who: 'Sarah Chen', what: 'approved implementation plan', when: 'Apr 14', a: 'a-sarah', init: 'SC' },
              { who: 'Priya Patel', what: 'marked Ready with acceptance criteria', when: 'Apr 13', a: 'a-priya', init: 'PP' },
            ].map((r, i) => (
              <div key={i} className="activity-row">
                <div className={`avatar xs ${r.a}`}>{r.init}</div>
                <div className="line"><span className="who">{r.who}</span> <span className="what">{r.what}</span><span className="when">· {r.when}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn">Reassign</button>
          <button className="btn">Change status</button>
          <div style={{flex: 1}} />
          <button className="btn primary">+ Comment</button>
        </div>
      </div>
    </>
  );
}

function ReadinessDrawer({ open, onClose }) {
  const D = window.DATA;
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <div>
            <div style={{fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600}}>Readiness breakdown</div>
            <div style={{fontSize: 15, fontWeight: 600, marginTop: 3}}>P3 · Quoting  <Chip tone="red">34%</Chip></div>
          </div>
          <button className="btn ghost" style={{marginLeft: 'auto'}} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="drawer-body">
          <p style={{fontSize: 12.5, color: '#64748B', marginTop: 0, lineHeight: 1.5}}>
            Composite of three signals. Click any item to jump to its source.
          </p>

          <div className="sec-head"><h2>Open discovery questions · 2</h2></div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16}}>
            <div className="q-card">
              <div className="qhead"><span className="qid">Q-P3-001</span> <Chip tone="green">answered · triggered reprop</Chip></div>
              <div className="qtext">Native Opportunity Products or Salesforce CPQ?</div>
            </div>
            <div className="q-card">
              <div className="qhead"><span className="qid">Q-ENG-005</span> <Chip tone="amber">open</Chip> <span className="muted small" style={{marginLeft:'auto'}}>blocks 5 items</span></div>
              <div className="qtext">Does Acme need multi-currency? US and Canada ops are separate entities.</div>
              <button className="btn sm primary" style={{marginTop: 8}}>Answer</button>
            </div>
          </div>

          <div className="sec-head"><h2>Work item field gaps · 4</h2></div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16}}>
            {[
              { id: 'WI-QT-TG-01', t: 'Quote numbering scheme', miss: ['acceptance criteria', 'story points'] },
              { id: 'WI-QT-TG-02', t: 'Build quote PDF template', miss: ['test cases'] },
              { id: 'WI-QT-TG-03', t: 'Email quote to customer', miss: ['acceptance criteria', 'impacted components'] },
              { id: 'WI-QT-TG-04', t: 'Quote approval workflow', miss: ['persona'] },
            ].map(w => (
              <div key={w.id} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 6, fontSize: 12}}>
                <span className="mono small" style={{color: '#475569', width: 100}}>{w.id}</span>
                <span style={{flex: 1}}>{w.t}</span>
                <span className="muted small">missing: {w.miss.join(', ')}</span>
                <button className="btn sm">Open</button>
              </div>
            ))}
          </div>

          <div className="sec-head"><h2>AI flags · 2</h2></div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            <div style={{padding: '10px 12px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 6, fontSize: 12.5}}>
              <div style={{fontWeight: 600, color: '#78350F', marginBottom: 4}}>Contradiction · quote template engine</div>
              <div style={{color: '#92400E', lineHeight: 1.5}}>Acceptance on WI-QT-TG-02 references "native template engine" but new direction (Q-P3-001) specifies CPQ. Resolve as part of re-proposal.</div>
            </div>
            <div style={{padding: '10px 12px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 6, fontSize: 12.5}}>
              <div style={{fontWeight: 600, color: '#78350F', marginBottom: 4}}>Conflict · component ownership</div>
              <div style={{color: '#92400E', lineHeight: 1.5}}>Two epics (Q-TG and OPP-MG) both declare Modify on Opportunity standard fields.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function QuestionDrawer({ open, qid, onClose }) {
  const D = window.DATA;
  const q = D.questions.find(x => x.id === qid) || D.questions[0];
  if (!q) return null;
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-head">
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span className="mono" style={{fontSize: 11, color: '#475569', fontWeight: 500}}>{q.id}</span>
              <Chip tone={q.state === 'open' ? 'amber' : q.state === 'answered' ? 'green' : 'gray'}>{q.state}</Chip>
              <span className="muted small">· {q.scope}</span>
            </div>
            <div style={{fontWeight: 600, fontSize: 14, marginTop: 4, lineHeight: 1.4}}>{q.text}</div>
          </div>
          <button className="btn ghost" style={{marginLeft: 'auto'}} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="drawer-body">
          <dl className="dl">
            <dt>Scope</dt><dd>{q.scope}</dd>
            <dt>Owner</dt><dd>{q.ownerType === 'client' ? <><Avatar person={'client'} size="xs" /> {q.owner} <Chip tone="slate">client</Chip></> : q.owner}</dd>
            <dt>Asked by</dt><dd>{q.askedBy}</dd>
            <dt>Asked</dt><dd className="mono small">{q.askedDate}</dd>
            {q.answeredDate && <><dt>Answered</dt><dd className="mono small">{q.answeredDate}</dd></>}
            {q.blocks > 0 && <><dt>Blocks</dt><dd style={{color: '#B91C1C', fontWeight: 500}}>{q.blocks} work {q.blocks === 1 ? 'item' : 'items'}</dd></>}
          </dl>

          {q.answer && (
            <>
              <div className="sec-head" style={{marginTop: 16}}><h2>Answer</h2></div>
              <div className="qans" style={{fontSize: 13, lineHeight: 1.5}}>{q.answer}</div>
              {q.triggered && (
                <div style={{marginTop: 10, padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6, fontSize: 12.5}}>
                  <Icon name="sparkle" size={12} color="#D97706" /> <b>Impact:</b> {q.triggered}
                </div>
              )}
            </>
          )}

          {q.parkedReason && (
            <>
              <div className="sec-head" style={{marginTop: 16}}><h2>Parked</h2></div>
              <div style={{fontSize: 13, color: '#64748B', fontStyle: 'italic', padding: '10px 12px', background: '#F8FAFC', borderRadius: 6}}>{q.parkedReason}</div>
            </>
          )}

          {q.state === 'open' && (
            <>
              <div className="sec-head" style={{marginTop: 16}}><h2>Answer this question</h2></div>
              <textarea placeholder="Type answer here…" style={{width: '100%', minHeight: 80, padding: 10, border: '1px solid #E2E8F0', borderRadius: 6, fontFamily: 'inherit', fontSize: 13}}></textarea>
              <div style={{display: 'flex', gap: 6, marginTop: 8}}>
                <button className="btn">Park</button>
                <button className="btn">Re-scope</button>
                <div style={{flex: 1}} />
                <button className="btn primary">Submit answer</button>
              </div>
            </>
          )}

          {q.blocksList && (
            <>
              <div className="sec-head" style={{marginTop: 16}}><h2>Blocks</h2></div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
                {q.blocksList.map(wi => (
                  <div key={wi} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: '#F8FAFC', borderRadius: 6}}>
                    <span className="mono small" style={{color: '#475569'}}>{wi}</span>
                    <span style={{flex: 1, fontSize: 12.5}}>Capture leads from web form</span>
                    <StatusChip status="ready" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ReproposalDrawer, WorkItemDrawer, ReadinessDrawer, QuestionDrawer });
