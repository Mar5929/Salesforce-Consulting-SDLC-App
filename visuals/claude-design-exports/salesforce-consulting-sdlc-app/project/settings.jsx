// Settings — project + firm-level controls per PRD §5, §13, §14, §16, §19, §22, §23
const { useState: useStateSet } = React;

const SETTINGS_SECTIONS = [
  { group: 'Project', items: [
    { id: 'project',   label: 'Project info',         icon: 'folder' },
    { id: 'team',      label: 'Team & access',        icon: 'users' },
    { id: 'salesforce',label: 'Salesforce orgs',      icon: 'cloud' },
    { id: 'jira',      label: 'Jira sync',            icon: 'sync' },
    { id: 'ai',        label: 'AI behavior',          icon: 'sparkle' },
    { id: 'health',    label: 'Health thresholds',    icon: 'gauge' },
    { id: 'notify',    label: 'Notifications',        icon: 'bell' },
  ]},
  { group: 'Firm', items: [
    { id: 'guardrails',label: 'SF dev guardrails',    icon: 'shield' },
    { id: 'branding',  label: 'Branding & templates', icon: 'palette' },
    { id: 'naming',    label: 'Naming conventions',   icon: 'tag' },
    { id: 'security',  label: 'Security & data',      icon: 'lock' },
    { id: 'billing',   label: 'Costs & licensing',    icon: 'dollar' },
  ]},
];

