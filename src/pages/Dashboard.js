import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Activity, Briefcase, Clock, Play, CheckCircle, Shield, Building2, TrendingUp, TrendingDown, HelpCircle, CreditCard, Users, Layers, UserCheck, AlertCircle, List, PieChart } from 'lucide-react';
import StatusJobsModal from '../components/StatusJobsModal';
import ServicePointsModal from '../components/ServicePointsModal';
import JobsAllocatedModal from '../components/JobsAllocatedModal';
import EmployeeLoginsModal from '../components/EmployeeLoginsModal';
import EmployeeShortageModal from '../components/EmployeeShortageModal';
import { useNavigate } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [activeModalStatus, setActiveModalStatus] = useState('Pending');
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [isServicePointsModalOpen, setIsServicePointsModalOpen] = useState(false);
    const [isJobsAllocatedModalOpen, setIsJobsAllocatedModalOpen] = useState(false);
    const [isEmployeeLoginsModalOpen, setIsEmployeeLoginsModalOpen] = useState(false);
    const [isEmployeeShortageModalOpen, setIsEmployeeShortageModalOpen] = useState(false);

    useEffect(() => {
        if (location.state && location.state.openStatusModal) {
            setIsStatusModalOpen(true);
            if (location.state.returnStatus) {
                setActiveModalStatus(location.state.returnStatus);
            }
            if (location.state.selectedJobId) {
                setSelectedJobId(location.state.selectedJobId);
            }
        }
    }, [location.state]);

    // Dummy dashboard statistics
    const dashboardStats = {
        jobs: {
            total: 128,
            pending: 45,
            serving: 12,
            completed: 71
        },
        earnings: {
            totalEarned: 15240,
            expectedTotal: 20000,
            change: 12.5,
            isPositive: true
        },
        downPayments: {
            totalAmount: 42500,
            count: 15
        }
    };

    // Dummy service point data
    const servicePointStats = {
        total: 45,
        active: 38,
        allocated: 12
    };

    // Dummy employee data
    const employeeStats = {
        total: 24,
        activeLogins: 18,
        shortage: 6
    };

    // Dummy service usage data
    const serviceUsageData = [
        { name: 'Oil Change', count: 42, downpayments: 125000 },
        { name: 'Brake Service', count: 28, downpayments: 84000 },
        { name: 'Tire Rotation', count: 35, downpayments: 10500 },
        { name: 'Engine Diagnostic', count: 18, downpayments: 54000 },
        { name: 'Body Wash', count: 56, downpayments: 168000 },
        { name: 'Battery Replacement', count: 12, downpayments: 240000 }
    ];

    const totalUsage = serviceUsageData.reduce((sum, service) => sum + service.count, 0);

    // Dummy service centers data
    const serviceCenterData = [
        { id: 1, name: 'Downtown Center', totalJobs: 45, pending: 15, serving: 5, completed: 25, shortage: 2, completionIndex: 85 },
        { id: 2, name: 'Westside Auto', totalJobs: 32, pending: 8, serving: 4, completed: 20, shortage: 0, completionIndex: 92 },
        { id: 3, name: 'North Branch', totalJobs: 58, pending: 22, serving: 8, completed: 28, shortage: 4, completionIndex: 78 },
        { id: 4, name: 'South Point Hub', totalJobs: 24, pending: 5, serving: 2, completed: 17, shortage: 1, completionIndex: 88 },
        // { id: 5, name: 'East End Motors', totalJobs: 41, pending: 12, serving: 6, completed: 23, shortage: 0, completionIndex: 90 }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>Dashboard</h3>
                    <p className="subtitle">Welcome to service gateway dashboard.</p>
                </div>
            </div>
            <style>
                {`
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 1.5rem;
                }
                @media (max-width: 1200px) {
                    .dashboard-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .span-4, .span-3, .span-2 {
                        grid-column: span 2 !important;
                    }
                }
                @media (max-width: 768px) {
                    .dashboard-grid {
                        grid-template-columns: 1fr;
                    }
                    .span-4, .span-3, .span-2 {
                        grid-column: span 1 !important;
                    }
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .stat-clickable {
                    cursor: pointer;
                    padding: 8px;
                    margin: -8px;
                    border-radius: 8px;
                    transition: background-color 0.2s;
                }
                .stat-clickable:hover {
                    background-color: rgba(148, 163, 184, 0.1);
                }
                `}
            </style>
            <div className="dashboard-grid">
                {/* Row 1: Total Jobs (4) | Earnings (2) */}
                {/* Job Statistics Card */}
                <div className="stat-card span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: 'span 4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                                {/* <Briefcase size={18} style={{ color: 'var(--primary-color)' }} /> */}
                                Total Jobs
                            </h3>
                            <p className="stat-value" style={{ fontSize: '2.5rem' }}>{dashboardStats.jobs.total}</p>
                        </div>
                        {/* <div style={{
                            background: 'var(--info-bg)',
                            color: 'var(--info-color)',
                            padding: '12px',
                            borderRadius: '12px'
                        }}>
                            <Briefcase size={28} />
                        </div> */}
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        padding: '1.25rem 0.5rem 0.5rem',
                        borderTop: '1px solid var(--border-color)',
                        marginTop: '0.5rem'
                    }}>
                        <div
                            className="stat-clickable"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                alignItems: 'center',
                                padding: '12px 8px'
                            }}
                            onClick={() => {
                                setActiveModalStatus('Pending');
                                setIsStatusModalOpen(true);
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em'
                            }}>
                                <Clock size={16} style={{ color: 'var(--warning-color)' }} />
                                <span>Pending</span>
                            </div>
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--warning-color)', lineHeight: 1 }}>{dashboardStats.jobs.pending}</span>
                        </div>
                        <div
                            className="stat-clickable"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                alignItems: 'center',
                                padding: '12px 8px',
                                borderLeft: '1px solid var(--border-color)',
                                borderRight: '1px solid var(--border-color)'
                            }}
                            onClick={() => {
                                setActiveModalStatus('Serving');
                                setIsStatusModalOpen(true);
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em'
                            }}>
                                <Play size={16} style={{ color: 'var(--info-color)' }} />
                                <span>Serving</span>
                            </div>
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--info-color)', lineHeight: 1 }}>{dashboardStats.jobs.serving}</span>
                        </div>
                        <div
                            className="stat-clickable"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                alignItems: 'center',
                                padding: '12px 8px'
                            }}
                            onClick={() => {
                                setActiveModalStatus('Completed');
                                setIsStatusModalOpen(true);
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'var(--text-secondary)',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.025em'
                            }}>
                                <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />
                                <span>Completed</span>
                            </div>
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--success-color)', lineHeight: 1 }}>{dashboardStats.jobs.completed}</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                                {/* <TrendingUp size={18} style={{ color: '#8b5cf6' }} /> */}
                                Earnings
                                <span
                                    title="Basically shows the total earning which is related to the Servicegateway"
                                    style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}
                                >
                                    <HelpCircle size={14} style={{ color: 'var(--text-secondary)' }} />
                                </span>
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                                <p className="stat-value" style={{ fontSize: '1.8rem', margin: 0 }}>Rs. {dashboardStats.earnings.totalEarned.toLocaleString()}</p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '2px 6px',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    background: dashboardStats.earnings.isPositive ? 'var(--success-bg)' : 'var(--danger-bg)',
                                    color: dashboardStats.earnings.isPositive ? 'var(--success-color)' : 'var(--danger-color)'
                                }}>
                                    {dashboardStats.earnings.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                    <span>{dashboardStats.earnings.change}%</span>
                                </div>
                            </div>
                        </div>
                        {/* <div style={{
                            background: 'var(--info-bg)',
                            color: 'var(--info-color)',
                            padding: '10px',
                            borderRadius: '10px'
                        }}>
                            <TrendingUp size={20} />
                        </div> */}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        {(() => {
                            const progress = (dashboardStats.earnings.totalEarned / dashboardStats.earnings.expectedTotal) * 100;
                            let progressColor = 'var(--danger-color)'; // Red
                            if (progress >= 75) progressColor = 'var(--success-color)'; // Green
                            else if (progress >= 50) progressColor = 'var(--warning-color)'; // Yellow
                            else if (progress >= 25) progressColor = 'var(--warning-color)'; // Orange

                            return (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expected</span>
                                            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Rs. {dashboardStats.earnings.expectedTotal.toLocaleString()}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progress</span>
                                            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: progressColor, margin: 0 }}>
                                                {Math.round(progress)}%
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '6px',
                                        background: 'rgba(148, 163, 184, 0.1)',
                                        borderRadius: '10px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${Math.min(progress, 100)}%`,
                                            height: '100%',
                                            background: progressColor,
                                            borderRadius: '10px',
                                            transition: 'width 0.5s ease-out, background-color 0.3s ease'
                                        }} />
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Row 2: Down Payments (2) | Service Points (2) | Employees (2) */}
                <div className="stat-card span-2" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* <CreditCard size={18} style={{ color: '#06b6d4' }} /> */}
                                Down Payments
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <p className="stat-value" style={{ margin: 0 }}>Rs. {dashboardStats.downPayments.totalAmount.toLocaleString()}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Count: <span style={{ fontWeight: '600' }}>{dashboardStats.downPayments.count}</span>
                                </p>
                            </div>
                        </div>
                        {/* <div style={{
                            padding: '10px', background: 'var(--info-bg)',
                            color: 'var(--info-color)', borderRadius: '10px'
                        }}>
                            <CreditCard size={20} />
                        </div> */}
                    </div>
                </div>

                <div className="stat-card span-2" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* <Building2 size={18} style={{ color: '#f97316' }} /> */}
                                Service Points
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '50px', flexWrap: 'wrap' }}>
                                <p className="stat-value" style={{ margin: 0 }}>{servicePointStats.total}</p>
                                <Tooltip title="Active Service Points" arrow placement="top">
                                    <div
                                        className="stat-clickable"
                                        onClick={() => setIsServicePointsModalOpen(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', margin: '-2px -4px' }}
                                    >
                                        <Activity size={13} style={{ color: 'var(--success-color)' }} />
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}><span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--success-color)' }}>{servicePointStats.active}</span>
                                        </p>
                                    </div>
                                </Tooltip>
                                <Tooltip title="Jobs Allocated Points" arrow placement="top">
                                    <div
                                        className="stat-clickable"
                                        onClick={() => setIsJobsAllocatedModalOpen(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', margin: '-2px -4px' }}
                                    >
                                        <Layers size={13} style={{ color: 'var(--info-color)' }} />
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}><span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--info-color)' }}>{servicePointStats.allocated}</span>
                                        </p>
                                    </div>
                                </Tooltip>
                            </div>
                        </div>
                        {/* <div style={{
                            padding: '10px', background: 'rgba(31, 136, 61, 0.1)',
                            color: 'var(--primary-color)', borderRadius: '10px'
                        }}>
                            <Building2 size={20} />
                        </div> */}
                    </div>
                </div>

                <div className="stat-card span-2" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* <Users size={18} style={{ color: 'var(--primary-color)' }} /> */}
                                Employees
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '50px', flexWrap: 'wrap' }}>
                                <p className="stat-value" style={{ margin: 0 }}>{employeeStats.total}</p>
                                <Tooltip title="Active Employee Logins" arrow placement="top">
                                    <div
                                        className="stat-clickable"
                                        onClick={() => setIsEmployeeLoginsModalOpen(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '2px 4px', borderRadius: '4px', margin: '-2px -4px' }}
                                    >
                                        <UserCheck size={13} style={{ color: 'var(--success-color)' }} />
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--success-color)' }}>{employeeStats.activeLogins}</span>
                                        </p>
                                    </div>
                                </Tooltip>
                                <Tooltip title={employeeStats.shortage !== 0 ? "Employee Shortage" : "Full Staff"} arrow placement="top">
                                    <div
                                        className="stat-clickable"
                                        onClick={() => employeeStats.shortage !== 0 ? setIsEmployeeShortageModalOpen(true) : null}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            cursor: employeeStats.shortage !== 0 ? 'pointer' : 'default',
                                            padding: '2px 4px', borderRadius: '4px', margin: '-2px -4px'
                                        }}
                                    >
                                        {employeeStats.shortage !== 0 ? (
                                            <>
                                                <AlertCircle size={13} style={{ color: 'var(--danger-color)' }} />
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--danger-color)' }}>{employeeStats.shortage}</span>
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={13} style={{ color: 'var(--success-color)' }} />
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                    <span style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--success-color)' }}>{employeeStats.shortage}</span>
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3: Service Usage (3) | Service Centers (3) */}
                {/* Service Usage List Card */}
                <div className="stat-card span-3" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: 'span 3' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            Service Usage
                        </h3>
                    </div>
                    <div className="hide-scrollbar" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                    }}>
                        {serviceUsageData.map((service, index) => {
                            const percentage = (service.count / totalUsage) * 100;
                            return (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'var(--hover-bg)',
                                    borderRadius: '10px',
                                    borderLeft: `4px solid var(--info-color)`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        height: '100%',
                                        width: `${percentage}%`,
                                        background: 'var(--info-bg)',
                                        zIndex: 0,
                                        transition: 'width 0.5s ease-out'
                                    }} />
                                    <span style={{ fontWeight: '600', fontSize: '0.9rem', zIndex: 1 }}>{service.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Earned Rs. {service.downpayments.toLocaleString()}</span>
                                        </div>
                                        <div style={{
                                            background: `var(--info-bg)`,
                                            color: 'var(--info-color)',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            fontWeight: '700'
                                        }}>
                                            {service.count}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Service Centers List Card */}
                <div className="stat-card span-3" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: 'span 3' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            Service Centers
                        </h3>
                    </div>
                    <div className="hide-scrollbar" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                    }}>
                        {serviceCenterData.map((center, index) => (
                            <div
                                key={index}
                                className="stat-clickable"
                                onClick={() => navigate('/branch-dashboard', { state: { centerId: center.id, centerName: center.name } })}
                                style={{
                                    marginTop: '0.25rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    padding: '16px',
                                    background: 'var(--hover-bg)',
                                    borderRadius: '16px',
                                    // border: '1px solid var(--border-color)',
                                    // borderLeft: `4px solid ${center.completionIndex >= 80 ? 'var(--success-color)' : (center.completionIndex >= 60 ? 'var(--warning-color)' : 'var(--danger-color)')}`,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: 'translateY(0)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.06)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', paddingBottom: '8px' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{center.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Jobs</span>
                                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{center.totalJobs}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr', gap: '20px', alignItems: 'end' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {/* Compact Status Badges */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--warning-bg)', padding: '4px 10px', borderRadius: '8px', color: 'var(--warning-color)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                            <Clock size={12} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{center.pending}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--info-bg)', padding: '4px 10px', borderRadius: '8px', color: 'var(--info-color)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <Play size={12} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{center.serving}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--success-bg)', padding: '4px 10px', borderRadius: '8px', color: 'var(--success-color)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <CheckCircle size={12} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{center.completed}</span>
                                        </div>

                                        {/* Compact Shortage */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            marginLeft: '4px',
                                            background: center.shortage > 0 ? 'var(--danger-bg)' : 'transparent',
                                            color: center.shortage > 0 ? 'var(--danger-color)' : 'var(--success-color)',
                                            border: center.shortage > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
                                        }}>
                                            {center.shortage > 0 ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                                            <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>{center.shortage > 0 ? `-${center.shortage} Shortage` : 'Full Staff'}</span>
                                        </div>
                                    </div>

                                    {/* Completion Index Progress Bar */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Efficiency</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: center.completionIndex >= 80 ? 'var(--success-color)' : (center.completionIndex >= 60 ? 'var(--warning-color)' : 'var(--danger-color)') }}>{center.completionIndex}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden', width: '100%' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${center.completionIndex}%`,
                                                background: center.completionIndex >= 80 ? 'var(--success-color)' : (center.completionIndex >= 60 ? 'var(--warning-color)' : 'var(--danger-color)'),
                                                borderRadius: '10px',
                                                transition: 'width 1s ease-out'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <StatusJobsModal
                isOpen={isStatusModalOpen}
                onClose={() => {
                    setIsStatusModalOpen(false);
                    setSelectedJobId(null);
                }}
                status={activeModalStatus}
                selectedJobId={selectedJobId}
            />

            <ServicePointsModal
                isOpen={isServicePointsModalOpen}
                onClose={() => setIsServicePointsModalOpen(false)}
            />

            <JobsAllocatedModal
                isOpen={isJobsAllocatedModalOpen}
                onClose={() => setIsJobsAllocatedModalOpen(false)}
            />

            <EmployeeLoginsModal
                isOpen={isEmployeeLoginsModalOpen}
                onClose={() => setIsEmployeeLoginsModalOpen(false)}
            />

            <EmployeeShortageModal
                isOpen={isEmployeeShortageModalOpen}
                onClose={() => setIsEmployeeShortageModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
