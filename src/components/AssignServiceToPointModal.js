import React, { useState, useEffect } from 'react';
import { X, Layout, Check, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { getAvailablePoints } from '../services/serviceProviderService';
import '../App.css';
import { useNavigate } from 'react-router-dom';

const AssignServiceToPointModal = ({ isOpen, onClose, service, centerId, initialSelectedPoints = [] }) => {
    const navigate = useNavigate();
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [availablePoints, setAvailablePoints] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && service && centerId) {
            setSelectedPoints(initialSelectedPoints);
            fetchAvailablePoints();
        }
    }, [isOpen, service, centerId, initialSelectedPoints]);

    const fetchAvailablePoints = async () => {
        setIsLoading(true);
        try {
            const data = await getAvailablePoints({
                centerId: parseInt(centerId),
                serviceId: service.id
            });
            setAvailablePoints(data || []);
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Failed to load service center details');
            }
            setAvailablePoints([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !service) return null;

    const togglePoint = (pointId) => {
        setSelectedPoints(prev =>
            prev.includes(pointId)
                ? prev.filter(id => id !== pointId)
                : [...prev, pointId]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        toast.success(`Service "${service.name}" assigned to selected points`);
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Layout size={20} className="text-primary" />
                        <div>
                            <h3 style={{ margin: 0 }}>Assign Points</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {service.name}
                            </p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Select the service points where this service will be available.
                    </p>

                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {availablePoints.length > 0 ? (
                                availablePoints.map(point => (
                                    <div
                                        key={point.id}
                                        onClick={() => togglePoint(point.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: `1px solid ${selectedPoints.includes(point.id) ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                            background: selectedPoints.includes(point.id) ? 'rgba(31, 136, 61, 0.05)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'var(--hover-bg)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <Layout size={20} className="text-secondary" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{point.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{point.shortName || 'Standard Point'}</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: `2px solid ${selectedPoints.includes(point.id) ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                            background: selectedPoints.includes(point.id) ? 'var(--primary-color)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            transition: 'all 0.2s'
                                        }}>
                                            {selectedPoints.includes(point.id) && <Check size={14} />}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No service points available. Please add points first.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving || isLoading}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="primary-btn"
                        onClick={handleSave}
                        disabled={isSaving || isLoading || availablePoints.length === 0}
                    >
                        {isSaving ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Assigning...</span>
                            </div>
                        ) : (
                            'Save Assignment'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignServiceToPointModal;
