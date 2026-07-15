import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle2, Clock, Users, Zap,
    TrendingUp, Activity, RefreshCw, Circle, ChevronRight
} from 'lucide-react';
import '../App.css';

// ─── Dummy Data ────────────────────────────────────────────────────────────────

const DUMMY_QUEUE = [
    { jobId: 101, servicePoint: 'Bay 1', customer: 'BK0012', services: 'Oil Change, Brake Check', startedTime: '08:15 AM', endTime: '09:30 AM', overdue: false },
    { jobId: 107, servicePoint: 'Bay 3', customer: 'BK0034', services: 'Engine Diagnostics', startedTime: '08:45 AM', endTime: '09:15 AM', overdue: true },
    { jobId: 112, servicePoint: 'Counter 1', customer: 'BK0056', services: 'Tire Rotation', startedTime: '09:00 AM', endTime: '09:45 AM', overdue: false },
    { jobId: 119, servicePoint: 'Bay 2', customer: 'BK0078', services: 'AC Service, Coolant Flush', startedTime: '09:10 AM', endTime: '10:30 AM', overdue: false },
    { jobId: 123, servicePoint: 'Bay 4', customer: 'BK0091', services: 'Full Service', startedTime: '08:30 AM', endTime: '09:00 AM', overdue: true },
];

const DUMMY_SERVICE_POINTS = [
    { id: 1, name: 'Bay 1', status: 'serving', load: 'normal' },
    { id: 2, name: 'Bay 2', status: 'serving', load: 'normal' },
    { id: 3, name: 'Bay 3', status: 'overdue', load: 'critical' },
    { id: 4, name: 'Bay 4', status: 'overdue', load: 'critical' },
    { id: 5, name: 'Bay 5', status: 'idle', load: 'low' },
    { id: 6, name: 'Counter 1', status: 'serving', load: 'normal' },
    { id: 7, name: 'Counter 2', status: 'idle', load: 'low' },
    { id: 8, name: 'Counter 3', status: 'idle', load: 'low' },
    { id: 9, name: 'Express 1', status: 'serving', load: 'normal' },
    { id: 10, name: 'Express 2', status: 'idle', load: 'low' },
    { id: 11, name: 'Wash Bay', status: 'serving', load: 'normal' },
    { id: 12, name: 'Detail Bay', status: 'idle', load: 'low' },
];

const DUMMY_SERVICES = [
    { name: 'Oil Change', count: 42 },
    { name: 'Tire Rotation', count: 35 },
    { name: 'Brake Service', count: 28 },
    { name: 'AC Service', count: 21 },
    { name: 'Engine Diagnostics', count: 18 },
    { name: 'Full Service', count: 14 },
];

const DUMMY_STAFF = [
    { name: 'Kamal', initials: 'KP', loggedIn: true, point: 'Bay 1' },
    { name: 'Nimesh', initials: 'NR', loggedIn: true, point: 'Bay 2' },
    { name: 'Saman', initials: 'SD', loggedIn: true, point: 'Bay 3' },
    { name: 'Ruwan', initials: 'RW', loggedIn: false, point: null },
    { name: 'Tharaka', initials: 'TH', loggedIn: true, point: 'Counter 1' },
    { name: 'Ishara', initials: 'IP', loggedIn: false, point: null },
    { name: 'Dilshan', initials: 'DK', loggedIn: true, point: 'Express 1' },
    { name: 'Chamara', initials: 'CG', loggedIn: true, point: 'Wash Bay' },
];

