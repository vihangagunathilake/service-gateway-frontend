import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ClipboardList, Clock, CheckCircle2, AlertCircle, Eye, MoreVertical, Plus, Building, Calendar } from 'lucide-react';
import { getServiceCenterDropdown, getServicePointsByCenterId } from '../services/serviceProviderService';
import { getJobSchedule } from '../services/jobService';
import CreateJobModal from '../components/CreateJobModal';
import '../App.css';
import { toast } from 'react-toastify';
import Tooltip from '@mui/material/Tooltip';
import { Skeleton, Box } from '@mui/material';

import { useUser } from '../context/UserContext';

const Jobs = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCenter, setSelectedCenter] = useState(location.state?.selectedCenter || ''); // Stores center ID
    const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate || new Date().toISOString().split('T')[0]);
    const [centers, setCenters] = useState([]);
    const [servicePoints, setServicePoints] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [jobsList, setJobsList] = useState([]);
    const [isLoadingPoints, setIsLoadingPoints] = useState(false);
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [isLoadingCenters, setIsLoadingCenters] = useState(true);
    const [highlightedJobId, setHighlightedJobId] = useState(null);

    const { hasPermissionAccess } = useUser();

    const canAddJobs = () =>
        hasPermissionAccess(
            'Jobs Management',
            'adding'
        );

    const canPaymentVerify = () =>
        hasPermissionAccess(
            'Payments Verifier',
            'adding'
        );

    const allowAddJobs = canAddJobs();
    const allowPaymentVerify = canPaymentVerify();

    React.useEffect(() => {
        const fetchCenters = async () => {
            setIsLoadingCenters(true);
            try {
                const data = await getServiceCenterDropdown();
                setCenters(data || []);
                if (data && data.length > 0 && !selectedCenter) {
                    setSelectedCenter(data[0].id.toString());
                }
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
                setIsLoadingCenters(false);
            }
        };
        fetchCenters();
    }, []);

    const fetchJobSchedule = async () => {
        if (!selectedCenter || !selectedDate) {
            setJobsList([]);
            return;
        }
        setIsLoadingJobs(true);
        try {
            const data = await getJobSchedule(parseInt(selectedCenter), selectedDate);
            setJobsList(data || []);
        } catch (error) {
            console.error('Failed to fetch job schedule:', error);
            // toast.error('Failed to load jobs');
        } finally {
            setIsLoadingJobs(false);
        }
    };

    React.useEffect(() => {
        const fetchServicePoints = async () => {
            if (!selectedCenter) {
                setServicePoints([]);
                return;
            }
            setIsLoadingPoints(true);
            try {
                const data = await getServicePointsByCenterId(selectedCenter);
                setServicePoints(data || []);
            } catch (error) {
                console.error('Failed to fetch service points:', error);
                toast.error('Failed to load service points');
            } finally {
                setIsLoadingPoints(false);
            }
        };
        fetchServicePoints();
    }, [selectedCenter]);

    React.useEffect(() => {
        fetchJobSchedule();
    }, [selectedCenter, selectedDate]);



    const handleJobCreated = (newJob) => {
        fetchJobSchedule();
    };

    const handleHighlight = (e, jobId) => {
        e.stopPropagation();
        setHighlightedJobId(highlightedJobId === jobId ? null : jobId);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return { background: 'var(--success-bg)', color: 'var(--success-color)' };
            case 'In Progress': return { background: 'var(--info-bg)', color: 'var(--info-color)' };
            case 'Pending': return { background: 'var(--warning-bg)', color: 'var(--warning-color)' };
            case 'Cancelled': return { background: 'var(--danger-bg)', color: 'var(--danger-color)' };
            default: return { background: 'var(--hover-bg)', color: 'var(--text-secondary)' };
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <CheckCircle2 size={12} />;
            case 'serving': return <Clock size={12} />;
            case 'pending': return <AlertCircle size={12} />;
            default: return null;
        }
    };

    const filteredJobs = jobsList.filter(job => {
        if (job.freeSlot) return true;

        const matchesSearch = (job.id?.toString() || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (job.serviceName || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    const selectedJobId = location.state?.selectedJobId;

    const getJobsForPoint = (pointName) => {
        const pointJobs = filteredJobs.filter(job => job.pointName === pointName);
        if (pointJobs.length === 0) return [];

        const grouped = [];
        let currentGroup = null;

        pointJobs.forEach(job => {
            if (job.freeSlot) {
                if (currentGroup) {
                    grouped.push(currentGroup);
                    currentGroup = null;
                }
                grouped.push(job);
            } else {
                if (currentGroup && currentGroup.jobId === job.jobId) {
                    // Merge with current group
                    currentGroup.totalTime += job.totalTime;
                    // Combine time ranges (assuming they are sequential)
                    const [currentStart] = currentGroup.fromTo.split(' - ');
                    const [, nextEnd] = job.fromTo.split(' - ');
                    currentGroup.fromTo = `${currentStart} - ${nextEnd}`;
                } else {
                    if (currentGroup) {
                        grouped.push(currentGroup);
                    }
                    currentGroup = { ...job };
                }
            }
        });

        if (currentGroup) {
            grouped.push(currentGroup);
        }

        return grouped;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>Jobs Management</h3>
                    <p className="subtitle">Track and manage all service requests</p>
                </div>
                <div className="header-actions">
                    {allowAddJobs ? <button className="primary-btn" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={18} />
                        <span>Create Job</span>
                    </button> :
                        <button className="primary-btn-disabled" onClick={() => toast.warn("Required Jobs Add Permission")}>
                            <Plus size={18} />
                            <span>Create Job</span>
                        </button>}

                </div>
            </div>

            <div className="content-card">
                {isLoadingCenters ? (
                    <div className="table-toolbar">
                        <div className="toolbar-filters" style={{ width: '100%', display: 'flex', gap: '1rem', padding: '0.5rem 0', flexWrap: 'wrap' }}>
                            <Skeleton variant="rounded" sx={{ flex: '1 1 200px', height: 42, borderRadius: 2 }} animation="wave" />
                            <Skeleton variant="rounded" sx={{ flex: '1 1 150px', maxWidth: { sm: '250px' }, height: 42, borderRadius: 2 }} animation="wave" />
                            <Skeleton variant="rounded" sx={{ flex: '1 1 120px', maxWidth: { sm: '200px' }, height: 42, borderRadius: 2 }} animation="wave" />
                        </div>
                    </div>
                ) : (
                    <div className="table-toolbar">
                        <div className="toolbar-filters">
                            <div className="search-bar-wrapper">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, customer, service..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-control search-input"
                                />
                            </div>
                            <div className="filter-select-wrapper center-filter">
                                <Building size={18} className="filter-icon" />
                                <select
                                    value={selectedCenter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedCenter(val);
                                        navigate(location.pathname, { replace: true, state: { ...location.state, selectedCenter: val, selectedDate } });
                                    }}
                                    className="form-control filter-select"
                                >
                                    {centers.map(center => (
                                        <option key={center.id} value={center.id}>{center.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter-select-wrapper date-filter">
                                <Calendar size={18} className="filter-icon" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedDate(val);
                                        navigate(location.pathname, { replace: true, state: { ...location.state, selectedCenter, selectedDate: val } });
                                    }}
                                    className="form-control filter-date"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="kanban-board">
                    {isLoadingPoints || isLoadingJobs ? (
                        <Box sx={{ display: 'flex', gap: '1rem', width: '100%', overflowX: 'hidden', padding: '0.5rem' }}>
                            {Array.from(new Array(4)).map((_, i) => (
                                <div key={i} className="kanban-column" style={{ minWidth: '280px', flex: '1 1 auto' }}>
                                    <div className="kanban-column-header">
                                        <div className="kanban-column-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Skeleton variant="circular" width={16} height={16} />
                                            <Skeleton variant="text" width={120} height={20} />
                                        </div>
                                        <Skeleton variant="rounded" width={24} height={24} sx={{ borderRadius: '12px' }} />
                                    </div>
                                    <div className="kanban-cards-container">
                                        {Array.from(new Array(3)).map((_, j) => (
                                            <Skeleton
                                                key={j}
                                                variant="rounded"
                                                height={100}
                                                sx={{ mb: 2, borderRadius: '0.75rem' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </Box>
                    ) : servicePoints.length > 0 ? (
                        servicePoints.map(point => {
                            const pointJobs = getJobsForPoint(point.name);
                            return (
                                <div key={point.id} className="kanban-column">
                                    <div className="kanban-column-header">
                                        <div className="kanban-column-title">
                                            <Building size={16} className="kanban-column-icon" />
                                            <span>{point.name}</span>
                                        </div>
                                        <span className="kanban-column-count">{pointJobs.filter(job => !job.freeSlot).length}</span>
                                    </div>
                                    <div className="kanban-cards-container">
                                        {pointJobs.length > 0 ? (
                                            pointJobs.map(job => (
                                                job.freeSlot ? (
                                                    <>
                                                        {job.ignoreThis ? (
                                                            <>
                                                                {/* <div
                                                                    key={`free-${job.fromTo}-${point.id}`}
                                                                    className={`kanban-card kanban-card-ignore`}
                                                                    style={{ height: job.totalTime <= 7 ? '7%' : `${job.totalTime}%` }}
                                                                    aria-disabled="true"
                                                                >
                                                                    <span className="kanban-card-service text-disabled">Slot Ignored</span>
                                                                </div> */}
                                                            </>
                                                        ) : (
                                                            <div
                                                                key={`free-${job.fromTo}-${point.id}`}
                                                                className={`kanban-card kanban-card-free`}
                                                                style={{ height: job.totalTime <= 12 ? '12%' : `${job.totalTime}%` }}
                                                            >
                                                                <span className="kanban-card-service">{job.fromTo}</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <> {job.verified ? (
                                                        <>
                                                            <div
                                                                key={job.jobId}
                                                                className={`kanban-card kanban-card-${job.status.toLowerCase()} ${selectedJobId === job.jobId ? 'selected' : ''} ${highlightedJobId === job.jobId ? 'highlighted' : ''}`}
                                                                onClick={() => navigate(`/jobs/${job.jobId}`, {
                                                                    state: {
                                                                        selectedCenter,
                                                                        selectedDate
                                                                    }
                                                                })}
                                                                style={{ height: job.totalTime <= 12 ? '12%' : `${job.totalTime}%` }}
                                                            >
                                                                {job.totalTime <= 17 ? (
                                                                    <div className="kanban-card-inline">
                                                                        <span
                                                                            className={`kanban-card-id-${job.status.toLowerCase()}`}
                                                                            onClick={(e) => handleHighlight(e, job.jobId)}
                                                                            style={{ cursor: 'pointer' }}
                                                                        >
                                                                            {getStatusIcon(job.status)} JOB - {job.jobId}
                                                                        </span>
                                                                        <span className="kanban-card-customer">
                                                                            {job.customerName}
                                                                        </span>
                                                                        <span className="kanban-card-service">
                                                                            {job.fromTo}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span
                                                                            className={`kanban-card-id-${job.status.toLowerCase()}`}
                                                                            onClick={(e) => handleHighlight(e, job.jobId)}
                                                                            style={{ cursor: 'pointer' }}
                                                                        >
                                                                            {getStatusIcon(job.status)} JOB - {job.jobId}
                                                                        </span>
                                                                        <span className="kanban-card-customer">{job.customerName}</span>
                                                                        <span className="kanban-card-service">{job.fromTo}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Tooltip title="Job is at verification stage" arrow placement="top">
                                                                <div
                                                                    key={job.jobId}
                                                                    className={`kanban-card kanban-card-verifing ${selectedJobId === job.jobId ? 'selected' : ''} ${highlightedJobId === job.jobId ? 'highlighted' : ''}`}
                                                                    onClick={() => navigate(`/jobs/${job.jobId}`, {
                                                                        state: {
                                                                            selectedCenter,
                                                                            selectedDate
                                                                        }
                                                                    })}
                                                                    style={{ height: job.totalTime <= 12 ? '12%' : `${job.totalTime}%` }}
                                                                >
                                                                    {job.totalTime <= 17 ? (
                                                                        <div className="kanban-card-inline">
                                                                            <span
                                                                                className={`kanban-card-id-verifing`}
                                                                                onClick={(e) => handleHighlight(e, job.jobId)}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                {getStatusIcon(job.status)} JOB - {job.jobId}
                                                                            </span>
                                                                            <span className="kanban-card-customer">
                                                                                {job.customerName}
                                                                            </span>
                                                                            <span className="kanban-card-service">
                                                                                {job.fromTo}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <span
                                                                                className={`kanban-card-id-verifing`}
                                                                                onClick={(e) => handleHighlight(e, job.jobId)}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                {getStatusIcon(job.status)} JOB - {job.jobId}
                                                                            </span>
                                                                            <span className="kanban-card-customer">{job.customerName}</span>
                                                                            <span className="kanban-card-service">{job.fromTo}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    </>
                                                )
                                            ))
                                        ) : (
                                            <div className="empty-kanban">
                                                <ClipboardList size={24} opacity={0.5} />
                                                <span>No active jobs</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '3rem 1rem', gap: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            <Building size={48} opacity={0.3} />
                            <p>No service points available for this center</p>
                        </div>
                    )}
                </div>
            </div>

            <CreateJobModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onJobCreated={handleJobCreated}
                allowPaymentVerify={allowPaymentVerify}
            />
        </div>
    );
};

export default Jobs;
