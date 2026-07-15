import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    Clock,
    ClockAlert,
    User,
    MapPin,
    CheckCircle2,
    AlertCircle,
    DollarSign,
    Truck,
    Package,
    Settings,
    Clock4,
    BadgeCheck
} from 'lucide-react';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    timelineItemClasses
} from '@mui/lab';
import { Typography, Box, CircularProgress, Skeleton } from '@mui/material';
import '../App.css';
import { getJobDetails } from '../services/jobService';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-toastify';

/**
 * Map SubJobDetails.status (integer) to a human-readable label.
 * Adjust values to match your backend enum.
 */
const subStatusLabel = (status) => {
    switch (status) {
        case 0: return 'Pending';
        case 1: return 'In Progress';
        case 2: return 'Completed';
        case 3: return 'Cancelled';
        default: return `Status ${status}`;
    }
};

/** Format a LocalTime string (HH:mm:ss or HH:mm) to HH:mm display. */
const formatTime = (t) => {
    if (!t) return '-';
    if (String(t).includes('AM') || String(t).includes('PM')) return t;
    return t.substring(0, 5); // "HH:mm"
};

const JobDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getJobDetails(id);
                setJob(data);
            } catch (err) {
                if (err?.response?.data?.data) {
                    if (err?.response?.data?.code === 1) {
                        toast.info("Session expired. Please login again.");
                        navigate('/login');
                    } else {
                        toast.error(err?.response?.data?.data);
                        navigate('/jobs');
                    }
                } else {
                    toast.error('Network error');
                }
                setError(err.message || 'Failed to load job details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'var(--success-color)';
            case 'In Progress':
            case 'Serving': return 'var(--primary-color)';
            case 'Pending': return 'var(--warning-color)';
            case 'Cancelled': return 'var(--danger-color)';
            default: return 'var(--text-secondary)';
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="page-header job-page-header">
                    <div className="job-page-header-content">
                        <Skeleton variant="circular" width={40} height={40} />
                        <div>
                            <Skeleton variant="text" width={200} height={32} />
                            <Skeleton variant="text" width={100} height={20} />
                        </div>
                    </div>
                    <Skeleton variant="rounded" width={100} height={32} sx={{ borderRadius: 20 }} />
                </div>

                <div className="job-details-page-grid" style={{ marginTop: '1.5rem' }}>
                    <div className="left-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="content-card" style={{ padding: '1.5rem' }}>
                            <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                            <div className="job-service-info-grid">
                                {Array.from(new Array(6)).map((_, i) => (
                                    <div key={i} className="info-group">
                                        <Skeleton variant="text" width={80} height={16} />
                                        <Skeleton variant="text" width={120} height={24} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="content-card" style={{ padding: '1.5rem' }}>
                            <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                            {Array.from(new Array(3)).map((_, i) => (
                                <Skeleton key={i} variant="rounded" width="100%" height={60} sx={{ mb: 1, borderRadius: 2 }} />
                            ))}
                        </div>
                    </div>

                    <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="content-card" style={{ padding: '1.5rem' }}>
                            <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                            {Array.from(new Array(3)).map((_, i) => (
                                <Skeleton key={i} variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                            ))}
                        </div>
                        <div className="content-card" style={{ padding: '1.5rem' }}>
                            <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
                            {Array.from(new Array(4)).map((_, i) => (
                                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Skeleton variant="text" width={80} height={20} />
                                    <Skeleton variant="text" width={60} height={20} />
                                </Box>
                            ))}
                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                                <Skeleton variant="text" width={60} height={24} />
                                <Skeleton variant="text" width={80} height={24} />
                            </Box>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="page-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)', padding: '2rem' }}>
                    <AlertCircle size={20} />
                    <p>{error || 'Job not found.'}</p>
                </div>
            </div>
        );
    }

    const timeline = job.timeline || [];

    return (
        <div className="page-container">
            <div className="page-header job-detail-header" style={{ gap: '1rem' }}>
                <div className="job-page-header-content">
                    <button
                        className="icon-action-btn"
                        onClick={() => {
                            if (location.state && location.state.fromStatusModal) {
                                navigate('/dashboard', {
                                    state: {
                                        openStatusModal: true,
                                        returnStatus: location.state.returnStatus,
                                        selectedJobId: id
                                    }
                                });
                            } else {
                                navigate('/jobs', {
                                    state: {
                                        selectedJobId: id,
                                        selectedCenter: location.state?.selectedCenter,
                                        selectedDate: location.state?.selectedDate,
                                        viewMode: location.state?.viewMode
                                    }
                                });
                            }
                        }}
                        style={{ background: 'var(--hover-bg)', width: '40px', height: '40px', borderRadius: '12px' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                                Job Details
                                {job.verifiedJob && (
                                    <Tooltip title="Payment Verified" arrow placement="top">
                                        <BadgeCheck size={22} fill="var(--primary-color)" color="var(--bg-color)" />
                                    </Tooltip>
                                )}
                            </h3>
                            <p className="subtitle" style={{ margin: 0, fontSize: '0.9rem' }}><span style={{ color: 'var(--primary-color)', fontWeight: '600' }}> JOB - {id}</span></p>
                        </div>
                    </div>
                </div>
                <div className="header-actions" style={{ marginLeft: 'auto' }}>
                    {job.verifiedJob ? (
                        <span style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '20px',
                            background: `${getStatusColor(job.status)}15`,
                            color: getStatusColor(job.status),
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            border: `1px solid ${getStatusColor(job.status)}30`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(job.status) }} />
                            {job.status}
                        </span>
                    ) : (
                        <span style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '20px',
                            background: `var(--danger-color)`,
                            color: "var(--bg-color)",
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            border: `1px solid var(--danger-color)`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <Clock size={14} />
                            Verifying
                        </span>
                    )}
                </div>
            </div>

            <div className="job-details-page-grid">
                <div className="left-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Service Information */}
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} style={{ color: 'var(--text-secondary)' }} />
                            Service Information
                        </h4>
                        <div className="job-service-info-grid">
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase' }}>Service Type</label>
                                <p style={{ fontWeight: '600' }}>{job.serviceName || '-'}</p>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase' }}>Service Point</label>
                                <p style={{ fontWeight: '600' }}>{job.pointName || '-'}</p>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase' }}>Service Center</label>
                                <p style={{ fontWeight: '600' }}>{job.centerName || '-'}</p>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase' }}>Created Date</label>
                                <p style={{ fontWeight: '600' }}>{job.createdAt || '-'}</p>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase' }}>Appointment Method</label>
                                <p className="text-primary" style={{ fontWeight: '600' }}>{job.appointmentMethod || '-'}</p>
                            </div>
                            <div className="info-group">
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase' }}>Service Time</label>
                                <p style={{ fontWeight: '600' }}>{job.serviceTime || '-'}</p>
                            </div>
                            {job.customerArrivedTime && (
                                <div className="info-group">
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase' }}>Customer Arrived</label>
                                    <p style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckCircle2 size={14} style={{ color: 'var(--primary-color)' }} />
                                        {job.customerArrivedTime}
                                    </p>
                                </div>
                            )}
                        </div>
                        {job.description && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--hover-bg)', borderRadius: '8px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500', textTransform: 'uppercase' }}>Observations / Notes</label>
                                <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>{job.description}</p>
                            </div>
                        )}
                    </div>

                    {/* MUI Timeline — SubJobDetails */}
                    <div className="content-card job-timeline-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock4 size={18} style={{ color: 'var(--text-secondary)' }} />
                            Service Timeline
                        </h4>

                        {timeline.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No timeline data available.</p>
                        ) : (
                            <Timeline
                                sx={{
                                    [`& .${timelineItemClasses.root}:before`]: {
                                        flex: 0,
                                        padding: 0,
                                    },
                                    padding: { xs: '0 0.5rem', sm: 0 },
                                    margin: 0
                                }}
                            >
                                {timeline.map((step, index) => {
                                    const isLast = index === timeline.length - 1;

                                    // startTime / endTime are the scheduled (estimated) times
                                    const timeRange = step.startTime
                                        ? `${formatTime(step.startTime)}${step.endTime ? ` – ${formatTime(step.endTime)}` : ''}`
                                        : '-';

                                    return (
                                        <TimelineItem key={index} sx={{ minHeight: '80px' }}>
                                            <TimelineSeparator>
                                                <TimelineDot
                                                    variant="outlined"
                                                    sx={{
                                                        bgcolor: step.completed ? 'var(--primary-color)' : 'transparent',
                                                        borderColor: step.completed
                                                            ? 'var(--primary-color)'
                                                            : step.status === 1
                                                                ? 'var(--primary-color)'
                                                                : 'var(--border-color)',
                                                        borderWidth: step.status === 1 ? '2px' : '1px',
                                                        margin: '4px 0',
                                                        padding: '4px',
                                                        boxShadow: 'none'
                                                    }}
                                                />
                                                {!isLast && (
                                                    <TimelineConnector
                                                        sx={{
                                                            bgcolor: step.completed ? 'var(--primary-color)' : 'var(--border-color)',
                                                            width: '1px'
                                                        }}
                                                    />
                                                )}
                                            </TimelineSeparator>
                                            <TimelineContent sx={{ py: '0', px: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
                                                    <Typography variant="subtitle2" sx={{
                                                        fontWeight: 700,
                                                        color: step.completed ? 'var(--text-main)' : 'var(--text-secondary)',
                                                        fontSize: '0.95rem'
                                                    }}>
                                                        {step.service}
                                                        {step.pointName && (
                                                            <span className={job.status === 'Timeout' ? 'commit-badge-count-disabled' : 'commit-badge-count'} style={{ marginLeft: '8px', verticalAlign: 'middle', fontSize: '0.7rem' }}>
                                                                {step.pointName}
                                                            </span>
                                                        )}
                                                    </Typography>
                                                    <Typography sx={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-secondary)',
                                                        bgcolor: 'var(--hover-bg)',
                                                        px: 1,
                                                        py: 0.2,
                                                        borderRadius: '4px',
                                                        fontWeight: 600
                                                    }}>
                                                        {timeRange}
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-secondary)',
                                                    lineHeight: 1.4,
                                                    opacity: step.completed ? 1 : 0.7,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    {step.status === 1 ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '2px 8px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            background: 'var(--primary-bg)',
                                                            color: 'var(--primary-color)',
                                                            border: '1px solid var(--primary-color)'
                                                        }}>
                                                            ● In Progress
                                                        </span>
                                                    ) : (
                                                        subStatusLabel(step.status)
                                                    )}
                                                    {step.estimatedEndTime && (
                                                        <span style={{ marginLeft: '2px', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>· end time estimated</span>
                                                    )}
                                                </Typography>
                                                {(step.actualStartTime || step.actualEndTime || step.agent) && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', mt: 0.75 }}>
                                                        {step.actualStartTime && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.73rem', color: 'var(--text-secondary)', background: 'var(--hover-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                                                                <Clock size={11} />
                                                                Started {step.actualStartTime}
                                                            </span>
                                                        )}
                                                        {step.actualEndTime && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.73rem', color: 'var(--text-secondary)', background: 'var(--hover-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                                                                <Clock size={11} />
                                                                Ended {step.actualEndTime}
                                                            </span>
                                                        )}
                                                        {step.agent && (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.73rem', color: 'var(--text-secondary)', background: 'var(--hover-bg)', padding: '2px 8px', borderRadius: '4px' }}>
                                                                <User size={11} />
                                                                {step.agent}
                                                            </span>
                                                        )}
                                                    </Box>
                                                )}
                                            </TimelineContent>
                                        </TimelineItem>
                                    );
                                })}
                            </Timeline>
                        )}
                    </div>
                </div>

                <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Customer Card */}
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} style={{ color: 'var(--text-secondary)' }} />
                            Customer Details - {job.customer || ''}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <p style={{ fontWeight: '600', marginBottom: '2px' }}>{job.customerName || ''}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{job.customerPhone || ''}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{job.customerEmail || ''}</p>
                            </div>
                            {/* <button className="secondary-btn" style={{ width: '100%', justifyContent: 'center' }}>
                                Contact Customer
                            </button> */}
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="content-card" style={{ padding: '1.5rem', background: job.status === 'Timeout' ? 'rgba(31, 136, 61, 0.1)' : 'var(--primary-color)', color: job.status === 'Timeout' ? 'var(--text-primary)' : 'white' }}>
                        <h4 style={{ marginBottom: '1.2rem', color: job.status === 'Timeout' ? 'var(--text-secondary)' : 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* <DollarSign size={18} /> */}
                            Payment Status
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>Total Amount</span>
                                <span style={{ fontWeight: '600' }}>{(job.totalAmount ?? 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>Paid Amount</span>
                                <span style={{ fontWeight: '600' }}>{(job.paidAmount ?? 0).toLocaleString()}</span>
                            </div>
                            {/* <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span>Service Fee</span>
                                <span className='text-danger' style={{ fontWeight: '600' }}>- {(job.serviceFee ?? 0).toLocaleString()}</span>
                            </div> */}
                            <div style={{
                                marginTop: '0.5rem',
                                paddingTop: '0.8rem',
                                borderTop: job.status === 'Timeout' ? '1px solid var(--border-color)' : '1px solid rgba(255,255,255,0.2)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontWeight: '700',
                                fontSize: '1rem'
                            }}>
                                <span>Balance</span>
                                <span>Rs. {((job.totalAmount ?? 0) - (job.paidAmount ?? 0)).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetail;
