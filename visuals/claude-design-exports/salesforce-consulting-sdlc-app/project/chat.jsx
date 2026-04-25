// ---------- CHAT TAB ----------
// Claude.ai-style session primitive for per-project chat.
// Owns: session list (private/shared/archived), transcript, running memory within a session,
// heavy operations (transcript processing, story generation, briefings) running INSIDE a session,
// extracted-records sidebar (questions/decisions/requirements flowing to the KB),
// inline AI clarifying questions for low-confidence extractions,
// cross-session recall invoked on demand.

const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM } = React;

// ---- sample data for chat -----------------------------------------
const CHAT = {
  // 'you' is whoever is viewing — we render current session author accordingly.
  sessions: [
    // TODAY
    { id: "s-001", title: "Round-robin OOO handling (answer logged)", owner: "sarah", updated: "2m", createdAt: "Today · 14:02", visibility: "shared", state: "active", pinned: true,
      preview: "David asked how round-robin behaves when a rep is OOO — I got the answer from Acme Sales Ops.", group: "Today",
      msgs: 14, extracted: { q: 1, a: 1, d: 0, r: 0 } },
    { id: "s-002", title: "Draft stories for Lead Scoring epic",    owner: "priya", updated: "38m", createdAt: "Today · 13:18", visibility: "private", state: "active",
      preview: "Generate 8 user stories from the Apr 10 workshop + requirements in LM-LC.", group: "Today",
      msgs: 9, extracted: { q: 2, a: 0, d: 0, r: 8 }, heavyOp: "Story generation" },
    { id: "s-003", title: "Apr 10 Acme Sales & IT transcript",      owner: "priya", updated: "2h", createdAt: "Today · 11:40", visibility: "shared", state: "active",
      preview: "Processed 47-minute transcript. 11 applied auto, 6 awaiting review.", group: "Today",
      msgs: 6, extracted: { q: 4, a: 3, d: 2, r: 8 }, heavyOp: "Transcript processing", hasReview: true },
    // YESTERDAY
    { id: "s-004", title: "CPQ vs native — brief for Michael",       owner: "sarah", updated: "1d", createdAt: "Yesterday · 16:50", visibility: "private", state: "active",
      preview: "Draft a one-pager for the firm admin on the P3 re-proposal.", group: "Yesterday",
      msgs: 22, extracted: { q: 0, a: 0, d: 1, r: 0 }, heavyOp: "Briefing" },
    { id: "s-005", title: "Q-ENG-005 multi-currency follow-ups",     owner: "sarah", updated: "1d", createdAt: "Yesterday · 10:14", visibility: "shared", state: "active",
      preview: "What questions should we ask Acme CFO before Thursday?", group: "Yesterday",
      msgs: 11, extracted: { q: 3, a: 0, d: 0, r: 0 } },
    // EARLIER
    { id: "s-006", title: "Renewals vs new business model",          owner: "jamie", updated: "3d", createdAt: "Apr 14", visibility: "shared", state: "active",
      preview: "Client called — Jamie captured answer + follow-ups for OPP-MG.", group: "This week", msgs: 18, extracted: { q: 1, a: 1, d: 0, r: 2 } },
    { id: "s-007", title: "Migration scope — Priya notes",           owner: "priya", updated: "5d", createdAt: "Apr 12", visibility: "private", state: "active",
      preview: "Client said 3 years but implied 5 for Accounts; clarifying.", group: "This week", msgs: 7, extracted: { q: 2, a: 0, d: 0, r: 0 } },
    // ARCHIVED
    { id: "s-a01", title: "Pre-kickoff stakeholder map",             owner: "jamie", updated: "Mar 20", createdAt: "Mar 20", visibility: "shared", state: "archived",
      preview: "Jamie logged org chart and exec sponsors before Discovery kicked off.", group: "Archived · Mar", msgs: 24, extracted: { q: 0, a: 0, d: 0, r: 0 } },
    { id: "s-a02", title: "Initial client context — Sarah",         owner: "sarah", updated: "Mar 18", createdAt: "Mar 18", visibility: "private", state: "archived",
      preview: "First-pass client context doc draft based on SOW and handoff call.", group: "Archived · Mar", msgs: 12, extracted: { q: 0, a: 0, d: 0, r: 0 } },
  ],

  // Active session thread (the one rendered in the main pane).
  activeId: "s-001",
};

