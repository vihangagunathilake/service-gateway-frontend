import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, RefreshCw, Timer } from 'lucide-react';
import { getAgentPointJobs, startServingJob, getAgentPointJobsInfo } from '../services/jobService';
import { toast } from 'react-toastify';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';

/** Parses a 12-hour time string like "09:25 AM" into today's Date */
const parseTimeToday = (timeStr) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
};

/** Formats seconds into a human-readable string: "2h 15m", "8m 30s", "45s" */
const formatDuration = (totalSeconds) => {
    const abs = Math.abs(totalSeconds);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};

/** Live countdown for a single serving job */
const JobCountdown = ({ endTime }) => {
    const endDate = parseTimeToday(endTime);
    const [elapsed, setElapsed] = useState(() =>
        endDate ? Math.floor((Date.now() - endDate) / 1000) : null
    );

    useEffect(() => {
        if (!endDate) return;
        const tick = () => setElapsed(Math.floor((Date.now() - endDate) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endTime]); // eslint-disable-line react-hooks/exhaustive-deps

    if (elapsed === null) return null;

    // elapsed is negative while time remains (currentTime - endTime)
    const remainingSec = -elapsed; // positive = seconds still left
    const overdue = elapsed >= 0;

    let color;
    if (overdue || remainingSec < 180) {
        color = 'var(--danger-color, #dc2626)';      // overdue OR < 3 min
    } else if (remainingSec < 600) {
        color = 'var(--warning-color, #d97706)';     // < 10 min
    } else {
        color = 'var(--text-primary-g)';             // plenty of time
    }

    const bold = overdue || remainingSec < 180;
    const label = overdue
        ? `+${formatDuration(elapsed)}`
        : `${formatDuration(elapsed)}`;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', color, fontWeight: bold ? 700 : 500 }}>
            <span>{label}</span>
        </div>
    );
};

const MyJobs = () => {
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobsInfo, setJobsInfo] = useState({ completed: 0, pending: 0, completedRate: 0 });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const pointId = localStorage.getItem('servicePointId');
            const [data, info] = await Promise.all([
                getAgentPointJobs(pointId),
                getAgentPointJobsInfo(pointId),
            ]);
            // Normalise jobs to array
            if (!data) {
                setJobs([]);
            } else if (Array.isArray(data)) {
                setJobs(data);
            } else {
                setJobs([data]);
            }
            if (info) setJobsInfo(info);
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        } finally {
            setLoading(false);
        }
    };

    // keep fetchJobs for re-fetching after actions
    const fetchJobs = async () => {
        try {
            const pointId = localStorage.getItem('servicePointId');
            const [data, info] = await Promise.all([
                getAgentPointJobs(pointId),
                getAgentPointJobsInfo(pointId),
            ]);
            if (!data) {
                setJobs([]);
            } else if (Array.isArray(data)) {
                setJobs(data);
            } else {
                setJobs([data]);
            }
            if (info) setJobsInfo(info);
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 0: return 'pending';
            case 1: return 'serving';
            case 2: return 'completed';
            default: return 'pending';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={13} />;
            case 'serving': return <RefreshCw size={13} style={{ animation: 'spin 4s linear infinite' }} />;
            case 'pending': return <AlertCircle size={13} />;
            default: return null;
        }
    };

    const statusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'serving': return 'Serving';
            case 'completed': return 'Completed';
            default: return status;
        }
    };

    const formatServices = (services) => {
        const list = Array.isArray(services)
            ? services
            : (services || '').split(',').map(s => s.trim()).filter(Boolean);
        if (list.length === 0) return '--';
        const visible = list.slice(0, 3).join(', ');
        return list.length > 3 ? `${visible}, ...` : visible;
    };

    const handleServing = async (job) => {
        try {
            const pointId = parseInt(localStorage.getItem('servicePointId'));
            await startServingJob(pointId, job.jobId);
            await fetchJobs();
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        }
    };

    const renderActionButton = (job, status, { isServing, isFirstPending }) => {
        if (status === 'completed') {
            return (
                <button
                    className="secondary-btn"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => { }}
                >
                    View
                </button>
            );
        }
        if (status === 'serving') {
            return (
                <button
                    className="primary-btn"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => handleServing(job)}
                >
                    End
                </button>
            );
        }
        if (status === 'pending' && !isServing && isFirstPending) {
            return (
                <button
                    className="primary-btn"
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => handleServing(job)}
                >
                    Start Serving
                </button>
            );
        }
        return null;
    };

    const renderSkeletons = () =>
        Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={cardStyle}>
                <div style={{ height: 14, width: '40%', background: 'var(--border-color)', borderRadius: 4, marginBottom: 10 }} />
                <div style={{ height: 12, width: '70%', background: 'var(--border-color)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: '55%', background: 'var(--border-color)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 12, width: '45%', background: 'var(--border-color)', borderRadius: 4 }} />
            </div>
        ));

    const cardStyle = {
        background: 'var(--modal-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '0.875rem',
        padding: '1.25rem 1.5rem',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'box-shadow 0.2s',
    };

    const rowStyle = { display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' };
    const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, minWidth: 80, paddingTop: 2 };
    const valueStyle = { color: 'var(--text-primary)', fontSize: '0.9rem' };

    const completionPct = jobsInfo.completedRate ?? 0;

    const statItems = [
        { label: 'Completed', value: jobsInfo.completed ?? 0, color: 'var(--text-primary)', bg: 'var(--border-color)' },
        { label: 'Pending', value: jobsInfo.pending ?? 0, color: '#ffffff', bg: '#1a7f37' }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>My Jobs</h3>
                    <p className="subtitle">Track your jobs for today.</p>
                </div>
            </div>

            {/* Summary toolbar */}
            {!loading && (
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    background: 'var(--modal-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    boxShadow: 'var(--card-shadow)',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                }}>
                    {statItems.map(({ label, value, color, bg }) => (
                        <div key={label} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.3rem 0.85rem',
                            borderRadius: '999px',
                            background: bg,
                            minWidth: 90,
                        }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</span>
                            <span style={{ fontSize: '0.75rem', color, opacity: 0.85, fontWeight: 500 }}>{label}</span>
                        </div>
                    ))}

                    {/* Completion percentage — header text, pushed to the right */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                        <Tooltip title="Completed jobs which are completed before it's end time as a percentage." arrow placement="top">
                            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                                {completionPct}%
                            </span>
                        </Tooltip>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}></span>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {renderSkeletons()}
                </div>
            ) : jobs.length === 0 ? (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '4rem 2rem', color: 'var(--text-secondary)', gap: '0.75rem'
                }}>
                    <ClipboardList size={40} strokeWidth={1.5} />
                    <p>No jobs assigned for today.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {(() => {
                        const isServing = jobs.some(j => getStatusLabel(j.status) === 'serving');
                        const firstPendingId = jobs.find(j => getStatusLabel(j.status) === 'pending')?.jobId;
                        return jobs.map((job) => {
                            const status = getStatusLabel(job.status);
                            const actionBtn = renderActionButton(job, status, {
                                isServing,
                                isFirstPending: job.jobId === firstPendingId,
                            });
                            return (
                                <div key={job.jobId} style={cardStyle}>

                                    {/* Header: Job ID + Status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                            JOB-{job.jobId}
                                        </span>
                                        <span className={`status-badge-pill ${status}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            {getStatusIcon(status)}
                                            {statusLabel(status)}
                                        </span>
                                    </div>

                                    {/* Customer */}
                                    <div style={rowStyle}>
                                        <span style={labelStyle}>Customer</span>
                                        {job.status === 0
                                            ? <span style={{ color: 'var(--text-primary-g)', fontStyle: 'italic' }}>Start serving to show details</span>
                                            : <span style={{ ...valueStyle, fontWeight: 500 }}>{job.customer || job.customerMobile || '--'}</span>
                                        }
                                    </div>

                                    {/* Mobile */}
                                    {job.status !== 0 && (
                                        <div style={rowStyle}>
                                            <span style={labelStyle}>Mobile</span>
                                            <span style={valueStyle}>{job.customerMobile || '--'}</span>
                                        </div>
                                    )}

                                    {/* Services — timeline */}
                                    {(() => {
                                        const list = Array.isArray(job.services)
                                            ? job.services
                                            : (job.services || '').split(',').map(s => s.trim()).filter(Boolean);
                                        if (list.length === 0) return null;
                                        return (
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                <span style={labelStyle}>Services</span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                                    {list.map((svc, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                            {/* Timeline track */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
                                                                <div style={{
                                                                    width: 8, height: 8, borderRadius: '50%',
                                                                    background: 'var(--primary-color)',
                                                                    marginTop: 5, flexShrink: 0,
                                                                }} />
                                                                {idx < list.length - 1 && (
                                                                    <div style={{ width: 2, flex: 1, minHeight: 14, background: 'var(--border-color)', marginTop: 2 }} />
                                                                )}
                                                            </div>
                                                            <span style={{ ...valueStyle, paddingTop: 2, paddingBottom: idx < list.length - 1 ? 8 : 0 }}>{svc}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Time */}
                                    <div style={rowStyle}>
                                        <span style={labelStyle}>Time</span>
                                        <span style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Clock size={12} />
                                            {job.startTime || '--'} – {job.endTime || '--'}
                                        </span>
                                    </div>

                                    {/* Started Time + Countdown — shown only when serving (status === 1) */}
                                    {job.status === 1 && job.startedTime && (
                                        <div style={rowStyle}>
                                            <span style={labelStyle}>Started</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={12} />
                                                    {job.startedTime}
                                                </span>
                                                {job.endTime && <JobCountdown endTime={job.endTime} />}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action button */}
                                    {actionBtn && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            {actionBtn}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })()}
                </div>
            )}
        </div>
    );
};

export default MyJobs;