const DUMMY_ACTIVITY = [
    { id: 1, type: 'completed', message: 'Job #98 completed at Bay 5', time: '2 min ago', color: 'var(--success-color)' },
    { id: 2, type: 'overdue', message: 'Job #107 overdue by 18m at Bay 3', time: '5 min ago', color: 'var(--danger-color)' },
    { id: 3, type: 'started', message: 'Job #123 started serving at Bay 4', time: '9 min ago', color: 'var(--info-color)' },
    { id: 4, type: 'login', message: 'Agent Tharaka logged in to Counter 1', time: '14 min ago', color: 'var(--primary-color)' },
    { id: 5, type: 'completed', message: 'Job #95 completed at Counter 2', time: '21 min ago', color: 'var(--success-color)' },
    { id: 6, type: 'overdue', message: 'Job #103 overdue by 5m at Bay 4', time: '26 min ago', color: 'var(--danger-color)' },
    { id: 7, type: 'login', message: 'Agent Dilshan logged in to Express 1', time: '31 min ago', color: 'var(--primary-color)' },
    { id: 8, type: 'started', message: 'Job #119 started serving at Bay 2', time: '35 min ago', color: 'var(--info-color)' },
];

const DUMMY_FUNNEL = { pending: 38, serving: 12, completed: 74, total: 124 };

