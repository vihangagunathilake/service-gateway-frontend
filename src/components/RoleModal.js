import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getConfig } from '../config';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';

const RoleModal = ({ isOpen, onClose, role, onSave }) => {
    const navigate = useNavigate();
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchNotificationTerm, setSearchNotificationTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [permissionsList, setPermissionsList] = useState([]);
    const [notificationsList, setNotificationsList] = useState([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const dropdownRef = useRef(null);

    const getPermissionName = (permission) => (
        typeof permission === 'object' && permission !== null
            ? permission.name || permission.permissionName || permission.permission || ''
            : permission
    );

    // Fetch permissions from API
    useEffect(() => {
        const fetchPermissions = async () => {
            if (isOpen) {
                setIsLoadingPermissions(true);
                try {
                    const baseUrl = getConfig().baseUrl;
                    const token = localStorage.getItem('token');
                    const response = await axios.get(`${baseUrl}/role/load-system-permissions`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.data && response.data.data) {
                        setPermissionsList(response.data.data);
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
                    setIsLoadingPermissions(false);
                }
            }
        };

        fetchPermissions();
    }, [isOpen]);

    // Fetch notifications from API
    useEffect(() => {
        const fetchNotifications = async () => {
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
                } finally {
                    setIsLoadingNotifications(false);
                }
            }
        };

        fetchNotifications();
    }, [isOpen]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (role) {
                setRoleName(role.name);
                // Ensure "Permit This" is always included
                const perms = (role.permissions || [])
                    .map(getPermissionName)
                    .filter(Boolean);
                if (!perms.includes('Permit This')) {
                    perms.push('Permit This');
                }
                setSelectedPermissions(perms);
            } else {
                setRoleName('');
                // Start with the required permission for new roles
                setSelectedPermissions(['Permit This']);
                setSelectedNotifications([]);
            }
            setSearchTerm('');
            setSearchNotificationTerm('');
            setIsDropdownOpen(false);
        }
    }, [isOpen, role]);

    // Populate notifications for edit mode, matching strings to IDs if needed
    useEffect(() => {
        if (isOpen && role) {
            let notifs = role.notifications || [];
            const hasStrings = notifs.some(n => typeof n === 'string' && isNaN(parseInt(n, 10)));

            if (hasStrings) {
                // If notifications are strings (names), we must wait for notificationsList to load
                if (notificationsList.length > 0) {
                    let mappedNotifs = notifs.map(n => {
                        const found = notificationsList.find(type => {
                            const name = typeof type === 'object' ? type.name || type.type : type;
                            return name === n;
                        });
                        return found ? (typeof found === 'object' ? found.id : found) : null;
                    }).filter(n => n !== null && n !== undefined);
                    setSelectedNotifications(mappedNotifs);
                }
            } else {
                // If they are objects or IDs directly, set them immediately
                let mappedNotifs = notifs.map(n => {
                    if (typeof n === 'object' && n !== null) return n.id || n.notificationId;
                    return parseInt(n, 10);
                }).filter(n => !isNaN(n));
                setSelectedNotifications(mappedNotifs);
            }
        }
    }, [isOpen, role, notificationsList]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const togglePermission = (permission) => {
        // "Permit This" must always be selected and cannot be changed
        if (permission === 'Permit This') {
            return;
        }
        if (selectedPermissions.includes(permission)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
        } else {
            setSelectedPermissions([...selectedPermissions, permission]);
        }
    };

    const toggleNotification = (notificationType) => {
        const valueToStore = typeof notificationType === 'object' ? notificationType.id : parseInt(notificationType, 10);
        if (selectedNotifications.includes(valueToStore)) {
            setSelectedNotifications(selectedNotifications.filter(n => n !== valueToStore));
        } else {
            setSelectedNotifications([...selectedNotifications, valueToStore]);
        }
    };

    const removePermission = (permission) => {
        setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    };

    const handleSave = async () => {
        // Validation
        if (!roleName.trim()) {
            toast.error('Please enter a role name');
            return;
        }

        if (selectedPermissions.length === 0) {
            toast.error('Please select at least one permission');
            return;
        }

        setIsSaving(true);

        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');

            if (role) {
                // Edit mode - update existing role
                const response = await axios.post(
                    `${baseUrl}/role/update`,
                    {
                        roleId: role.id,
                        roleName: roleName,
                        permissions: selectedPermissions,
                        notifications: selectedNotifications.map(n => parseInt(n, 10))
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.data) {
                    toast.success('Role updated successfully');
                    onSave();
                } else {
                    setIsSaving(false);
                    return;
                }
            } else {
                // Add new role
                const response = await axios.post(
                    `${baseUrl}/role/add`,
                    {
                        roleId: null,
                        roleName: roleName,
                        permissions: selectedPermissions,
                        notifications: selectedNotifications.map(n => parseInt(n, 10))
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.data.data) {
                    toast.success('Role added successfully');
                    onSave();
                } else {
                    toast.error(response.data?.message || 'Failed to add role');
                    setIsSaving(false);
                    return;
                }
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
            setIsSaving(false);
        }
    };

    const filteredPermissions = permissionsList.filter(perm => {
        const permissionName = getPermissionName(perm);
        return permissionName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredNotifications = notificationsList.filter(type => {
        const name = typeof type === 'object' ? type.name || type.type : type;
        return typeof name === 'string' && name.toLowerCase().includes(searchNotificationTerm.toLowerCase());
    });

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{role ? 'Edit Role' : 'Add New Role'}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <div className="form-group">
                        <label className="form-label">Role Name</label>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Enter role name"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Permissions</label>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <Search className="input-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search permissions..."
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
                            {isLoadingPermissions ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                    {Array.from(new Array(8)).map((_, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem' }}>
                                            <Skeleton variant="rounded" width={16} height={16} sx={{ borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                                            <Skeleton variant="text" width={i % 3 === 0 ? 160 : i % 2 === 0 ? 120 : 140} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredPermissions.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                    {filteredPermissions.map(perm => {
                                        const permissionName = getPermissionName(perm);
                                        const isSelected = selectedPermissions.includes(permissionName);
                                        return (
                                            <label key={permissionName} style={{
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
                                                checked={isSelected || permissionName === 'Permit This'}
                                                onChange={() => togglePermission(permissionName)}
                                                disabled={permissionName === 'Permit This'}
                                                style={{ cursor: permissionName === 'Permit This' ? 'not-allowed' : 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6', flexShrink: 0 }}
                                            />
                                            <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.4' }}>{permissionName}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-options" style={{ color: '#94a3b8', textAlign: 'center' }}>No permissions found</div>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Notifications</label>

                        <div className="input-group" style={{ marginBottom: '1rem' }}>
                            <Search className="input-icon" size={18} />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchNotificationTerm}
                                onChange={(e) => setSearchNotificationTerm(e.target.value)}
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
                                    {Array.from(new Array(4)).map((_, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem' }}>
                                            <Skeleton variant="rounded" width={16} height={16} sx={{ borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                                            <Skeleton variant="text" width={i % 2 === 0 ? 120 : 160} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                    ))}
                                </div>
                            ) : filteredNotifications.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem' }}>
                                    {filteredNotifications.map((type, idx) => {
                                        const value = typeof type === 'object' ? type.id : parseInt(type, 10);
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
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6', flexShrink: 0 }}
                                                />
                                                <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.4' }}>{name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-options" style={{ color: '#94a3b8', textAlign: 'center' }}>No notifications found</div>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="secondary-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
                        <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Saving...
                                </>
                            ) : (
                                role ? 'Save Changes' : 'Create Role'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleModal;
