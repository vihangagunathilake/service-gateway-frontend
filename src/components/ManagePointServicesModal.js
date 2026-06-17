import React, { useState, useEffect } from 'react';
import { X, Briefcase, Plus, Trash2, Search, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@mui/material';
import { toast } from 'react-toastify';
import { getAvailableServicesForPoint, getAssignedServicesForPoint, assignServiceToPoint, unassignServiceFromPoint } from '../services/serviceProviderService';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Tooltip from '@mui/material/Tooltip';

const ManagePointServicesModal = ({ isOpen, onClose, servicePoint, assignedServices = [], onUpdateServices }) => {
    const navigate = useNavigate();
    const [localAssignedServices, setLocalAssignedServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableServices, setAvailableServices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const { hasPermissionAccess } = useUser();

    const assignServicesToPoint = () =>
        hasPermissionAccess(
            'Points Management',
            'assigning'
        );

    const allowAssignServicesToPoint = assignServicesToPoint();

    useEffect(() => {
        if (isOpen && servicePoint) {
            setLocalAssignedServices(assignedServices);
            setSearchTerm('');
            fetchAvailableServices();
            fetchAssignedServices();
        }
    }, [isOpen, servicePoint, assignedServices]);

    const fetchAvailableServices = async () => {
        if (!servicePoint?.id) return;

        setIsLoading(true);
        setError(null);
        try {
            const services = await getAvailableServicesForPoint(servicePoint.id);
            setAvailableServices(services || []);
        } catch (err) {
            if (err?.response?.data?.data) {
                if (err?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(err?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
            setAvailableServices([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAssignedServices = async () => {
        if (!servicePoint?.id) return;

        setIsLoading(true);
        setError(null);
        try {
            const services = await getAssignedServicesForPoint(servicePoint.id);
            setLocalAssignedServices(services || []);
        } catch (err) {
            if (err?.response?.data?.data) {
                if (err?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(err?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
            setLocalAssignedServices([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !servicePoint) return null;

    const filteredAvailableServices = availableServices.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.category && service.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAddService = async (service) => {
        setProcessingId(service.id);
        try {
            await assignServiceToPoint(service.id, servicePoint.id);
            const updated = [...localAssignedServices, service];
            setLocalAssignedServices(updated);
            onUpdateServices(servicePoint.id, updated);
            // Remove from available services
            setAvailableServices(prev => prev.filter(s => s.id !== service.id));
            // toast.success(`${service.name} added to ${servicePoint.name}`);
        } catch (err) {
            if (err?.response?.data?.data) {
                if (err?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.warn(err?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleRemoveService = async (service) => {
        setProcessingId(service.id);
        try {
            await unassignServiceFromPoint(service.id, servicePoint.id);
            const updated = localAssignedServices.filter(s => s.id !== service.id);
            setLocalAssignedServices(updated);
            onUpdateServices(servicePoint.id, updated);
            // Add back to available services
            setAvailableServices(prev => [...prev, service]);
            // toast.success(`${service.name} removed from ${servicePoint.name}`);
        } catch (err) {
            if (err?.response?.data?.data) {
                if (err?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(err?.response?.data?.data);
                }
            } else {
                toast.error('Network error');
            }
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(900px, 95vw)', width: '100%', maxHeight: '95vh' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Briefcase size={20} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                            <h3 style={{ margin: 0 }}>Manage Services</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {servicePoint.name}
                            </p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.25rem', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                    <div className="form-grid-2" style={{ gap: '2rem' }}>
                        {/* Assigned Services Section */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                    Assigned Services ({localAssignedServices.length})
                                </h4>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <Skeleton key={i} variant="rectangular" width="100%" height={80} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                                    ))
                                ) : localAssignedServices.length > 0 ? (
                                    localAssignedServices.map((service, index) => (
                                        <div
                                            key={service.id}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-color)',
                                                background: 'var(--hover-bg)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center' }}>
                                                    <span className="order-number-badge" style={{ marginRight: '8px' }}>{service.orderNumber}</span>
                                                    {service.name}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                    {/* <span style={{
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '12px',
                                                        background: 'rgba(31, 136, 61, 0.15)',
                                                        color: 'var(--primary-color)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {service.category}
                                                    </span> */}
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Clock size={12} />
                                                        {service.serviceTime}
                                                    </span>
                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
                                                        {service.totalPrice}
                                                    </span>
                                                </div>
                                            </div>
                                            {(index === 0 || index === localAssignedServices.length - 1) && (
                                                <>
                                                    {
                                                        allowAssignServicesToPoint ? (
                                                            <button
                                                                className="icon-action-btn text-danger"
                                                                onClick={() => handleRemoveService(service)}
                                                                disabled={processingId === service.id}
                                                                title="Remove service"
                                                                style={{
                                                                    marginLeft: '1rem',
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                            >
                                                                {processingId === service.id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <Trash2 size={16} />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="icon-action-btn-disabled text-danger"
                                                                onClick={() => { toast.warn("Need Points Assign Permission"); }}
                                                                title="Remove service"
                                                                style={{
                                                                    marginLeft: '1rem',
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.3s ease'
                                                                }}
                                                            >
                                                                {processingId === service.id ? (
                                                                    <Loader2 size={16} className="animate-spin" />
                                                                ) : (
                                                                    <Trash2 size={16} />
                                                                )}
                                                            </button>
                                                        )}
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem 1rem',
                                        background: 'var(--hover-bg)',
                                        borderRadius: '12px',
                                        border: '1px dashed var(--border-color)',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <Briefcase size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                                        <p style={{ margin: 0 }}>No services assigned yet</p>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Add services from the available list</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Available Services Section */}
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                    Available Services ({availableServices.length})
                                </h4>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search services..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--hover-bg)',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {isLoading ? (
                                    [1, 2, 3, 4].map(i => (
                                        <Skeleton key={i} variant="rectangular" width="100%" height={80} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                                    ))
                                ) : error ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem 1rem',
                                        background: 'var(--hover-bg)',
                                        borderRadius: '12px',
                                        border: '1px dashed #ef4444',
                                        color: '#ef4444'
                                    }}>
                                        <p style={{ margin: 0 }}>{error}</p>
                                        <button
                                            className="secondary-btn"
                                            onClick={fetchAvailableServices}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : filteredAvailableServices.length > 0 ? (
                                    filteredAvailableServices.map((service, index) => (
                                        <div
                                            key={service.id}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-color)',
                                                background: 'transparent',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                                flexWrap: 'wrap',
                                                gap: '0.5rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center' }}>
                                                    <span className="order-number-badge" style={{ marginRight: '8px' }}>{service.orderNumber}</span>
                                                    {service.name}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                    {service.category && (
                                                        <span style={{
                                                            padding: '0.15rem 0.5rem',
                                                            borderRadius: '12px',
                                                            background: 'var(--hover-bg)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {service.category}
                                                        </span>
                                                    )}
                                                    {service.serviceTime && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <Clock size={12} />
                                                            {service.serviceTime}
                                                        </span>
                                                    )}
                                                    {service.totalPrice && (
                                                        <span style={{ fontWeight: '600' }}>
                                                            {service.totalPrice}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {(localAssignedServices.length === 0 || index === 0) && (
                                                <>
                                                    {allowAssignServicesToPoint ? (
                                                        <button
                                                            className="primary-btn"
                                                            onClick={() => handleAddService(service)}
                                                            disabled={processingId === service.id}
                                                            style={{
                                                                padding: '0.4rem 0.75rem',
                                                                fontSize: '0.85rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                marginLeft: '1rem',
                                                                minWidth: '85px',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.3s ease',
                                                                position: 'relative',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {processingId === service.id ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                    <span style={{ opacity: 0.7 }}>Adding</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <Plus size={14} />
                                                                    Add
                                                                </>
                                                            )}
                                                        </button>
                                                    ) : (

                                                        <button
                                                            className="secondary-btn-disabled"
                                                            onClick={() => { toast.warn("Need Points Assign Permission"); }}
                                                            style={{
                                                                padding: '0.4rem 0.75rem',
                                                                fontSize: '0.85rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                marginLeft: '1rem',
                                                                minWidth: '85px',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.3s ease',
                                                                position: 'relative',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {processingId === service.id ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <Loader2 size={14} className="animate-spin" />
                                                                    <span style={{ opacity: 0.7 }}>Adding</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <Plus size={14} />
                                                                    Add
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '3rem 1rem',
                                        background: 'var(--hover-bg)',
                                        borderRadius: '12px',
                                        border: '1px dashed var(--border-color)',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <Search size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                                        <p style={{ margin: 0 }}>
                                            {searchTerm ? 'No services found' : 'All services assigned'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" className="secondary-btn" onClick={onClose} style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                        Done
                    </button>
                </div>
            </div>
        </div >
    );
};

export default ManagePointServicesModal;