const DUMMY_WEEK = [
    { day: 'Mon', rate: 82 },
    { day: 'Tue', rate: 75 },
    { day: 'Wed', rate: 88 },
    { day: 'Thu', rate: 71 },
    { day: 'Fri', rate: 91 },
    { day: 'Sat', rate: 85 },
    { day: 'Today', rate: 60 },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionCard = ({ children, style = {} }) => (
    <div style={{
        background: 'var(--modal-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '0.875rem',
        padding: '1.25rem',
        boxShadow: 'var(--card-shadow)',
        ...style
    }}>
        {children}
    </div>
);

const SectionTitle = ({ children }) => (
    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
        {children}
    </p>
);

// Sparkline using inline SVG
const Sparkline = ({ data }) => {
    const max = Math.max(...data.map(d => d.rate));
    const min = Math.min(...data.map(d => d.rate));
    const w = 180, h = 48, pad = 4;
    const xStep = (w - pad * 2) / (data.length - 1);
    const yScale = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2);
    const points = data.map((d, i) => `${pad + i * xStep},${yScale(d.rate)}`).join(' ');
    const today = data[data.length - 1];

    return (
        <svg width={w} height={h} style={{ overflow: 'visible' }}>
            <polyline
                points={points}
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
            {data.map((d, i) => (
                <circle
                    key={i}
                    cx={pad + i * xStep}
                    cy={yScale(d.rate)}
                    r={i === data.length - 1 ? 4 : 2.5}
                    fill={i === data.length - 1 ? 'var(--primary-color)' : 'var(--modal-bg)'}
                    stroke="var(--primary-color)"
                    strokeWidth="1.5"
                />
            ))}
        </svg>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const NewDashboard = () => {
    const [tick, setTick] = useState(0);

    // Refresh tick every 30s (for "live" feel)
    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(id);
    }, []);

    const overdueJobs = DUMMY_QUEUE.filter(j => j.overdue);
    const activeStaff = DUMMY_STAFF.filter(s => s.loggedIn).length;
    const shortage = DUMMY_STAFF.length - activeStaff;
    const maxService = Math.max(...DUMMY_SERVICES.map(s => s.count));
    const pointColors = {
        serving: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#3b82f6' },
        overdue: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#ef4444' },
        idle: { bg: 'var(--hover-bg)', border: 'var(--border-color)', text: 'var(--text-secondary)' },
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h3>Operations Dashboard</h3>
                    <p className="subtitle">Live overview of today's service activity.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={13} />
                    Auto-refreshes every 30s
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* ── Row 1: Overdue Alert (only when there are overdue jobs) ── */}
                {overdueJobs.length > 0 && (
                    <div style={{
                        background: 'rgba(239,68,68,0.07)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderLeft: '4px solid #ef4444',
                        borderRadius: '0.75rem',
                        padding: '0.875rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                    }}>
                        <AlertTriangle size={18} color="#ef4444" />
                        <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>
                            {overdueJobs.length} job{overdueJobs.length > 1 ? 's' : ''} overdue
                        </span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            — {overdueJobs.map(j => `#${j.jobId} at ${j.servicePoint}`).join('  ·  ')}
                        </span>
                    </div>
                )}

                {/* ── Row 2: Job Flow Funnel ── */}
                <SectionCard>
                    <SectionTitle>Job Flow — Today</SectionTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Total */}
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total</p>
                            <p style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{DUMMY_FUNNEL.total}</p>
                        </div>
                        <ChevronRight size={18} color="var(--border-color)" />
                        {/* Pending */}
                        <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.08)', borderRadius: '0.75rem', padding: '0.75rem 0.5rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, marginBottom: '0.25rem' }}>Pending</p>
                            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', lineHeight: 1 }}>{DUMMY_FUNNEL.pending}</p>
                            <p style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '0.25rem' }}>{Math.round(DUMMY_FUNNEL.pending / DUMMY_FUNNEL.total * 100)}%</p>
                        </div>
                        <ChevronRight size={18} color="var(--border-color)" />
                        {/* Serving */}
                        <div style={{ textAlign: 'center', background: 'rgba(59,130,246,0.08)', borderRadius: '0.75rem', padding: '0.75rem 0.5rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.25rem' }}>Serving</p>
                            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{DUMMY_FUNNEL.serving}</p>
                            <p style={{ fontSize: '0.7rem', color: '#3b82f6', marginTop: '0.25rem' }}>{Math.round(DUMMY_FUNNEL.serving / DUMMY_FUNNEL.total * 100)}%</p>
                        </div>
                        <ChevronRight size={18} color="var(--border-color)" />
                        {/* Completed */}
                        <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.08)', borderRadius: '0.75rem', padding: '0.75rem 0.5rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginBottom: '0.25rem' }}>Completed</p>
                            <p style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{DUMMY_FUNNEL.completed}</p>
                            <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.25rem' }}>{Math.round(DUMMY_FUNNEL.completed / DUMMY_FUNNEL.total * 100)}%</p>
                        </div>
                    </div>
                </SectionCard>

                {/* ── Row 3: Three columns ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>

                    {/* Completion Rate Trend */}
                    <SectionCard>
                        <SectionTitle>Completion Rate — This Week</SectionTitle>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1 }}>
                                    {DUMMY_WEEK[DUMMY_WEEK.length - 1].rate}%
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Today so far</p>
                            </div>
                            <Sparkline data={DUMMY_WEEK} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                            {DUMMY_WEEK.map((d, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.65rem', color: i === DUMMY_WEEK.length - 1 ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: i === DUMMY_WEEK.length - 1 ? 700 : 400 }}>{d.day}</p>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d.rate}%</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Pending vs Capacity */}
                    <SectionCard style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <SectionTitle>Pending vs Capacity</SectionTitle>
                        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                            <p style={{ fontSize: '3rem', fontWeight: 900, color: DUMMY_FUNNEL.pending > 5 ? '#d97706' : 'var(--primary-color)', lineHeight: 1 }}>
                                {DUMMY_FUNNEL.pending}
                                <span style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-secondary)' }}> / {DUMMY_SERVICE_POINTS.filter(p => p.status === 'idle').length}</span>
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>pending jobs &nbsp;/&nbsp; free points</p>
                        </div>
                        <div style={{ background: 'var(--hover-bg)', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '0.5rem' }}>
                            {DUMMY_FUNNEL.pending <= DUMMY_SERVICE_POINTS.filter(p => p.status === 'idle').length ? (
                                <p style={{ fontSize: '0.8rem', color: 'var(--success-color)', fontWeight: 600, textAlign: 'center' }}>✓ Capacity OK — enough free points</p>
                            ) : (
                                <p style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600, textAlign: 'center' }}>⚠ Queue building up — {DUMMY_FUNNEL.pending - DUMMY_SERVICE_POINTS.filter(p => p.status === 'idle').length} jobs over capacity</p>
                            )}
                        </div>
                    </SectionCard>

                    {/* Staff Status */}
                    <SectionCard>
                        <SectionTitle>Staff Status</SectionTitle>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success-color)', lineHeight: 1 }}>{activeStaff}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Active</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: shortage > 0 ? '#ef4444' : 'var(--text-secondary)', lineHeight: 1 }}>{shortage}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Absent</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{DUMMY_STAFF.length}</p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {DUMMY_STAFF.map((s, i) => (
                                <div key={i} title={s.loggedIn ? `${s.name} — ${s.point}` : `${s.name} — Not logged in`} style={{
                                    width: 34, height: 34, borderRadius: '50%',
                                    background: s.loggedIn ? 'var(--primary-color)' : 'var(--hover-bg)',
                                    color: s.loggedIn ? '#fff' : 'var(--text-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 700,
                                    border: s.loggedIn ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                                    cursor: 'default',
                                    opacity: s.loggedIn ? 1 : 0.5,
                                }}>
                                    {s.initials}
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

                {/* ── Row 4: Heat Map + Top Services ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                    {/* Service Point Heat Map */}
                    <SectionCard>
                        <SectionTitle>Service Point Status</SectionTitle>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.875rem' }}>
                            {['serving', 'overdue', 'idle'].map(s => (
                                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: pointColors[s].bg, border: `1.5px solid ${pointColors[s].border}` }} />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            {DUMMY_SERVICE_POINTS.map(p => (
                                <div key={p.id} title={`${p.name} — ${p.status}`} style={{
                                    padding: '0.5rem 0.4rem',
                                    borderRadius: '0.5rem',
                                    background: pointColors[p.status].bg,
                                    border: `1.5px solid ${pointColors[p.status].border}`,
                                    textAlign: 'center',
                                    cursor: 'default',
                                }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 600, color: pointColors[p.status].text, lineHeight: 1.2 }}>{p.name}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* Top Services */}
                    <SectionCard>
                        <SectionTitle>Top Services Today</SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {DUMMY_SERVICES.map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', minWidth: 130, flexShrink: 0 }}>{s.name}</span>
                                    <div style={{ flex: 1, height: 8, background: 'var(--hover-bg)', borderRadius: 99, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(s.count / maxService) * 100}%`,
                                            background: i === 0 ? 'var(--primary-color)' : 'var(--info-color)',
                                            borderRadius: 99,
                                            opacity: 1 - i * 0.1,
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', width: 24, textAlign: 'right', flexShrink: 0 }}>{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

                {/* ── Row 5: Live Queue + Activity Feed ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.25rem' }}>

                    {/* Live Queue */}
                    <SectionCard>
                        <SectionTitle>Live Queue — Currently Serving</SectionTitle>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        {['Job', 'Point', 'Customer', 'Services', 'Started', 'Ends'].map(h => (
                                            <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DUMMY_QUEUE.map((job, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: job.overdue ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                                            <td style={{ padding: '0.55rem 0.6rem', fontWeight: 700, color: job.overdue ? '#ef4444' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                #{job.jobId} {job.overdue && <span style={{ fontSize: '0.68rem', background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>OVERDUE</span>}
                                            </td>
                                            <td style={{ padding: '0.55rem 0.6rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{job.servicePoint}</td>
                                            <td style={{ padding: '0.55rem 0.6rem', color: 'var(--text-primary)' }}>{job.customer}</td>
                                            <td style={{ padding: '0.55rem 0.6rem', color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.services}</td>
                                            <td style={{ padding: '0.55rem 0.6rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{job.startedTime}</td>
                                            <td style={{ padding: '0.55rem 0.6rem', color: job.overdue ? '#ef4444' : 'var(--text-primary)', fontWeight: job.overdue ? 700 : 400, whiteSpace: 'nowrap' }}>{job.endTime}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>

                    {/* Recent Activity Feed */}
                    <SectionCard>
                        <SectionTitle>Recent Activity</SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {DUMMY_ACTIVITY.map((a, i) => (
                                <div key={a.id} style={{
                                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                    paddingBottom: i < DUMMY_ACTIVITY.length - 1 ? '0.75rem' : 0,
                                    marginBottom: i < DUMMY_ACTIVITY.length - 1 ? '0.75rem' : 0,
                                    borderBottom: i < DUMMY_ACTIVITY.length - 1 ? '1px solid var(--border-color)' : 'none',
                                }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 5, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.message}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{a.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

            </div>
        </div>
    );
};

export default NewDashboard;