// Render a specific session's thread. Keep this separate from the list so it can be
// swapped when the user clicks a session.
const THREADS = {
  // Session 1 — a natural direct-answer-logging flow
  "s-001": [
    { role: "user", who: "sarah", at: "14:02",
      text: "Just got off a call with Priya and the Acme Sales Ops lead. Logging the answer to Q-LM-LA-001 — round-robin OOO behavior." },
    { role: "ai", at: "14:02", think: "Find Q-LM-LA-001",
      text: "Found it. **Q-LM-LA-001** — *What happens if a round-robin target is out of office?* Open since Apr 3, scoped to Feature · LM-LA, owned by you. Tell me the answer as the client phrased it and I'll log it.",
      context: [
        { kind: "question", id: "Q-LM-LA-001", label: "Round-robin OOO handling · open · blocks 0" },
      ]
    },
    { role: "user", who: "sarah", at: "14:03",
      text: 'Their words: "If a rep has OOO set in Outlook or an OOO flag we sync, skip to the next rep in the rotation. If everyone in the territory is OOO, escalate to the team lead. No bouncing back."' },
    { role: "ai", at: "14:03",
      text: "Logging. Before I save, one clarification — the Outlook OOO sync isn't a feature we have yet. Is that a new requirement, or does Acme expect to surface OOO from an existing field (User.IsActive, a custom `Out_of_Office__c`, something else)?",
      clarify: true,
    },
    { role: "user", who: "sarah", at: "14:05",
      text: "New requirement. They want a custom boolean + date range, synced from Outlook/Exchange later. For MVP we'll just let managers flip the flag manually." },
    { role: "ai", at: "14:05",
      text: "Got it. Proposed changes — review before I commit to the project knowledge base:",
      extracted: [
        { kind: "answer",      id: "Q-LM-LA-001", text: "Skip to next rep; if all OOO, escalate to team lead. OOO sourced from a new field.", confidence: 0.94 },
        { kind: "requirement", id: "REQ-LM-LA-012", text: "Custom boolean `Out_of_Office__c` with start/end dates on User; manager-editable in MVP.", confidence: 0.88, linksTo: "Epic · LM-LA" },
        { kind: "question",    id: "Q-LM-LA-004 (new)", text: "Future: how should we sync OOO from Outlook/Exchange? (parked — post-MVP)", confidence: 0.91, state: "parked" },
        { kind: "decision",    id: "D-LM-LA-002", text: "No round-robin bounce-back. OOO always skips forward.", confidence: 0.96 },
      ],
      impact: [
        "Unblocks WI-LM-LA-02 (Round-Robin Rules) — status flips Ready → Sprint Planned.",
        "Adds a new field to the LM-LA data model; Sarah, you may want to review before I touch the ERD.",
      ],
    },
    { role: "user", who: "sarah", at: "14:07", text: "Apply all four. Route the new field to me as an annotation before anything lands in the ERD." },
    { role: "ai", at: "14:07",
      text: "Applied. Q-LM-LA-001 is now Answered. The new field is pending your review on the LM-LA Data Model page. I've pinged David on WI-LM-LA-02.",
      applied: true,
    },
  ],
};

// Pretty-date-ish group order
const GROUP_ORDER = ["Today", "Yesterday", "This week", "Archived · Mar"];

