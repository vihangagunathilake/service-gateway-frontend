import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ClipboardList, Clock, CheckCircle2, AlertCircle, Eye, MoreVertical, Plus, Building, Calendar, RefreshCw, List, LayoutGrid, GitCommit } from 'lucide-react';
import { getServiceCenterDropdown, getServicePointsByCenterId } from '../services/serviceProviderService';
import { getJobSchedule, getJobList, allowToServeJob } from '../services/jobService';
import CreateJobModal from '../components/CreateJobModal';
import '../App.css';
import { toast } from 'react-toastify';
import Tooltip from '@mui/material/Tooltip';
import { Skeleton, Box } from '@mui/material';

import { useUser } from '../context/UserContext';

const DUMMY_JOBS = [
    {
        jobId: 101,
        customerName: "Alice Smith",
        serviceName: ["Full Service", "Oil Change"],
        pointName: ["Bay 1", "Bay 2"],
        fromTo: "08:00 AM - 09:30 AM",
        status: "Completed",
        verified: true,
        totalTime: 90
    },
    {
        jobId: 102,
        customerName: "Bob Johnson",
        serviceName: ["Wheel Alignment", "Balancing"],
        pointName: ["Bay 2"],
        fromTo: "09:30 AM - 10:15 AM",
        status: "Serving",
        verified: true,
        totalTime: 45
    },
    {
        jobId: 103,
        customerName: "Charlie Brown",
        serviceName: ["Brake Pad Replacement"],
        pointName: ["Bay 1"],
        fromTo: "10:30 AM - 11:30 AM",
        status: "Pending",
        verified: false,
        totalTime: 60
    },
    {
        jobId: 104,
        customerName: "Diana Prince",
        serviceName: ["Engine Diagnostics"],
        pointName: ["Bay 3", "Bay 1"],
        fromTo: "11:00 AM - 12:00 PM",
        status: "Pending",
        verified: true,
        totalTime: 60
    }
];


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
    const [jobsListData, setJobsListData] = useState([]);
    const [isLoadingPoints, setIsLoadingPoints] = useState(false);
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [isLoadingJobList, setIsLoadingJobList] = useState(false);
    const [isLoadingCenters, setIsLoadingCenters] = useState(true);
    const [highlightedJobId, setHighlightedJobId] = useState(null);
    const [viewMode, setViewMode] = useState(location.state?.viewMode || 'list');


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

    const getStatusLabel = (statusInt) => {
        switch (statusInt) {
            case -1: return 'In Progress';
            case 0: return 'Pending';
            case 1: return 'In Progress';
            case 2: return 'Completed';
            case 3: return 'Cancelled';
            case 5: return 'Timeout';
            default: return `Status ${statusInt}`;
        }
    };

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

    const fetchJobList = async () => {
        if (!selectedCenter || !selectedDate) {
            setJobsListData([]);
            return;
        }
        setIsLoadingJobList(true);
        try {
            const data = await getJobList(parseInt(selectedCenter), selectedDate);
            setJobsListData(data || []);
        } catch (error) {
            console.error('Failed to fetch job list:', error);
        } finally {
            setIsLoadingJobList(false);
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
        fetchJobList();
    }, [selectedCenter, selectedDate]);



    const handleJobCreated = (newJob) => {
        fetchJobSchedule();
        fetchJobList();
    };

    const handleAllowToServe = async (jobId) => {
        try {
            await allowToServeJob(jobId);
            fetchJobList();
        } catch (error) {
            toast.error(error?.response?.data?.data || 'Failed to mark customer as arrived');
        }
    };

    const handleHighlight = (e, jobId) => {
        e.stopPropagation();
        setHighlightedJobId(highlightedJobId === jobId ? null : jobId);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return { background: 'var(--hover-bg)', color: 'var(--text-secondary)' };
            case 'In Progress': return { background: 'var(--info-bg)', color: 'var(--info-color)' };
            case 'Pending': return { background: 'rgba(31, 136, 61, 0.1)', color: 'var(--primary-color)' };
            case 'Cancelled': return { background: 'var(--danger-bg)', color: 'var(--danger-color)' };
            default: return { background: 'var(--hover-bg)', color: 'var(--text-secondary)' };
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return <CheckCircle2 size={12} />;
            case 'serving': return <RefreshCw size={12} className="animate-spin-slow" style={{ animation: 'spin 4s linear infinite' }} />;
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

    const filteredJobList = jobsListData.filter(job => {
        const query = searchQuery.toLowerCase();
        const ptNameStr = Array.isArray(job.points) ? job.points.join(', ') : '';
        const servNameStr = Array.isArray(job.services) ? job.services.join(', ') : (job.service || '');
        const statusStr = getStatusLabel(job.status).toLowerCase();
        return (
            (job.jobId || '').toString().toLowerCase().includes(query) ||
            (job.customerName || '').toLowerCase().includes(query) ||
            servNameStr.toLowerCase().includes(query) ||
            ptNameStr.toLowerCase().includes(query) ||
            statusStr.includes(query)
        );
    });

    const selectedJobId = location.state?.selectedJobId;


    const getJobsForPoint = (pointName) => {
        const pointJobs = filteredJobs.filter(job => {
            if (Array.isArray(job.pointName)) {
                return job.pointName.includes(pointName);
            }
            return job.pointName === pointName;
        });
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
                            <div className="view-toggle-wrapper">
                                <button
                                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => { setViewMode('list'); navigate(location.pathname, { replace: true, state: { ...location.state, viewMode: 'list' } }); }}
                                    title="List View"
                                >
                                    <List size={16} />
                                    <span>List</span>
                                </button>
                                <button
                                    className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                                    onClick={() => { setViewMode('kanban'); navigate(location.pathname, { replace: true, state: { ...location.state, viewMode: 'kanban' } }); }}
                                    title="Kanban View"
                                >
                                    <LayoutGrid size={16} />
                                    <span>Schedule</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {viewMode === 'list' ? (
                    <div className="github-commit-list" style={{ width: '100%' }}>
                        {isLoadingJobList ? (
                            <div style={{ padding: '2rem' }}>
                                <Skeleton variant="rounded" height={60} sx={{ mb: 2, borderRadius: 2 }} animation="wave" />
                                <Skeleton variant="rounded" height={60} sx={{ mb: 2, borderRadius: 2 }} animation="wave" />
                                <Skeleton variant="rounded" height={60} sx={{ mb: 2, borderRadius: 2 }} animation="wave" />
                            </div>
                        ) : filteredJobList.length === 0 ? (
                            <div className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>
                                No jobs found matching search criteria
                            </div>
                        ) : (
                            filteredJobList.map(job => (
                                <div
                                    key={job.jobId}
                                    className={`commit-item ${getStatusLabel(job.status).toLowerCase() === 'pending' ? 'commit-item-pending' : (getStatusLabel(job.status).toLowerCase() === 'in progress' || getStatusLabel(job.status).toLowerCase() === 'serving') ? 'commit-item-serving' : ''}`}
                                >
                                    <div className="commit-meta">
                                        <div className="commit-icon-wrapper mobile-hidden">
                                            <GitCommit size={16} />
                                        </div>
                                        <div className="commit-info">
                                            <div className="commit-title-row">
                                                <span
                                                    className="commit-message"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => navigate(`/jobs/${job.jobId}`, {
                                                        state: {
                                                            selectedCenter,
                                                            selectedDate,
                                                            viewMode
                                                        }
                                                    })}
                                                >
                                                    JOB - {job.jobId}
                                                </span>
                                                <span className="commit-divider">•</span>
                                                <span className="commit-author">{job.customerName}</span>
                                            </div>
                                            <div className="commit-subtitle">
                                                <Tooltip
                                                    title={
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', padding: '0.25rem' }}>
                                                            {(job.services || []).map((serv, sIdx) => (
                                                                <span
                                                                    key={sIdx}
                                                                    className="role-permission-badge"
                                                                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', border: '1px solid var(--border-color)' }}
                                                                >
                                                                    {serv.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    }
                                                    placement="top"
                                                    arrow
                                                    slotProps={{
                                                        tooltip: {
                                                            sx: {
                                                                backgroundColor: 'var(--modal-bg)',
                                                                color: 'var(--text-primary)',
                                                                border: '1px solid var(--border-color)',
                                                                boxShadow: 'var(--card-shadow)',
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                '& .MuiTooltip-arrow': {
                                                                    color: 'var(--modal-bg)'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <span className={`${job.status === 5 ? 'commit-badge-count-disabled' : 'commit-badge-count'}`}>
                                                        {(job.service)}
                                                    </span>
                                                </Tooltip>

                                                <span className="commit-divider">•</span>

                                                <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    {(job.points || []).map((pt, pIdx) => (
                                                        <span
                                                            key={pIdx}
                                                            className="commit-point-badge"
                                                            style={{ cursor: 'default' }}
                                                        >
                                                            {pt.trim()}
                                                        </span>
                                                    ))}
                                                </div>

                                                <span className="commit-divider">•</span>
                                                <span>{job.timeSlot}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="commit-actions">
                                        {job.status === -1 ? (
                                            <span className="status-badge-pill serving mobile-hidden" style={{ color: '#3b82f6' }}>
                                                {job.completedPercentage !== undefined && job.completedPercentage !== null
                                                    ? `${job.completedPercentage}%`
                                                    : 'In Progress'}
                                            </span>
                                        ) : (
                                            <span className={`status-badge-pill ${getStatusLabel(job.status).toLowerCase()} mobile-hidden`} style={{ color: getStatusLabel(job.status).toLowerCase() === 'in progress' ? '#3b82f6' : undefined }}>
                                                {getStatusLabel(job.status)}
                                            </span>
                                        )}
                                        {selectedDate === new Date().toISOString().split('T')[0] && job.allowToServe === false && (
                                            <button
                                                className="commit-sha-btn"
                                                onClick={() => job.status !== 5 && handleAllowToServe(job.jobId)}
                                                disabled={job.status === 5}
                                                style={job.status === 5 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                            >
                                                <span>Customer Arrived</span>
                                            </button>
                                        )}
                                        {selectedDate === new Date().toISOString().split('T')[0] && job.allowToServe === true && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--success-color, #10b981)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                Customer Arrived
                                            </span>
                                        )}
                                        <button
                                            className="commit-sha-btn"
                                            onClick={() => navigate(`/jobs/${job.jobId}`, {
                                                state: {
                                                    selectedCenter,
                                                    selectedDate
                                                }
                                            })}
                                        >
                                            <span>View</span>
                                            <Eye size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
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
                                                                            selectedDate,
                                                                            viewMode
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
                                                                                selectedDate,
                                                                                viewMode
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
                                                                                <span className="font-medium">{job.customerName}</span>
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
                )}
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