function Settings({ viewingAs }) {
  const [active, setActive] = useStateSet('project');
  const isAdmin = viewingAs === 'sarah' || viewingAs === 'michael';
  return (
    <div className="content" style={{display: 'grid', gridTemplateColumns: '230px 1fr', gap: 18, alignItems: 'flex-start'}}>
      <div className="card" style={{padding: 8, position: 'sticky', top: 0}}>
        {SETTINGS_SECTIONS.map(grp => (
          <div key={grp.group} style={{marginBottom: 6}}>
            <div style={{padding: '8px 10px 4px', fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600}}>{grp.group}</div>
            {grp.items.map(it => {
              const firmLocked = grp.group === 'Firm' && !isAdmin;
              return (
                <div key={it.id}
                  onClick={() => !firmLocked && setActive(it.id)}
                  style={{
                    padding: '7px 10px', borderRadius: 6, cursor: firmLocked ? 'not-allowed' : 'pointer',
                    background: active === it.id ? '#EEF2FF' : 'transparent',
                    borderLeft: active === it.id ? '2px solid #4F46E5' : '2px solid transparent',
                    fontSize: 12.5, color: firmLocked ? '#94A3B8' : (active === it.id ? '#312E81' : '#0F172A'),
                    fontWeight: active === it.id ? 600 : 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                  <span>{it.label}</span>
                  {firmLocked && <Icon name="lock" size={11} color="#CBD5E1" />}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{padding: '8px 10px', borderTop: '1px dashed #E2E8F0', marginTop: 4, fontSize: 10.5, color: '#64748B', lineHeight: 1.5}}>
          Firm settings are configured by the Firm Administrator (V1: Michael Rihm). Solution Architects on this project have view + edit access.
        </div>
      </div>

      <div>
        {active === 'project'    && <ProjectSettings />}
        {active === 'team'       && <TeamSettings />}
        {active === 'salesforce' && <SalesforceSettings />}
        {active === 'jira'       && <JiraSettings />}
        {active === 'ai'         && <AISettings />}
        {active === 'health'     && <HealthSettings />}
        {active === 'notify'     && <NotifySettings viewingAs={viewingAs} />}
        {active === 'guardrails' && <GuardrailsSettings />}
        {active === 'branding'   && <BrandingSettings />}
        {active === 'naming'     && <NamingSettings />}
        {active === 'security'   && <SecuritySettings />}
        {active === 'billing'    && <BillingSettings />}
      </div>
    </div>
  );
}

// ---------- shared bits ----------
function SectionHead({ title, sub, actions }) {
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0'}}>
      <div>
        <div style={{fontSize: 18, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em'}}>{title}</div>
        {sub && <div style={{fontSize: 12, color: '#64748B', marginTop: 3}}>{sub}</div>}
      </div>
      {actions && <div style={{display: 'flex', gap: 6}}>{actions}</div>}
    </div>
  );
}

function Field({ label, hint, children, half }) {
  return (
    <div style={{padding: '12px 0', borderBottom: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: half ? '180px 1fr' : '220px 1fr', gap: 16, alignItems: 'flex-start'}}>
      <div>
        <div style={{fontSize: 12.5, fontWeight: 500, color: '#0F172A'}}>{label}</div>
        {hint && <div style={{fontSize: 11, color: '#64748B', marginTop: 3, lineHeight: 1.5}}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer'}} onClick={() => onChange && onChange(!on)}>
      <div style={{width: 32, height: 18, borderRadius: 12, background: on ? '#4F46E5' : '#CBD5E1', padding: 2, transition: '0.15s'}}>
        <div style={{width: 14, height: 14, borderRadius: 50, background: 'white', transform: on ? 'translateX(14px)' : 'translateX(0)', transition: '0.15s'}}></div>
      </div>
      {label && <span style={{fontSize: 12, color: '#0F172A'}}>{label}</span>}
    </div>
  );
}

function TextInput({ value, mono, wide, ...rest }) {
  return <input type="text" defaultValue={value} {...rest}
    style={{padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 5, fontSize: 12, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit', width: wide ? '100%' : 280, background: 'white'}} />;
}

function SelectInput({ value, options, wide }) {
  return (
    <select defaultValue={value}
      style={{padding: '6px 10px', border: '1px solid #CBD5E1', borderRadius: 5, fontSize: 12, width: wide ? '100%' : 280, background: 'white'}}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ============== Project ==============
function ProjectSettings() {
  return (
    <div>
      <SectionHead
        title="Project info"
        sub="Basic identity & lifecycle metadata. Some fields archive into the read-only project record per §21."
        actions={<><button className="btn sm">Cancel</button><button className="btn sm primary">Save</button></>} />
      <div className="card" style={{padding: '4px 18px'}}>
        <Field label="Project name"><TextInput value="Acme Manufacturing" /></Field>
        <Field label="Client" hint="Used in branded deliverables and the project breadcrumb."><TextInput value="Acme Manufacturing Inc." /></Field>
        <Field label="Engagement type"><SelectInput value="Greenfield" options={['Greenfield', 'Migration', 'Optimization', 'Managed services']} /></Field>
        <Field label="Salesforce cloud" hint="Drives template suggestions and discovery question presets."><SelectInput value="Sales Cloud" options={['Sales Cloud', 'Service Cloud', 'Sales + Service', 'Experience Cloud', 'CPQ', 'Custom']} /></Field>
        <Field label="Started" hint="Locked once first sprint opens."><TextInput value="2026-03-18" mono /></Field>
        <Field label="Target completion"><TextInput value="2026-07-03" mono /></Field>
        <Field label="Roadmap version" hint="Bumped automatically when an accepted re-proposal moves epics."><span style={{display:'inline-flex', alignItems:'center', gap:8}}><Chip tone="violet">v3</Chip><span className="muted small">last bump · Apr 16 · CPQ re-proposal accepted</span></span></Field>
        <Field label="Lifecycle stage" hint="Build → Testing requires QA sign-off on the active sprint.">
          <div style={{display:'flex', gap: 6}}>
            {['Initialization','Discovery','Roadmap','Build','Testing','Deployment','Hypercare','Archive'].map(s => (
              <Chip key={s} tone={s === 'Build' ? 'violet' : s === 'Initialization' || s === 'Discovery' || s === 'Roadmap' ? 'gray' : 'gray'}>{s === 'Build' ? '● ' + s : s}</Chip>
            ))}
          </div>
        </Field>
      </div>

      <div style={{marginTop: 24}} />
      <SectionHead title="Danger zone" sub="Irreversible operations. Archive freezes all data and disables AI; restore is not in V1." />
      <div style={{padding: '14px 18px', border: '1px solid #FECACA', borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 12}}>
        <div style={{flex: 1}}>
          <div style={{fontSize: 13, fontWeight: 600, color: '#991B1B'}}>Archive project</div>
          <div style={{fontSize: 11.5, color: '#7F1D1D', marginTop: 2}}>Generates final knowledge package and snapshot. AI is disabled; the project becomes read-only forever.</div>
        </div>
        <button className="btn sm" style={{background: 'white', color: '#991B1B', borderColor: '#FCA5A5'}}>Archive…</button>
      </div>
    </div>
  );
}

// ============== Team & access ==============
function TeamSettings() {
  const D = window.DATA;
  const team = [
    { id: 'sarah',  role: 'Solution Architect', perm: 'Admin',     last: '2 min ago' },
    { id: 'jamie',  role: 'Project Manager',    perm: 'Editor',    last: '1 hr ago' },
    { id: 'priya',  role: 'Business Analyst',   perm: 'Editor',    last: '4 hr ago' },
    { id: 'david',  role: 'Developer',          perm: 'Developer', last: 'Just now' },
    { id: 'marcus', role: 'QA Engineer',        perm: 'Editor',    last: 'Yesterday' },
  ];
  const permLevels = ['Admin', 'Editor', 'Developer', 'Viewer'];
  return (
    <div>
      <SectionHead
        title="Team & access"
        sub="Project-scoped roles. Per §19, every user belongs to exactly one role per project; cross-project permissions are managed at the firm level."
        actions={<button className="btn sm primary"><Icon name="plus" size={11}/> Invite member</button>} />

      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <table className="tbl">
          <thead><tr>
            <th>Member</th>
            <th style={{width: 180}}>Project role</th>
            <th style={{width: 140}}>Permission</th>
            <th style={{width: 110}}>Last active</th>
            <th style={{width: 60}}></th>
          </tr></thead>
          <tbody>
            {team.map(t => {
              const p = D.team.find(x => x.id === t.id);
              return (
                <tr key={t.id}>
                  <td style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <Avatar person={t.id} size="xs" />
                    <div>
                      <div style={{fontSize: 12.5, fontWeight: 500}}>{p.name}</div>
                      <div style={{fontSize: 11, color: '#64748B'}}>{p.name.toLowerCase().split(' ')[0]}@rihm.com</div>
                    </div>
                  </td>
                  <td>{t.role}</td>
                  <td>
                    <select defaultValue={t.perm} style={{padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11.5, background: 'white'}}>
                      {permLevels.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="small muted">{t.last}</td>
                  <td><div className="icon-btn" style={{width: 24, height: 24}}><Icon name="more" size={12} /></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{marginTop: 18, padding: '12px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, color: '#475569'}}>
        <div style={{fontWeight: 600, color: '#0F172A', marginBottom: 6}}>Permission matrix</div>
        <table className="tbl" style={{fontSize: 11.5}}>
          <thead><tr>
            <th>Action</th><th style={{textAlign:'center'}}>Admin</th><th style={{textAlign:'center'}}>Editor</th><th style={{textAlign:'center'}}>Developer</th><th style={{textAlign:'center'}}>Viewer</th>
          </tr></thead>
          <tbody>
            {[
              ['Edit project info', '✓', '—', '—', '—'],
              ['Invite / remove members', '✓', '—', '—', '—'],
              ['Configure SF org connection', '✓', '—', '—', '—'],
              ['Edit work items, write answers', '✓', '✓', '—', '—'],
              ['Update WI status (own assignments)', '✓', '✓', '✓', '—'],
              ['View deliverables and dashboards', '✓', '✓', '✓', '✓'],
            ].map((r,i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                {r.slice(1).map((c,j) => <td key={j} style={{textAlign:'center', color: c === '✓' ? '#16A34A' : '#CBD5E1', fontWeight: c === '✓' ? 600 : 400}}>{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============== Salesforce orgs ==============
function SalesforceSettings() {
  return (
    <div>
      <SectionHead
        title="Salesforce orgs"
        sub="Per §13–14: one shared team sandbox is the source of truth for org knowledge. Read-only credentials only; the app never deploys."
        actions={<button className="btn sm primary"><Icon name="plus" size={11}/> Connect org</button>} />

      <div className="card" style={{padding: 16, marginBottom: 14}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #00A1E0, #0070D2)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 16}}>SF</div>
          <div style={{flex: 1}}>
            <div style={{fontSize: 14, fontWeight: 600, color: '#0F172A'}}>Acme · shared sandbox</div>
            <div style={{fontSize: 11.5, color: '#64748B', marginTop: 2}} className="mono">acme--shared.sandbox.my.salesforce.com · API v60.0</div>
          </div>
          <Chip tone="green">connected</Chip>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F5F9'}}>
          <div><div style={{fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Last sync</div><div style={{fontSize: 13, fontWeight: 600, marginTop: 2}}>4 hr ago</div></div>
          <div><div style={{fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Components</div><div style={{fontSize: 13, fontWeight: 600, marginTop: 2}}>1,847</div></div>
          <div><div style={{fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Custom objects</div><div style={{fontSize: 13, fontWeight: 600, marginTop: 2}}>62</div></div>
          <div><div style={{fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Knowledge articles</div><div style={{fontSize: 13, fontWeight: 600, marginTop: 2}}>148</div></div>
        </div>
      </div>

      <div className="card" style={{padding: '4px 18px'}}>
        <Field label="Connection method" hint="OAuth refresh-token flow. Per §22 the secret never leaves the server.">
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <Chip tone="green">OAuth · Connected App</Chip>
            <button className="btn sm">Reauthorize</button>
          </div>
        </Field>
        <Field label="Sync schedule">
          <SelectInput value="Every 4 hours" options={['Every hour', 'Every 4 hours', 'Every 12 hours', 'Daily', 'Manual only']} />
        </Field>
        <Field label="What we read" hint="Only metadata enters our database. No record data is ever pulled.">
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            {[
              { name: 'Object & field metadata',     on: true },
              { name: 'Apex classes & triggers',     on: true },
              { name: 'Lightning components',        on: true },
              { name: 'Validation & flow rules',     on: true },
              { name: 'Permission sets & profiles',  on: true },
              { name: 'Knowledge articles',          on: true },
              { name: 'Record data',                 on: false, lock: true },
            ].map(r => (
              <div key={r.name} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0'}}>
                <Toggle on={r.on} />
                <span style={{fontSize: 12, color: '#0F172A'}}>{r.name}</span>
                {r.lock && <Chip tone="gray">policy-locked</Chip>}
              </div>
            ))}
          </div>
        </Field>
        <Field label="Sandbox strategy" hint="V1 default per §14.1: shared team sandbox + per-developer scratch orgs.">
          <SelectInput value="Shared team sandbox + scratch orgs" options={['Shared team sandbox + scratch orgs', 'Per-developer dev sandboxes', 'Custom']} />
        </Field>
      </div>

      <div style={{marginTop: 14, padding: '12px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 12, color: '#1E3A8A'}}>
        <Icon name="info" size={12} /> &nbsp;<b>Read-only.</b> The web application has no deployment scope. Code travels developer → scratch org → shared sandbox via your Git/CI pipeline; this app only observes the result.
      </div>
    </div>
  );
}

// ============== Jira ==============
function JiraSettings() {
  const [enabled, setEnabled] = useStateSet(false);
  return (
    <div>
      <SectionHead
        title="Client Jira sync"
        sub="Optional one-directional push from this app → client Jira (per §20). Never pulls; never round-trips."
        actions={<Toggle on={enabled} onChange={setEnabled} label={enabled ? 'Enabled' : 'Disabled'} />} />

      {!enabled && (
        <div className="card" style={{padding: '24px 22px', textAlign: 'center', color: '#475569'}}>
          <div style={{width: 48, height: 48, borderRadius: 50, background: '#F1F5F9', display: 'grid', placeItems: 'center', margin: '0 auto 12px', color: '#94A3B8'}}><Icon name="sync" size={20} /></div>
          <div style={{fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4}}>Jira sync is off</div>
          <div style={{fontSize: 12, maxWidth: 460, margin: '0 auto', lineHeight: 1.6}}>Turn this on if the client requires their stories to live in Jira. We push status updates from this app to their instance; their edits don't flow back.</div>
        </div>
      )}

      {enabled && (
        <>
          <div className="card" style={{padding: '4px 18px', marginBottom: 14}}>
            <Field label="Jira instance"><TextInput value="acme.atlassian.net" mono wide /></Field>
            <Field label="Project key"><TextInput value="ACMSF" mono /></Field>
            <Field label="Auth"><Chip tone="amber">Awaiting client OAuth</Chip></Field>
          </div>
          <div className="card" style={{padding: '4px 18px'}}>
            <Field label="What we push" hint="One-directional only. Client edits in Jira are not pulled back.">
              <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                {[
                  ['Story title & description', true],
                  ['Status transitions',        true],
                  ['Story points',              true],
                  ['Acceptance criteria',       true],
                  ['Comments from this app',    false],
                ].map(([n, on]) => (
                  <div key={n} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <Toggle on={on} /><span style={{fontSize: 12}}>{n}</span>
                  </div>
                ))}
              </div>
            </Field>
            <Field label="Status mapping">
              <table className="tbl" style={{fontSize: 11.5}}>
                <thead><tr><th>Local status</th><th>Jira status</th></tr></thead>
                <tbody>
                  {[
                    ['Ready', 'To Do'],
                    ['Sprint Planned', 'Selected for Development'],
                    ['In Progress', 'In Progress'],
                    ['In Review', 'In Code Review'],
                    ['QA', 'QA'],
                    ['Done', 'Done'],
                  ].map(([a, b]) => (
                    <tr key={a}><td>{a}</td><td>→ &nbsp;{b}</td></tr>
                  ))}
                </tbody>
              </table>
            </Field>
          </div>
        </>
      )}
    </div>
  );
}

// ============== AI ==============
function AISettings() {
  const [autoFile, setAutoFile] = useStateSet(true);
  const [autoEnrich, setAutoEnrich] = useStateSet(true);
  const [proactive, setProactive] = useStateSet(true);
  return (
    <div>
      <SectionHead title="AI behavior" sub="How the project brain interacts with this project. Defaults are firm-recommended; per-project overrides are saved here." />
      <div className="card" style={{padding: '4px 18px'}}>
        <Field label="Default model" hint="Pinned to Claude per §3.3. Haiku for fast loops; Sonnet for synthesis & generation."><SelectInput value="claude-haiku-4.5 (default) · claude-sonnet-4.5 (synthesis)" options={['claude-haiku-4.5 (default) · claude-sonnet-4.5 (synthesis)', 'claude-haiku-4.5 only', 'claude-sonnet-4.5 only']} wide /></Field>
        <Field label="Auto-file new questions" hint="When a discovery transcript surfaces a question, scope and file it without confirmation."><Toggle on={autoFile} onChange={setAutoFile} /></Field>
        <Field label="Auto-enrich stories" hint="Suggest acceptance criteria, impacted components, test stubs on save."><Toggle on={autoEnrich} onChange={setAutoEnrich} /></Field>
        <Field label="Proactive surfacing" hint="Bubble blockers, stale Qs, missing info into Home and dashboards."><Toggle on={proactive} onChange={setProactive} /></Field>
        <Field label="Confidence threshold" hint="AI suggestions below this confidence require explicit human approval before applying.">
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <input type="range" min="0" max="100" defaultValue="65" style={{width: 220}} />
            <span className="mono" style={{fontSize: 12, fontWeight: 600, color: '#4F46E5'}}>0.65</span>
          </div>
        </Field>
        <Field label="Tone for client deliverables">
          <SelectInput value="Professional · concise" options={['Professional · concise', 'Professional · detailed', 'Conversational', 'Formal']} />
        </Field>
      </div>

      <div style={{marginTop: 18}} />
      <SectionHead title="Context budget" sub="Hard caps to prevent runaway calls. Hits are logged in Settings → Costs." />
      <div className="card" style={{padding: '4px 18px'}}>
        <Field label="Max context per call" half><span className="mono">128K tokens</span></Field>
        <Field label="Max output tokens" half><span className="mono">8K</span></Field>
        <Field label="Max background jobs / minute" half><span className="mono">12</span></Field>
        <Field label="Soft monthly cap" half>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <TextInput value="$40" />
            <span className="muted small">notify owner at 80%, hard-stop at 100%</span>
          </div>
        </Field>
      </div>
    </div>
  );
}

// ============== Health thresholds ==============
function HealthSettings() {
  return (
    <div>
      <SectionHead title="Health thresholds" sub="Tunable signals that drive Yellow / Red. Defaults match PRD §17.6." />
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr>
            <th>Signal</th>
            <th style={{width: 130}}>Yellow at</th>
            <th style={{width: 130}}>Red at</th>
            <th style={{width: 90}}>Active</th>
            <th style={{width: 90}}>Current</th>
          </tr></thead>
          <tbody>
            {[
              { sig: 'Stale open question',          y: '> 7 days',  r: '> 14 days', cur: 2 },
              { sig: 'Client Qs past follow-up',     y: '> 3 days',  r: '> 7 days',  cur: 2 },
              { sig: 'Blocked work item',            y: '> 5 days',  r: '> 10 days', cur: 1 },
              { sig: 'High-severity risk w/o plan',  y: 'any',       r: '> 7 days',  cur: 0 },
              { sig: 'Sprint commit overrun',        y: '> 110%',    r: '> 130%',    cur: 0 },
              { sig: 'Sprint completion under',      y: '< 75%',     r: '< 50%',     cur: 0 },
            ].map((s, i) => (
              <tr key={i}>
                <td>{s.sig}</td>
                <td><TextInput value={s.y} mono /></td>
                <td><TextInput value={s.r} mono /></td>
                <td><Toggle on={true} /></td>
                <td>
                  <span style={{fontWeight: 600, color: s.cur > 0 ? '#D97706' : '#16A34A'}}>{s.cur}</span>
                  {s.cur > 0 && <span style={{fontSize: 10.5, color: '#64748B', marginLeft: 4}}>active</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============== Notifications ==============
function NotifySettings({ viewingAs }) {
  const D = window.DATA;
  const me = D.team.find(p => p.id === viewingAs) || D.team[0];
  return (
    <div>
      <SectionHead title="Notifications" sub={`Personal preferences for ${me.name}. Stored per-user, scoped to this project.`} />
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr><th>Event</th><th style={{width: 90, textAlign: 'center'}}>In-app</th><th style={{width: 90, textAlign: 'center'}}>Email</th><th style={{width: 90, textAlign: 'center'}}>Slack</th></tr></thead>
          <tbody>
            {[
              ['Question assigned to me',          true, true, true],
              ['Work item assigned to me',         true, true, true],
              ['Work item I own changes status',   true, false, false],
              ['Comment mentions me',              true, true, true],
              ['Sprint review starts in 24h',      true, true, false],
              ['Health flips to Yellow / Red',     true, true, true],
              ['Re-proposal touches my work',      true, true, true],
              ['Daily AI briefing',                false, true, false],
            ].map((r, i) => (
              <tr key={i}>
                <td>{r[0]}</td>
                {r.slice(1).map((on, j) => (
                  <td key={j} style={{textAlign: 'center'}}><Toggle on={on} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop: 12, padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 11.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 10}}>
        <Icon name="info" size={12} color="#64748B" />
        Quiet hours: <b style={{color: '#0F172A'}}>9 PM → 8 AM ET</b>, weekdays only · <a href="#" onClick={e => e.preventDefault()} style={{color: '#4F46E5'}}>Edit</a>
      </div>
    </div>
  );
}

// ============== Guardrails ==============
function GuardrailsSettings() {
  const guardrails = [
    { n: 1, t: 'No production deploys from agent', d: 'Claude Code skills refuse to authenticate against any production org. Hard-coded refusal at the skill level — no override.' },
    { n: 2, t: 'No destructive metadata operations', d: 'Skill blocks deleteMetadata, deleteRecord, and bulk truncates. Removals must go through a human-authored destructive changeset.' },
    { n: 3, t: 'Test class with every Apex change', d: 'Skill rejects PRs that touch Apex without a corresponding test class meeting the firm coverage threshold.' },
    { n: 4, t: 'Validate against shared sandbox before PR', d: 'Skill runs `sf project deploy validate -o shared-sandbox` before opening a PR. Validation must pass.' },
    { n: 5, t: 'Naming conventions enforced', d: 'New components must match the firm naming convention regex set below. Prefixes are non-optional.' },
    { n: 6, t: 'No PII in prompts or logs', d: 'Skill scrubs known PII patterns (email, phone, SSN, credit card) before sending to the model and before logging.' },
  ];
  return (
    <div>
      <SectionHead
        title="Salesforce dev guardrails"
        sub="The six hard-locked rules from §15. Enforced inside Claude Code skills; reflected here for visibility — they cannot be overridden from the web app."
        actions={<Chip tone="violet">firm-managed</Chip>} />
      <div className="card" style={{padding: 4}}>
        {guardrails.map(g => (
          <div key={g.n} style={{display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 14, padding: '14px 14px', borderBottom: g.n < 6 ? '1px solid #F1F5F9' : 'none', alignItems: 'flex-start'}}>
            <div style={{width: 28, height: 28, borderRadius: 6, background: '#1E1B4B', color: 'white', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700}}>{g.n}</div>
            <div>
              <div style={{fontSize: 13, fontWeight: 600, color: '#0F172A'}}>{g.t}</div>
              <div style={{fontSize: 11.5, color: '#64748B', marginTop: 4, lineHeight: 1.5}}>{g.d}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <Chip tone="green">enforced</Chip>
              <Icon name="lock" size={12} color="#94A3B8" />
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop: 12, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 11.5, color: '#78350F'}}>
        <Icon name="warn" size={12} /> &nbsp;Changes here update the firm-wide guardrail registry and propagate to every project on next skill invocation. Audit log: <a href="#" onClick={e => e.preventDefault()} style={{color: '#4F46E5'}}>view 7 changes</a>.
      </div>
    </div>
  );
}

// ============== Branding ==============
function BrandingSettings() {
  return (
    <div>
      <SectionHead title="Branding & document templates" sub="Used when generating client-facing deliverables (status reports, BRDs, SDDs, decks)." />

      <div className="card" style={{padding: 18, marginBottom: 14}}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
          <div>
            <div style={{fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8}}>Firm</div>
            <div style={{padding: 16, border: '1px dashed #CBD5E1', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{width: 56, height: 56, borderRadius: 8, background: '#0F172A', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 20, letterSpacing: '-0.04em'}}>R/</div>
              <div>
                <div style={{fontSize: 13, fontWeight: 600}}>Rihm Consulting</div>
                <div style={{fontSize: 11, color: '#64748B', marginTop: 2}}>Logo · 56×56 SVG</div>
                <button className="btn sm" style={{marginTop: 6}}>Replace</button>
              </div>
            </div>
            <div style={{display: 'flex', gap: 6, marginTop: 12}}>
              {['#0F172A', '#4F46E5', '#16A34A', '#F59E0B', '#EF4444'].map(c => (
                <div key={c} style={{flex: 1, height: 36, background: c, borderRadius: 4, position: 'relative'}}>
                  <span style={{position:'absolute', bottom: -16, left: 0, fontSize: 9.5, color: '#64748B'}} className="mono">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 8}}>This project</div>
            <div style={{padding: 16, border: '1px dashed #CBD5E1', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12}}>
              <div style={{width: 56, height: 56, borderRadius: 8, background: '#FFFFFF', border: '1px solid #E2E8F0', display: 'grid', placeItems: 'center'}}>
                <div style={{width: 30, height: 30, borderRadius: 50, background: 'linear-gradient(135deg, #DC2626, #7F1D1D)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 12}}>A</div>
              </div>
              <div>
                <div style={{fontSize: 13, fontWeight: 600}}>Acme Manufacturing</div>
                <div style={{fontSize: 11, color: '#64748B', marginTop: 2}}>Co-branded mark · used in client deliverables</div>
                <button className="btn sm" style={{marginTop: 6}}>Upload</button>
              </div>
            </div>
            <div style={{display: 'flex', gap: 6, marginTop: 12}}>
              {['#7F1D1D', '#DC2626', '#FCA5A5', '#F8FAFC', '#0F172A'].map(c => (
                <div key={c} style={{flex: 1, height: 36, background: c, borderRadius: 4, border: c === '#F8FAFC' ? '1px solid #E2E8F0' : 'none', position: 'relative'}}>
                  <span style={{position:'absolute', bottom: -16, left: 0, fontSize: 9.5, color: '#64748B'}} className="mono">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SectionHead title="Document templates" sub="Word and PowerPoint templates the AI populates with project content." actions={<button className="btn sm primary">Upload template</button>} />
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr>
            <th>Template</th><th style={{width:120}}>Type</th><th style={{width:120}}>Scope</th><th style={{width:120}}>Last used</th><th style={{width:100}}>State</th>
          </tr></thead>
          <tbody>
            {[
              { n: 'Status report — weekly',     t: 'docx', scope: 'Firm',         used: '4 days ago', state: 'active' },
              { n: 'Business Requirements Doc',   t: 'docx', scope: 'Firm',         used: '12 days ago', state: 'active' },
              { n: 'Solution Design Document',    t: 'docx', scope: 'Firm',         used: '8 days ago',  state: 'active' },
              { n: 'Phase readout deck',          t: 'pptx', scope: 'Firm',         used: '20 days ago', state: 'active' },
              { n: 'Acme — exec quarterly deck',  t: 'pptx', scope: 'This project', used: '6 days ago',  state: 'active' },
              { n: 'Test plan',                   t: 'docx', scope: 'Firm',         used: 'Never',       state: 'draft' },
            ].map((r, i) => (
              <tr key={i}>
                <td style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div style={{width: 28, height: 32, borderRadius: 3, background: r.t === 'docx' ? '#2B579A' : '#D24726', color: 'white', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700}}>{r.t.toUpperCase()}</div>
                  {r.n}
                </td>
                <td className="small muted">{r.t}</td>
                <td><Chip tone={r.scope === 'Firm' ? 'violet' : 'blue'}>{r.scope}</Chip></td>
                <td className="small muted">{r.used}</td>
                <td><Chip tone={r.state === 'active' ? 'green' : 'gray'}>{r.state}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============== Naming ==============
function NamingSettings() {
  return (
    <div>
      <SectionHead title="Naming conventions" sub="Enforced by Claude Code skill #5 when creating new Salesforce metadata." />
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr><th>Component</th><th>Pattern</th><th>Example</th></tr></thead>
          <tbody>
            {[
              ['Custom object',     '{Acronym}_{Name}__c',      'ACM_LeadSource__c'],
              ['Custom field',      '{Name}__c',                'LegacyId__c'],
              ['Apex class',        '{Domain}{Type}',           'LeadAssignmentService'],
              ['Apex test class',   '{Class}Test',              'LeadAssignmentServiceTest'],
              ['Trigger',           '{Object}Trigger',          'LeadTrigger'],
              ['Trigger handler',   '{Object}TriggerHandler',   'LeadTriggerHandler'],
              ['Lightning component','{domain}{Name}',          'leadAssignmentPanel'],
              ['Permission set',    'PS_{Domain}_{Action}',     'PS_Lead_FullAccess'],
              ['Validation rule',   '{Object}_{Rule}',          'Lead_Phone_Required'],
            ].map(([n, p, e], i) => (
              <tr key={i}>
                <td>{n}</td>
                <td><TextInput value={p} mono /></td>
                <td className="mono small">{e}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{marginTop: 12, padding: '10px 14px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 11.5, color: '#1E40AF'}}>
        <Icon name="info" size={12} /> &nbsp;Patterns are validated as regex inside the Claude Code skill. Override per-project requires Firm Admin approval.
      </div>
    </div>
  );
}

// ============== Security ==============
function SecuritySettings() {
  return (
    <div>
      <SectionHead title="Security & data handling" sub="Per §22. Most controls are firm-locked; per-project knobs appear below where allowed." />

      <div className="card" style={{padding: '4px 18px', marginBottom: 14}}>
        <Field label="Data residency"><Chip tone="violet">us-east-1 · firm-locked</Chip></Field>
        <Field label="Encryption at rest"><Chip tone="green">AES-256 · always on</Chip></Field>
        <Field label="Encryption in transit"><Chip tone="green">TLS 1.3</Chip></Field>
        <Field label="PII scrubbing in prompts" hint="Strips email, phone, SSN, credit-card patterns before AI calls and logs."><Toggle on={true} /></Field>
        <Field label="Org metadata retention" hint="How long parsed metadata is kept after the project archives."><SelectInput value="90 days" options={['30 days','90 days','1 year','Indefinite']} /></Field>
        <Field label="Transcript retention"><SelectInput value="2 years" options={['90 days','1 year','2 years','7 years']} /></Field>
        <Field label="Redact transcripts before model call"><Toggle on={true} /></Field>
      </div>

      <SectionHead title="Audit log" sub="All settings changes, access grants, AI write-actions, and exports are recorded." />
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr><th style={{width: 130}}>When</th><th style={{width: 140}}>Actor</th><th style={{width: 160}}>Action</th><th>Detail</th></tr></thead>
          <tbody>
            {[
              ['Apr 16 14:32', 'sarah',  'roadmap.bump',          'CPQ re-proposal accepted → roadmap v3'],
              ['Apr 16 09:11', 'system', 'health.flip',           'Yellow signal: Q-LM-LC-003 past follow-up threshold'],
              ['Apr 15 16:48', 'priya',  'transcript.upload',     'Acme · Discovery session 7 (28 min)'],
              ['Apr 15 11:20', 'sarah',  'guardrails.audit_view', 'Viewed firm guardrail registry'],
              ['Apr 14 17:02', 'jamie',  'export.docx',           'Status report · Sprint 3 week 1'],
              ['Apr 14 09:00', 'system', 'sf.sync',               'Pulled 1,847 metadata components (Δ 23)'],
            ].map((r, i) => (
              <tr key={i}>
                <td className="mono small">{r[0]}</td>
                <td style={{display:'flex', alignItems:'center', gap:6}}>
                  {r[1] === 'system' ? <Icon name="bolt" size={11} color="#94A3B8" /> : <Avatar person={r[1]} size="xs" />}
                  <span className="small">{r[1]}</span>
                </td>
                <td className="mono small">{r[2]}</td>
                <td className="small">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============== Costs & licensing ==============
function BillingSettings() {
  return (
    <div>
      <SectionHead title="Costs & consultant licensing" sub="Per §23. Per-project caps, firm seat ledger, and Inngest free-tier headroom." />

      <div className="grid g-3" style={{marginBottom: 14}}>
        <div className="kpi"><div className="label">This project · MTD</div><div className="value">$10.81</div><div className="sub">of $40 cap · 27%</div><div className="progress" style={{marginTop:6}}><div className="fill" style={{width:'27%'}}></div></div></div>
        <div className="kpi"><div className="label">Firm · MTD</div><div className="value">$184.40</div><div className="sub">across 6 active projects</div></div>
        <div className="kpi"><div className="label">Active seats</div><div className="value">23<span style={{color:'#94A3B8', fontSize:13, marginLeft:4}}>/30</span></div><div className="sub">7 seats remaining</div></div>
      </div>

      <div className="card" style={{padding: '4px 18px', marginBottom: 14}}>
        <Field label="Per-project soft cap" hint="Owner is notified at 80%; AI calls hard-stop at 100% until reset.">
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <TextInput value="$40 / month" />
            <button className="btn sm">Request increase</button>
          </div>
        </Field>
        <Field label="Default model strategy"><SelectInput value="Haiku-first · escalate to Sonnet for synthesis" options={['Haiku-first · escalate to Sonnet for synthesis','Sonnet always','Haiku only (cost-saver)']} /></Field>
        <Field label="Inngest free-tier guard" hint="Throttle background jobs when monthly events exceed threshold.">
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <input type="range" min="50" max="100" defaultValue="90" style={{width: 200}} />
            <span className="mono" style={{fontSize: 12, fontWeight: 600, color: '#D97706'}}>90%</span>
            <span className="muted small">currently 4,820 / 5,000 events</span>
          </div>
        </Field>
      </div>

      <SectionHead title="Seat ledger" sub="Firm-wide consultant seats. Seat = web-app login. Claude Code is licensed separately." />
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr><th>Member</th><th style={{width:160}}>Role</th><th style={{width:120}}>Seat type</th><th style={{width:120}}>Active projects</th><th style={{width:100}}>Status</th></tr></thead>
          <tbody>
            {[
              { who: 'sarah',   seat: 'Architect', proj: 4, st: 'active' },
              { who: 'jamie',   seat: 'PM',        proj: 3, st: 'active' },
              { who: 'priya',   seat: 'BA',        proj: 2, st: 'active' },
              { who: 'david',   seat: 'Dev',       proj: 2, st: 'active' },
              { who: 'marcus',  seat: 'QA',        proj: 5, st: 'active' },
              { who: 'michael', seat: 'Admin',     proj: '—', st: 'firm admin' },
            ].map(r => {
              const p = window.DATA.team.find(x => x.id === r.who);
              return (
                <tr key={r.who}>
                  <td style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <Avatar person={r.who} size="xs" />{p.name}
                  </td>
                  <td className="small muted">{p.role}</td>
                  <td>{r.seat}</td>
                  <td className="mono small">{r.proj}</td>
                  <td><Chip tone={r.st === 'firm admin' ? 'violet' : 'green'}>{r.st}</Chip></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Settings = Settings;
