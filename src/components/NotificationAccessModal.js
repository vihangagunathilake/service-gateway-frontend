import React, { useState, useEffect } from 'react';
import { X, Bell, Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getConfig } from '../config';
import { Skeleton } from '@mui/material';
import '../App.css';

const NotificationAccessModal = ({ isOpen, onClose, user }) => {
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationsList, setNotificationsList] = useState([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch notification types from API
    useEffect(() => {
        const fetchNotificationTypes = async () => {
            if (isOpen) {
                setIsLoadingNotifications(true);
                try {
                    const baseUrl = getConfig().baseUrl;
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${baseUrl}/notification-types/get-all`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data && response.data.data) {
                        setNotificationsList(response.data.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch notification types:', error);
                    toast.error('Failed to load notification types');
                } finally {
                    setIsLoadingNotifications(false);
                }
            }
        };

        fetchNotificationTypes();
    }, [isOpen]);

    // Fetch user's existing notification access when modal opens
    useEffect(() => {
        const fetchUserAccess = async () => {
            if (isOpen && user) {
                try {
                    const baseUrl = getConfig().baseUrl;
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${baseUrl}/notification-access/user/${user.id}/get-all`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data && response.data.data) {
                        // Response maps to list of { accessId, accessName }
                        const existingIds = response.data.data.map(access => access.accessId);
                        setSelectedNotifications(existingIds);
                    } else {
                        setSelectedNotifications([]);
                    }
                } catch (error) {
                    console.error('Failed to fetch user notification accesses:', error);
                    // Silent failure or toast - since it's just pre-populating, we can toast
                    toast.error('Failed to load user notification access');
                    setSelectedNotifications([]);
                }
            } else if (!isOpen) {
                setSelectedNotifications([]);
            }
        };

        fetchUserAccess();
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen, user]);

    const toggleNotification = (notificationType) => {
        // If the API returns objects (e.g. { id, name }), adjust this logic. 
        // Assuming string array like permissions for now. If objects, compare IDs.
        const valueToStore = typeof notificationType === 'object' ? notificationType.id : notificationType;

        if (selectedNotifications.includes(valueToStore)) {
            setSelectedNotifications(selectedNotifications.filter(n => n !== valueToStore));
        } else {
            setSelectedNotifications([...selectedNotifications, valueToStore]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');

            const payload = {
                userId: user.id,
                notificationTypes: selectedNotifications.map(id => parseInt(id))
            };

            const response = await axios.put(`${baseUrl}/notification-access/assign`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data) {
                toast.success("Notification access assigned successfully");
                onClose();
            } else {
                toast.error("Failed to assign notification access");
            }
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error("Failed to assign notification access");
            }
            console.error('Failed to assign notification access:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredNotifications = notificationsList.filter(type => {
        const name = typeof type === 'object' ? type.name || type.type : type;
        return typeof name === 'string' && name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Bell size={20} className="text-primary" />
                        <h3>Notification Access</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {user ? (
                        <>
                            <p style={{ marginBottom: '1rem' }}>
                                Manage notification access for user <strong>{user.name || user.firstName}</strong>.
                            </p>

                            <div className="form-group">
                                <label className="form-label">Notification Types</label>

                                <div className="input-group" style={{ marginBottom: '1rem' }}>
                                    <Search className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search notification types..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    {isLoadingNotifications ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                            {Array.from(new Array(6)).map((_, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem' }}>
                                                    <Skeleton variant="rounded" width={16} height={16} sx={{ borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                                                    <Skeleton variant="text" width={i % 2 === 0 ? 120 : 160} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : filteredNotifications.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                            {filteredNotifications.map((type, idx) => {
                                                const value = typeof type === 'object' ? type.id : type;
                                                const name = typeof type === 'object' ? type.name || type.type : type;
                                                const isSelected = selectedNotifications.includes(value);

                                                return (
                                                    <label key={idx} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.6rem',
                                                        cursor: 'pointer',
                                                        color: isSelected ? '#fff' : '#cbd5e1',
                                                        padding: '0.4rem',
                                                        borderRadius: '0.25rem',
                                                        transition: 'background 0.2s',
                                                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleNotification(type)}
                                                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--checkbox-accent-color)', flexShrink: 0 }}
                                                        />
                                                        <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.4' }}>{name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="no-options" style={{ color: '#94a3b8', textAlign: 'center' }}>No notification types found</div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <p>No user selected.</p>
                    )}
                </div>

                <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: "1rem", marginRight: "2rem" }}>
                    <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
                    {user && (
                        <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Saving...
                                </>
                            ) : (
                                'Save Access'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationAccessModal;