// ---------- LEFT: sessions column ----------
function ChatSessions({ activeId, onPick, q, setQ, tab, setTab, onNew }) {
  const sessions = CHAT.sessions;
  const filtered = sessions.filter(s => {
    if (tab === "shared"   && s.visibility !== "shared") return false;
    if (tab === "private"  && s.visibility !== "private") return false;
    if (tab === "archived" && s.state !== "archived") return false;
    if (tab !== "archived" && s.state === "archived") return false;
    if (tab === "mine"     && s.owner !== "sarah") return false;
    if (!q) return true;
    return (s.title + " " + s.preview).toLowerCase().includes(q.toLowerCase());
  });
  const groups = {};
  filtered.forEach(s => { (groups[s.group] = groups[s.group] || []).push(s); });

  return (
    <aside className="chat-sessions">
      <div className="chat-sessions-head">
        <button className="btn primary" style={{width:'100%', justifyContent:'center', fontSize:12.5, padding:'7px 10px'}} onClick={onNew}>
          <Icon name="plus" size={12} color="white" /> New chat session
        </button>
        <div className="chat-search">
          <Icon name="search" size={13} />
          <input placeholder="Search this project's sessions…" value={q} onChange={e=>setQ(e.target.value)} />
          {q && <span className="kbd" style={{marginLeft:'auto'}}>↵</span>}
        </div>
        <div className="chat-tabs">
          {[
            {id:"mine",     label:"Mine",     count: sessions.filter(s=>s.owner==="sarah" && s.state!=="archived").length},
            {id:"shared",   label:"Shared",   count: sessions.filter(s=>s.visibility==="shared" && s.state!=="archived").length},
            {id:"private",  label:"Private",  count: sessions.filter(s=>s.visibility==="private" && s.state!=="archived").length},
            {id:"archived", label:"Archived", count: sessions.filter(s=>s.state==="archived").length},
          ].map(t => (
            <div key={t.id} className={`chat-tab ${tab===t.id?'on':''}`} onClick={()=>setTab(t.id)}>
              {t.label}<span className="ct-ct">{t.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-sessions-body">
        {q && (
          <div className="chat-recall">
            <div className="chat-recall-head">
              <Icon name="sparkle" size={12} color="#4F46E5" />
              <span>Cross-session recall</span>
            </div>
            <div className="chat-recall-hint">
              Press <span className="kbd">↵</span> to ask the AI to search across all sessions — including archived ones you authored — for "<b>{q}</b>".
            </div>
          </div>
        )}

        {GROUP_ORDER.filter(g=>groups[g]).map(g => (
          <div key={g}>
            <div className="chat-group-hd">{g}</div>
            {groups[g].map(s => {
              const owner = window.DATA.team.find(t=>t.id===s.owner);
              return (
                <div key={s.id} className={`chat-row ${activeId===s.id?'on':''}`} onClick={()=>onPick(s.id)}>
                  <div className="chat-row-l">
                    <Avatar person={s.owner} size="xs" />
                    {s.pinned && <span className="chat-pin" title="Pinned">★</span>}
                  </div>
                  <div className="chat-row-m">
                    <div className="chat-row-title">
                      {s.title}
                      {s.heavyOp && <span className="chat-heavy">{s.heavyOp}</span>}
                    </div>
                    <div className="chat-row-preview">{s.preview}</div>
                    <div className="chat-row-meta">
                      <span className={`vis vis-${s.visibility}`}>
                        {s.visibility==="shared" ? <><Icon name="users" size={10}/> Shared</> : <><Icon name="shield" size={10}/> Private</>}
                      </span>
                      <span>·</span>
                      <span>{s.msgs} msgs</span>
                      <span>·</span>
                      <span>{s.updated}</span>
                      {s.hasReview && <span className="needs-review">Needs review</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {tab === "archived" && (
          <div className="chat-archived-note">
            <Icon name="shield" size={11} />
            <span>After archive, only the firm administrator retains read access to raw transcripts. Extracted records stay in the knowledge base.</span>
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------- CENTER: conversation ----------
function ChatThread({ sessionId }) {
  const session = CHAT.sessions.find(s=>s.id===sessionId) || CHAT.sessions[0];
  const thread  = THREADS[session.id] || THREADS["s-001"];
  const endRef  = useR(null);
  useE(()=>{ endRef.current?.scrollTo?.({top: 1e6}); }, [sessionId]);
  const owner = window.DATA.team.find(t=>t.id===session.owner);

  return (
    <div className="chat-thread">
      {/* HEADER */}
      <div className="chat-thread-head">
        <div style={{flex:1, minWidth:0}}>
          <div className="cth-title">{session.title}</div>
          <div className="cth-sub">
            Started by <b style={{color:'#334155'}}>{owner?.name}</b> · {session.createdAt} · running memory on · scoped to Acme Manufacturing
          </div>
        </div>
        <div className="cth-actions">
          <div className={`vis-toggle vis-${session.visibility}`}>
            <Icon name={session.visibility==="shared"?"users":"shield"} size={11} />
            {session.visibility==="shared" ? "Shared with project" : "Private to you"}
            <Icon name="chevronDown" size={10} />
          </div>
          <button className="btn sm"><Icon name="sparkle" size={11} /> Ask across sessions</button>
          <button className="btn sm ghost" title="More"><Icon name="more" size={12}/></button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="chat-msgs" ref={endRef}>
        {thread.map((m, i) => <ChatMessage key={i} m={m} />)}
        <div className="chat-memory-hint">
          <Icon name="refresh" size={11} color="#94A3B8" /> AI has the full conversation above in memory. Records extracted in this session flow to the project knowledge base whether the session is shared or private.
        </div>
      </div>

      {/* COMPOSER */}
      <ChatComposer />
    </div>
  );
}

function ChatMessage({ m }) {
  if (m.role === "user") {
    const who = window.DATA.team.find(t=>t.id===m.who);
    return (
      <div className="msg msg-user">
        <Avatar person={m.who} size="sm" />
        <div className="msg-body">
          <div className="msg-head">
            <b>{who?.name}</b>
            <span className="msg-time">{m.at}</span>
          </div>
          <div className="msg-bubble user">{m.text}</div>
        </div>
      </div>
    );
  }

  // AI
  return (
    <div className="msg msg-ai">
      <div className="ai-avatar"><Icon name="sparkle" size={13} color="white" /></div>
      <div className="msg-body">
        <div className="msg-head">
          <b style={{color:'#4F46E5'}}>Rihm AI</b>
          <span className="msg-time">{m.at}</span>
          {m.think && <span className="msg-thought">• {m.think}</span>}
          {m.clarify && <span className="msg-flag amber">Asking before saving</span>}
          {m.applied && <span className="msg-flag green">Applied to knowledge base</span>}
        </div>

        {m.context && (
          <div className="ai-context">
            <div className="ai-context-hd">Pulled from this project</div>
            {m.context.map((c, i) => (
              <div key={i} className="ai-context-row">
                <span className={`dot-kind kind-${c.kind}`}></span>
                <span className="mono small" style={{color:'#4F46E5'}}>{c.id}</span>
                <span className="small" style={{color:'#475569'}}>{c.label}</span>
                <span style={{marginLeft:'auto'}}><Icon name="link" size={10} color="#94A3B8" /></span>
              </div>
            ))}
          </div>
        )}

        <div className="msg-bubble ai" dangerouslySetInnerHTML={{__html: m.text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i style="color:#475569">$1</i>')}} />

        {m.extracted && <ExtractedCard items={m.extracted} impact={m.impact} />}
      </div>
    </div>
  );
}

function ExtractedCard({ items, impact }) {
  const KIND = {
    question:    { chip: "amber",  label: "Question",    icon: "messageSquare" },
    answer:      { chip: "green",  label: "Answer",      icon: "check" },
    decision:    { chip: "indigo", label: "Decision",    icon: "flag" },
    requirement: { chip: "sky",    label: "Requirement", icon: "file" },
    risk:        { chip: "red",    label: "Risk",        icon: "warn" },
  };
  const counts = items.reduce((a,i)=>{ a[i.kind]=(a[i.kind]||0)+1; return a; }, {});
  return (
    <div className="extracted">
      <div className="extracted-hd">
        <Icon name="sparkle" size={12} color="#4F46E5" />
        <span className="extracted-title">Proposed changes to project knowledge</span>
        <span className="extracted-counts">
          {Object.entries(counts).map(([k,n]) => (
            <span key={k} className={`chip ${KIND[k].chip}`} style={{fontSize:10.5}}>{n} {KIND[k].label.toLowerCase()}{n>1?'s':''}</span>
          ))}
        </span>
      </div>
      <div className="extracted-body">
        {items.map((it, i) => {
          const k = KIND[it.kind];
          const conf = Math.round((it.confidence||0)*100);
          const tone = conf >= 85 ? "hi" : conf >= 65 ? "md" : "lo";
          return (
            <div key={i} className="extracted-row">
              <div className="ex-row-l">
                <Chip tone={k.chip}>{k.label}</Chip>
                <span className="mono small" style={{color:'#4F46E5', fontWeight:500}}>{it.id}</span>
                {it.state && <Chip tone="slate">{it.state}</Chip>}
                {it.linksTo && <span className="small muted">→ {it.linksTo}</span>}
              </div>
              <div className="ex-row-text">{it.text}</div>
              <div className="ex-row-r">
                <span className={`conf conf-${tone}`}>{conf}%</span>
                <span className="ex-split">
                  <button className="btn sm ghost" title="Edit"><Icon name="edit" size={10}/></button>
                  <button className="btn sm ghost" title="Discard"><Icon name="x" size={10}/></button>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {impact && (
        <div className="extracted-impact">
          <div className="ei-hd">Downstream impact</div>
          {impact.map((t, i) => <div key={i} className="ei-row"><Icon name="arrowRight" size={10} color="#94A3B8" /><span>{t}</span></div>)}
        </div>
      )}
      <div className="extracted-foot">
        <span className="muted small">Auto-apply threshold · <b>85%</b></span>
        <div style={{marginLeft:'auto', display:'flex', gap:6}}>
          <button className="btn sm">Discard all</button>
          <button className="btn sm">Review individually</button>
          <button className="btn sm primary">Apply all</button>
        </div>
      </div>
    </div>
  );
}

function ChatComposer() {
  const [v, setV] = useS("");
  const [attach, setAttach] = useS([]);
  return (
    <div className="chat-composer-wrap">
      <div className="chat-composer">
        <textarea
          placeholder="Ask, log a finding, or paste a transcript…  /commands · @mention questions, work items, people"
          value={v} onChange={e=>setV(e.target.value)}
          rows={2}
        />
        {attach.length > 0 && (
          <div className="chat-attach">
            {attach.map((a,i) => <Chip key={i} tone="slate">{a} <span onClick={()=>setAttach(attach.filter((_,j)=>j!==i))} style={{cursor:'pointer'}}>×</span></Chip>)}
          </div>
        )}
        <div className="chat-composer-toolbar">
          <div className="cc-tools">
            <button className="cc-btn" title="Upload transcript" onClick={()=>setAttach(a=>[...a, "Apr 17 call — transcript.txt"])}><Icon name="upload" size={12}/> Transcript</button>
            <button className="cc-btn" title="Attach @mention"><Icon name="link" size={12}/> Link a record</button>
            <button className="cc-btn" title="Run a heavy op"><Icon name="zap" size={12}/> Run…</button>
            <span className="cc-sep"></span>
            <span className="cc-hint">Running memory <b style={{color:'#16A34A'}}>on</b></span>
          </div>
          <div className="cc-right">
            <span className="small muted" style={{marginRight:8}}>Claude Sonnet 4.5</span>
            <button className="btn primary sm" disabled={!v.trim()}><Icon name="arrowRight" size={11} color="white"/> Send</button>
          </div>
        </div>
      </div>
      <div className="chat-slash">
        <span className="muted small">Try:</span>
        <span className="slash">/process-transcript</span>
        <span className="slash">/draft-stories {`<epic>`}</span>
        <span className="slash">/brief {`<topic>`}</span>
        <span className="slash">/ask-client {`<question>`}</span>
        <span className="slash">/find prior answer to…</span>
      </div>
    </div>
  );
}

// ---------- RIGHT: session summary / records ----------
function ChatRightRail({ sessionId }) {
  const session = CHAT.sessions.find(s=>s.id===sessionId) || CHAT.sessions[0];
  const ex = session.extracted;
  const total = ex.q + ex.a + ex.d + ex.r;

  return (
    <aside className="chat-right">
      <div className="cr-section">
        <div className="cr-hd">Session summary</div>
        <div className="cr-summary">
          <div className="crs-metric">
            <div className="crs-label">Extracted this session</div>
            <div className="crs-val">{total}</div>
          </div>
          <div className="crs-bars">
            {ex.q>0 && <div className="crs-bar bar-q" style={{flex: ex.q}}    title={`${ex.q} questions`}>{ex.q}</div>}
            {ex.a>0 && <div className="crs-bar bar-a" style={{flex: ex.a}}    title={`${ex.a} answers`}>{ex.a}</div>}
            {ex.d>0 && <div className="crs-bar bar-d" style={{flex: ex.d}}    title={`${ex.d} decisions`}>{ex.d}</div>}
            {ex.r>0 && <div className="crs-bar bar-r" style={{flex: ex.r}}    title={`${ex.r} requirements`}>{ex.r}</div>}
          </div>
          <div className="crs-legend">
            <span><i className="dot-kind kind-question"/>Q {ex.q}</span>
            <span><i className="dot-kind kind-answer"/>A {ex.a}</span>
            <span><i className="dot-kind kind-decision"/>D {ex.d}</span>
            <span><i className="dot-kind kind-requirement"/>R {ex.r}</span>
          </div>
        </div>
      </div>

      <div className="cr-section">
        <div className="cr-hd">Records in play</div>
        <div className="cr-records">
          <div className="cr-rec">
            <div className="cr-rec-l"><span className="dot-kind kind-question"/><span className="mono small">Q-LM-LA-001</span></div>
            <div className="cr-rec-txt">Round-robin OOO handling</div>
            <StatusChip status="done" />
          </div>
          <div className="cr-rec">
            <div className="cr-rec-l"><span className="dot-kind kind-requirement"/><span className="mono small">REQ-LM-LA-012</span></div>
            <div className="cr-rec-txt">Custom Out_of_Office__c field on User</div>
            <Chip tone="amber">pending SA</Chip>
          </div>
          <div className="cr-rec">
            <div className="cr-rec-l"><span className="dot-kind kind-decision"/><span className="mono small">D-LM-LA-002</span></div>
            <div className="cr-rec-txt">No round-robin bounce-back</div>
            <Chip tone="green">applied</Chip>
          </div>
          <div className="cr-rec">
            <div className="cr-rec-l"><span className="dot-kind kind-question"/><span className="mono small">Q-LM-LA-004</span></div>
            <div className="cr-rec-txt">Outlook OOO sync — future</div>
            <Chip tone="slate">parked</Chip>
          </div>
        </div>
      </div>

      <div className="cr-section">
        <div className="cr-hd">Unblocked</div>
        <div className="cr-unblocked">
          <div className="cr-ub">
            <span className="mono small" style={{color:'#4F46E5'}}>WI-LM-LA-02</span>
            <span>Round-Robin Rules</span>
            <StatusChip status="sprint" />
          </div>
        </div>
      </div>

      <div className="cr-section">
        <div className="cr-hd">Heavy ops cost</div>
        <div className="cr-cost">
          <div className="cr-cost-row"><span>This session</span><span className="mono">$0.34</span></div>
          <div className="cr-cost-row"><span>Project · Apr</span><span className="mono">$48.12</span></div>
          <div className="cr-cost-foot muted small">Transcript processing and story generation run here. Firm admin sees totals in §22.</div>
        </div>
      </div>
    </aside>
  );
}

// ---------- ROOT CHAT TAB ----------
function Chat() {
  const [activeId, setActiveId] = useS(CHAT.activeId);
  const [tab, setTab] = useS("mine");
  const [q, setQ] = useS("");

  return (
    <div className="chat-root" data-screen-label="Chat">
      <ChatSessions activeId={activeId} onPick={setActiveId} q={q} setQ={setQ} tab={tab} setTab={setTab} onNew={()=>setActiveId("new")} />
      <ChatThread sessionId={activeId} />
      <ChatRightRail sessionId={activeId} />
    </div>
  );
}

Object.assign(window, { Chat });
