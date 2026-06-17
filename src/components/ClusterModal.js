import React, { useState, useEffect } from 'react';
import { X, Layers, Check, ChevronDown, Search, Loader2, Pencil } from 'lucide-react';
import { getServicesDropdown, addCluster, updateCluster } from '../services/serviceProviderService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ClusterModal = ({ isOpen, onClose, onClusterSaved, cluster = null }) => {
    const navigate = useNavigate();
    const [clusterName, setClusterName] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchServices = async () => {
                try {
                    setLoading(true);
                    const data = await getServicesDropdown();
                    setAvailableServices(data || []);

                    if (cluster) {
                        setClusterName(cluster.name || '');
                        // If cluster has services, map them correctly from available services to ensure consistency
                        const mappedServices = cluster.services?.map(s => {
                            const found = (data || []).find(available => available.id === s.id);
                            return found ? found : s;
                        }) || [];
                        setSelectedServices(mappedServices);
                    } else {
                        setClusterName('');
                        setSelectedServices([]);
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
                    setLoading(false);
                }
            };
            fetchServices();
        } else {
            // Reset state on close
            setClusterName('');
            setSelectedServices([]);
            setSearchTerm('');
            setIsDropdownOpen(false);
        }
    }, [isOpen, cluster, navigate]);

    const toggleService = (service) => {
        const isSelected = selectedServices.find(s => s.id === service.id);
        if (isSelected) {
            setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!clusterName.trim()) return toast.error('Workflow Name is required');
        if (selectedServices.length === 0) return toast.error('Please select at least one service');

        setIsSaving(true);
        try {
            // Extract service IDs in order
            const serviceIds = selectedServices.map(service => service.id);

            const clusterData = {
                id: cluster ? cluster.id : null,
                name: clusterName,
                serviceIds: serviceIds
            };

            if (cluster) {
                await updateCluster(clusterData);
                toast.success('Workflow updated successfully');
            } else {
                await addCluster(clusterData);
                toast.success('Workflow created successfully');
            }

            onClusterSaved();
            onClose();
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
            setIsSaving(false);
        }
    };

    const filteredServices = availableServices.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '550px',
                    width: '90%',
                    background: 'var(--modal-bg)',
                    boxShadow: 'var(--card-shadow)',
                    border: '1px solid var(--border-color)',
                    animation: 'slideUp 0.3s ease-out'
                }}
            >
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            background: 'rgba(31, 136, 61, 0.1)',
                            color: 'var(--primary-color)',
                            padding: '10px',
                            borderRadius: '12px'
                        }}>
                            {cluster ? <Pencil size={20} /> : <Layers size={20} />}
                        </div>
                        <div>
                            <h3>{cluster ? 'Edit Workflow' : 'Create New Workflow'}</h3>
                            <p className="subtitle">{cluster ? 'Update workflow details and services' : 'Grouping services for regional management'}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                                Workflow Name
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Northern Territory Services"
                                value={clusterName}
                                onChange={(e) => setClusterName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem' }}>
                                Assigned Services
                            </label>

                            <div className="custom-multiselect" style={{ position: 'relative' }}>
                                <div
                                    className="form-control"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    style={{
                                        minHeight: '45px',
                                        height: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px 40px 8px 12px',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    <span style={{ color: selectedServices.length === 0 ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                        {selectedServices.length === 0 ? 'Select services...' : `${selectedServices.length} service${selectedServices.length > 1 ? 's' : ''} selected`}
                                    </span>
                                    <ChevronDown
                                        size={18}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: `translateY(-50%) rotate(${isDropdownOpen ? '180deg' : '0deg'})`,
                                            transition: 'transform 0.2s',
                                            color: 'var(--text-secondary)'
                                        }}
                                    />
                                </div>

                                {isDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: '0',
                                        right: '0',
                                        marginTop: '4px',
                                        background: 'var(--modal-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        zIndex: 1000,
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        maxHeight: '250px',
                                        overflowY: 'auto'
                                    }}>
                                        <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: '0', background: 'var(--modal-bg)' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search services..."
                                                    className="form-control"
                                                    style={{ paddingLeft: '32px', height: '36px', fontSize: '0.85rem' }}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ padding: '4px' }}>
                                            {loading ? (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                    <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto 8px' }} />
                                                    Loading services...
                                                </div>
                                            ) : filteredServices.length === 0 ? (
                                                <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                    No services found
                                                </div>
                                            ) : (
                                                filteredServices.map(service => {
                                                    const isChecked = selectedServices.some(s => s.id === service.id);
                                                    return (
                                                        <div
                                                            key={service.id}
                                                            onClick={() => toggleService(service)}
                                                            style={{
                                                                padding: '10px 12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                cursor: 'pointer',
                                                                borderRadius: '6px',
                                                                transition: 'background 0.2s',
                                                                background: isChecked ? 'rgba(31, 136, 61, 0.05)' : 'transparent'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = isChecked ? 'rgba(31, 136, 61, 0.08)' : 'var(--hover-bg)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = isChecked ? 'rgba(31, 136, 61, 0.05)' : 'transparent'}
                                                        >
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontSize: '0.9rem', fontWeight: isChecked ? '600' : '400', color: isChecked ? 'var(--primary-color)' : 'var(--text-primary)' }}>{service.name}</span>
                                                            </div>
                                                            {isChecked && <Check size={16} color="var(--primary-color)" />}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Selected Services Ordered List */}
                            {selectedServices.length > 0 && (
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Selected Services
                                    </label>
                                    <div style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        {selectedServices.map((service, index) => (
                                            <div
                                                key={service.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '10px 12px',
                                                    background: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                                                    borderBottom: index < selectedServices.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                    gap: '10px'
                                                }}
                                            >
                                                <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: '500' }}>
                                                    {service.name}
                                                </span>

                                                {/* Remove Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleService(service)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        padding: '4px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <X size={14} color="#ef4444" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer" style={{
                        padding: '1.25rem 1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem'
                    }}>
                        <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn" disabled={isSaving || loading}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    {cluster ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                cluster ? 'Update Workflow' : 'Create Workflow'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Click outside to close dropdown */}
            {isDropdownOpen && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }} />}
        </div>
    );
};

export default ClusterModal;
