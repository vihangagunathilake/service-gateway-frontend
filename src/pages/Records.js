import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAgentRecordsByDate } from '../services/jobService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../App.css';

const today = () => new Date().toISOString().split('T')[0];

const formatTime = (time) => {
    if (!time) return '--';
    // "HH:mm:ss" → "HH:mm"  or already "HH:mm:ss.xxx"
    return String(time).substring(0, 5);
};

const rateColor = (rate) => {
    if (rate === null || rate === undefined) return 'var(--text-secondary)';
    if (rate >= 90) return 'var(--success-color, #10b981)';
    if (rate >= 70) return 'var(--warning-color, #d97706)';
    return 'var(--danger-color, #ef4444)';
};

const Records = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(today());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRecords(selectedDate);
    }, [selectedDate]);

    const fetchRecords = async (date) => {
        try {
            setLoading(true);
            const data = await getAgentRecordsByDate(date);
            setRecords(Array.isArray(data) ? data : data ? [data] : []);
        } catch (error) {
            if (error?.response?.data?.code === 1) {
                toast.info('Session expired. Please login again.');
                navigate('/login');
            } else {
                toast.error(error?.response?.data?.data || 'Failed to load records');
            }
        } finally {
            setLoading(false);
        }
    };

    const renderSkeletons = () =>
        Array.from({ length: 4 }).map((_, i) => (
            <tr key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ height: 12, width: j === 0 ? '60%' : '80%', background: 'var(--border-color)', borderRadius: 4 }} />
                    </td>
                ))}
            </tr>
        ));

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>Records</h3>
                    <p className="subtitle">Access your past job records.</p>
                </div>
                {/* Date Picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                    <input
                        type="date"
                        value={selectedDate}
                        max={today()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--border-color)',
                            background: 'var(--modal-bg)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{
                background: 'var(--modal-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.875rem',
                boxShadow: 'var(--card-shadow)',
                overflow: 'hidden',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--hover-bg)' }}>
                                {['Job', 'Customer', 'Mobile', 'Service', 'Date', 'Service Point', 'Started', 'Ended', 'Expected Start', 'Expected End', 'Rate'].map(h => (
                                    <th key={h} style={{
                                        padding: '0.75rem 1rem',
                                        textAlign: 'left',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        color: 'var(--text-secondary)',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                renderSkeletons()
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={11} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <History size={32} strokeWidth={1.5} />
                                            <span>No records found for {selectedDate}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                records.map((rec, i) => {
                                    const rate = rec.durationRate;
                                    return (
                                        <tr key={i} style={{
                                            borderBottom: i < records.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            transition: 'background 0.15s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {/* Job ID */}
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                {rec.jobId ? `#${rec.jobId}` : '--'}
                                            </td>

                                            {/* Customer */}
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                {rec.customer || '--'}
                                            </td>

                                            {/* Mobile */}
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {rec.customerMobile || '--'}
                                            </td>

                                            {/* Service */}
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {rec.service || '--'}
                                            </td>

                                            {/* Date */}
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                {rec.addedDate || '--'}
                                            </td>

                                            {/* Service Point */}
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                                {rec.servicePointName || '--'}
                                            </td>

                                            {/* Started */}
                                            <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-primary)' }}>
                                                    <Clock size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                                    {formatTime(rec.startedTime)}
                                                </span>
                                            </td>

                                            {/* Ended */}
                                            <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: rec.endedTime ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                    <Clock size={12} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                                    {rec.endedTime ? formatTime(rec.endedTime) : <span style={{ fontStyle: 'italic', fontSize: '0.78rem' }}>In progress</span>}
                                                </span>
                                            </td>

                                            {/* Expected Start */}
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {formatTime(rec.expectedStartTime)}
                                            </td>

                                            {/* Expected End */}
                                            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {formatTime(rec.expectedEndTime)}
                                            </td>

                                            {/* Duration Rate */}
                                            <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                                                {rate !== null && rate !== undefined ? (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                        fontWeight: 700, color: rateColor(rate),
                                                        background: `${rateColor(rate)}18`,
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: 999,
                                                        fontSize: '0.78rem',
                                                    }}>
                                                        {rate >= 70
                                                            ? <CheckCircle2 size={11} />
                                                            : <AlertCircle size={11} />
                                                        }
                                                        {rate.toFixed(1)}%
                                                    </span>
                                                ) : '--'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer summary */}
                {!loading && records.length > 0 && (
                    <div style={{
                        padding: '0.65rem 1rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--hover-bg)',
                    }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {records.length} record{records.length !== 1 ? 's' : ''} for {selectedDate}
                        </span>
                        {records.some(r => r.durationRate !== null && r.durationRate !== undefined) && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                Avg rate:{' '}
                                <strong style={{ color: rateColor(records.reduce((s, r) => s + (r.durationRate || 0), 0) / records.filter(r => r.durationRate != null).length) }}>
                                    {(records.reduce((s, r) => s + (r.durationRate || 0), 0) / records.filter(r => r.durationRate != null).length).toFixed(1)}%
                                </strong>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Records;
