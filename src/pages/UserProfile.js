import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, FileText, Shield, MapPin, Edit2, Calendar, User, Camera, X, Save, Lock, Briefcase, Bell, BellOff, RotateCcw, Loader2 } from 'lucide-react';
import '../App.css';
import axios from 'axios';
import { getConfig } from '../config';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Skeleton, Tooltip } from '@mui/material';
import { useUser } from '../context/UserContext';
import { getUserPermissionAccess } from '../services/userService';

const UserProfile = () => {
    const navigate = useNavigate();
    // Static data for design demonstration
    const [user, setUser] = useState({
        userId: 1,
        fname: "",
        lname: "",
        email: "",
        contact: "",
        nic: "",
        userType: "",
        role: "",
        roleId: null,
        serviceCenter: "",
        serviceCenterId: null,
        joinDate: "",
        avatarColor: ""
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState(null);
    const [roles, setRoles] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [originalNotifications, setOriginalNotifications] = useState([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
    const [mobileTooltipId, setMobileTooltipId] = useState(null);

    const fetchInitiated = useRef(false);


    const { hasPermissionAccess } = useUser();

    const canAssignRole = () =>
        hasPermissionAccess(
            'Role Management',
            'assigning'
        );

    const canAssignEmployee = () =>
        hasPermissionAccess(
            'Employee Management',
            'assigning'
        );

    const allowAssignRole = canAssignRole();

    const allowAssignEmployee = canAssignEmployee();

    useEffect(() => {
        if (!fetchInitiated.current) {
            fetchUserProfile();
            fetchNotifications();
            fetchPermissions();
            fetchInitiated.current = true;
        }
    }, []);

    const fetchUserProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseUrl}/user/profile-details`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                const data = response.data.data;
                setUser({
                    userId: 0,
                    fname: data.fname,
                    lname: data.lname,
                    email: data.email,
                    contact: data.contact,
                    nic: data.nic,
                    userType: data.userType,
                    role: data.role,
                    roleId: null,
                    serviceCenter: data.serviceCenter,
                    serviceCenterId: null,
                    joinDate: data.joinedDate,
                    avatarColor: "var(--primary-color)",
                    imageUrl: data.imageUrl
                });
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
            setIsLoadingProfile(false);
        }
    };

    const fetchNotifications = async () => {
        setIsLoadingNotifications(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseUrl}/notification-access/user-assigned`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.data && response.data.data) {
                const assignedNotifications = response.data.data.map(notification => ({
                    ...notification,
                    disabled: Boolean(notification.disabled)
                }));
                setNotifications(assignedNotifications);
                setOriginalNotifications(assignedNotifications);
            }
        } catch (error) {
            if (error?.response?.data?.code === 1) {
                toast.info("Session expired. Please login again.");
                navigate('/login');
            } else if (error?.response?.data?.data) {
                toast.error(error?.response?.data?.data);
            } else {
                toast.error('Failed to load notifications');
            }
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    const fetchPermissions = async () => {
        setIsLoadingPermissions(true);
        try {
            const data = await getUserPermissionAccess();
            setPermissions(data || []);
        } catch (error) {
            console.error("Failed to load permission access:", error);
            if (error?.response?.data?.code === 1) {
                toast.info("Session expired. Please login again.");
                navigate('/login');
            } else if (error?.response?.data?.data) {
                toast.error(error?.response?.data?.data);
            } else {
                toast.error('Failed to load permissions');
            }
        } finally {
            setIsLoadingPermissions(false);
        }
    };


    const getTrueAccesses = (perm) => {
        const accesses = [];
        if (perm.adding) accesses.push('adding');
        if (perm.updating) accesses.push('updating');
        if (perm.deleting) accesses.push('deleting');
        if (perm.getting) accesses.push('getting');
        if (perm.getAll) accesses.push('getAll');
        if (perm.assigning) accesses.push('assigning');
        if (perm.allowAll) accesses.push('allowAll');
        return accesses;
    };

    const accessLabels = {
        adding: 'ADD',
        updating: 'UPDATE',
        deleting: 'DELETE',
        getting: 'GET',
        getAll: 'GET ALL',
        assigning: 'ASSIGN',
        allowAll: 'ALLOW ALL'
    };

    const getAccessBadgeClass = (access) => {
        return `badge-pill`;
    };

    const getNotificationKey = (notification, index) => (
        notification.typeId
        ?? notification.id
        ?? notification.accessId
        ?? notification.notificationTypeId
        ?? `${notification.title}-${index}`
    );

    const getNotificationTypeId = (notification) => (
        notification.typeId
        ?? notification.notificationTypeId
        ?? notification.id
        ?? notification.accessId
    );

    const hasNotificationChanges = notifications.some((notification, index) => (
        Boolean(notification.disabled) !== Boolean(originalNotifications[index]?.disabled)
    ));

    const handleNotificationDisabledChange = (index) => {
        setNotifications(prevNotifications => prevNotifications.map((notification, notificationIndex) => (
            notificationIndex === index
                ? { ...notification, disabled: !Boolean(notification.disabled) }
                : notification
        )));
    };

    const handleResetNotifications = () => {
        setNotifications(originalNotifications.map(notification => ({ ...notification })));
    };

    const handleSaveNotifications = async () => {
        setIsSavingNotifications(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const payload = {
                notificationTypes: notifications
                    .filter(notification => !Boolean(notification.disabled))
                    .map(notification => parseInt(getNotificationTypeId(notification)))
                    .filter(notificationTypeId => !Number.isNaN(notificationTypeId))
            };

            await axios.put(`${baseUrl}/notification-access/assign`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const savedNotifications = notifications.map(notification => ({ ...notification }));
            setOriginalNotifications(savedNotifications);
            toast.success("Notification preferences saved successfully");
        } catch (error) {
            if (error?.response?.data?.code === 1) {
                toast.info("Session expired. Please login again.");
                navigate('/login');
            } else if (error?.response?.data?.data) {
                toast.error(error?.response?.data?.data);
            } else {
                toast.error("Failed to save notification preferences");
            }
        } finally {
            setIsSavingNotifications(false);
        }
    };

    useEffect(() => {
        if (isEditing) {
            fetchRoles();
            fetchUserProfileData();
        }
    }, [isEditing]);

    const fetchUserProfileData = async () => {
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseUrl}/user/profile-data`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                const userData = response.data.data;
                setEditFormData({
                    userId: userData.id,
                    firstName: userData.fname,
                    lastName: userData.lname,
                    email: userData.email,
                    contact: userData.mobile || userData.contact,
                    nic: userData.nic,
                    userType: userData.userType === 0 ? 'USER' : userData.userType === 1 ? 'ADMIN' : 'EMPLOYEE',
                    role: userData.role && userData.role.name ? userData.role.name : (userData.roleName || "No Role"),
                    roleId: userData.role && userData.role.id ? userData.role.id : (userData.roleId || ''),
                    serviceCenter: userData.serviceCenter && userData.serviceCenter.name ? userData.serviceCenter.name : (userData.serviceCenterName || "Head Office"),
                    serviceCenterId: userData.serviceCenter && userData.serviceCenter.id ? userData.serviceCenter.id : (userData.serviceCenterId || ''),
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            if (error?.response?.data?.data) {
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
            } else {
                toast.error('Network error');
            }
        }
    };

    const fetchRoles = async () => {
        setIsLoadingRoles(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseUrl}/role/get-all`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                setRoles(response.data.data);
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
            setIsLoadingRoles(false);
        }
    };

    const handleEditClick = () => {
        // Initialize with basic empty state or current view data while loading
        // Actual data will be fetched in useEffect
        setEditFormData({
            ...user,
            password: '',
            confirmPassword: ''
        });
        setIsEditing(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'roleId') {
            const roleId = parseInt(value);
            const selectedRole = roles.find(r => r.id === roleId);
            setEditFormData(prev => ({
                ...prev,
                roleId: roleId || '',
                role: selectedRole ? selectedRole.name : prev.role
            }));
        } else {
            setEditFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const userTypeInt = editFormData.userType === 'ADMIN' ? 1
                : editFormData.userType === 'EMPLOYEE' ? 2
                    : 0;

            const payload = {
                firstName: editFormData.firstName,
                lastName: editFormData.lastName,
                email: editFormData.email,
                contact: editFormData.contact,
                nic: editFormData.nic,
                userType: userTypeInt,
                roleId: editFormData.roleId,
                serviceCenterId: editFormData.serviceCenterId,
                password: editFormData.password || undefined // Only send if set
            };

            await axios.post(`${baseUrl}/user/update-profile`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            toast.success("Profile updated successfully");
            setIsEditing(false);
            fetchUserProfile(); // Refresh the main profile view
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                console.error("Error updating profile:", error);
                toast.error("Failed to update profile");
            }
        }
    };

    const getUserTypeBadgeClass = (type) => {
        return 'badge-pill badge-neutral';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>User Profile</h3>
                    <p className="subtitle">View and manage your account details</p>
                </div>
                <div className="header-actions">
                    <button className="primary-btn" onClick={handleEditClick}>
                        <Edit2 size={18} />
                        <span>Edit Profile</span>
                    </button>
                </div>
            </div>

            <div className="profile-layout">

                {/* Left Column: Identity Card */}
                <div className="content-card" style={{ padding: '0', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ background: user.avatarColor, height: '120px', position: 'relative' }}>
                        {/* Cover area */}
                    </div>
                    <div style={{ marginTop: '-60px', padding: '0 1.5rem 2rem' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            border: '4px solid var(--modal-bg)',
                            background: 'var(--modal-bg)',
                            margin: '0 auto 1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative'
                        }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                background: user.avatarColor,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'white',
                                fontSize: '3rem',
                                fontWeight: 'bold'
                            }}>
                                {isLoadingProfile ? (
                                    <Skeleton variant="circular" width={112} height={112} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                ) : (
                                    (user.fname && user.lname) ? `${user.fname[0]}${user.lname[0]}` : ''
                                )}
                            </div>
                            {!isLoadingProfile && (
                                <button style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    background: 'var(--info-color)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}>
                                    <Camera size={16} />
                                </button>
                            )}
                        </div>

                        {isLoadingProfile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Skeleton variant="text" width="60%" height={36} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                <Skeleton variant="rounded" width="30%" height={24} sx={{ mb: '1rem', borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                            </div>
                        ) : (
                            <>
                                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{user.fname} {user.lname}</h2>
                                <span className={getUserTypeBadgeClass(user.userType)} style={{ marginBottom: '1rem', display: 'inline-block' }}>
                                    {user.userType}
                                </span>
                            </>
                        )}

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            color: 'var(--text-secondary)',
                            marginTop: '1rem',
                            fontSize: '0.9rem'
                        }}>
                            {!isLoadingProfile && <Calendar size={14} />}
                            {isLoadingProfile ? (
                                <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                            ) : (
                                <span>Member since {user.joinDate}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="content-card">
                    {isLoadingProfile ? (
                        null
                    ) : (
                        <h4 style={{
                            borderBottom: '1px solid var(--border-color)',
                            paddingBottom: '1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <User size={20} className="text-secondary" />
                            Personal Information
                        </h4>
                    )}


                    <div className="info-grid">
                        {isLoadingProfile ? (
                            <>
                                <div className="detail-group">
                                    <Skeleton variant="text" width="30%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                                        <Skeleton variant="rounded" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                </div>
                                <div className="detail-group">
                                    <Skeleton variant="text" width="30%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                                        <Skeleton variant="rounded" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                </div>
                                <div className="detail-group">
                                    <Skeleton variant="text" width="30%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                                        <Skeleton variant="rounded" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {user.email ? (
                                    <div className="detail-group">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                <Mail size={18} />
                                            </div>
                                            {user.email}
                                        </div>
                                    </div>
                                ) : null}

                                {user.contact ? (
                                    <div className="detail-group">
                                        <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Phone Number</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                <Phone size={18} />
                                            </div>
                                            {user.contact}
                                        </div>
                                    </div>
                                ) : null}

                                {
                                    user.nic ? (
                                        <div className="detail-group">
                                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>National ID (NIC)</label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}>
                                                <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                    <FileText size={18} />
                                                </div>
                                                {user.nic}
                                            </div>
                                        </div>
                                    ) : null
                                }
                            </>
                        )}

                        <div className="detail-group">
                            {/* <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Service Information</label> */}
                            {isLoadingProfile ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                        <Skeleton variant="rounded" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        <div>
                                            <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            <Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                        <Skeleton variant="rounded" width={34} height={34} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        <div>
                                            <Skeleton variant="text" width={120} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            <Skeleton variant="text" width={80} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Service Information</label>
                                    {user.role ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                <Shield size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.role}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Role</div>
                                            </div>
                                        </div>
                                    ) : null}
                                    {user.serviceCenter ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                            <div style={{ padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.serviceCenter}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Service Center</div>
                                            </div>
                                        </div>
                                    ) : null
                                    }
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Permissions Section */}
            <div className="profile-secondary-layout">
                <div className="profile-secondary-spacer" />
                <div className="content-card" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Shield size={20} className="text-secondary" />
                        Permissions
                    </h4>

                    {isLoadingPermissions ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem 0' }}>
                            {Array.from(new Array(5)).map((_, i) => (
                                <Skeleton key={i} variant="rounded" width={100 + (i % 3) * 20} height={36} sx={{ borderRadius: '0.5rem', bgcolor: 'rgba(255,255,255,0.1)' }} />
                            ))}
                        </div>
                    ) : permissions.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2.5rem 1rem',
                            gap: '0.75rem',
                            color: 'var(--text-secondary)'
                        }}>
                            <Shield size={36} style={{ opacity: 0.4 }} />
                            <span style={{ fontSize: '0.9rem' }}>No permissions found</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem 0' }}>
                            {permissions.map((perm, idx) => {
                                if (perm.permission === 'Permit This') return null;
                                const trueAccesses = getTrueAccesses(perm);
                                
                                const tooltipContent = (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', padding: '0.25rem' }}>
                                        {trueAccesses.length > 0 ? (
                                            trueAccesses.map((access) => (
                                                <span
                                                    key={access}
                                                    className={getAccessBadgeClass(access)}
                                                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', border: '1px solid currentColor' }}
                                                >
                                                    {accessLabels[access]}
                                                </span>
                                            ))
                                        ) : (
                                            <span>No Access Granted</span>
                                        )}
                                    </div>
                                );

                                const isMobile = window.innerWidth <= 768;
                                const isOpen = isMobile ? mobileTooltipId === perm.permission : undefined;

                                return (
                                    <Tooltip
                                        key={perm.permission || idx}
                                        title={tooltipContent}
                                        placement="top"
                                        arrow
                                        open={isOpen}
                                        onClose={() => {
                                            if (isMobile) setMobileTooltipId(null);
                                        }}
                                        disableHoverListener={isMobile}
                                        disableFocusListener={isMobile}
                                        disableTouchListener={isMobile}
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
                                        <button
                                            type="button"
                                            className="badge-pill"
                                            onClick={() => {
                                                if (isMobile) {
                                                    setMobileTooltipId(prev => prev === perm.permission ? null : perm.permission);
                                                }
                                            }}
                                            style={{ 
                                                border: '1px solid var(--border-color)', 
                                                cursor: 'pointer',
                                                borderRadius: '0.5rem',
                                                padding: '0.5rem 1rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.85rem',
                                                background: 'var(--hover-bg)',
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            <Shield size={14} style={{ color: 'var(--text-secondary)' }} />
                                            {perm.permission}
                                        </button>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications Section */}
            <div className="profile-secondary-layout">
                <div className="profile-secondary-spacer" />
                <div className="content-card" style={{ marginTop: '1.5rem' }}>
                    <h4 style={{
                        borderBottom: '1px solid var(--border-color)',
                        paddingBottom: '1rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Bell size={20} className="text-secondary" />
                        Notifications
                    </h4>

                    {isLoadingNotifications ? (
                        <div style={{
                            // border: '1px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            // background: 'var(--hover-bg)'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {Array.from(new Array(4)).map((_, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem' }}>
                                        <Skeleton variant="rounded" width={16} height={16} sx={{ borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                                        <Skeleton variant="text" width={i % 2 === 0 ? 120 : 160} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2.5rem 1rem',
                            gap: '0.75rem',
                            color: 'var(--text-secondary)'
                        }}>
                            <BellOff size={36} style={{ opacity: 0.4 }} />
                            <span style={{ fontSize: '0.9rem' }}>No notifications assigned</span>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                // border: '1px solid var(--border-color)',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                // background: 'var(--hover-bg)'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {notifications.map((notif, index) => (
                                        <div
                                            key={getNotificationKey(notif, index)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.6rem',
                                                color: 'var(--text-primary)',
                                                padding: '0.4rem',
                                                borderRadius: '0.25rem'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={!Boolean(notif.disabled)}
                                                onChange={() => handleNotificationDisabledChange(index)}
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    cursor: 'pointer',
                                                    accentColor: 'var(--checkbox-accent-color)',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <span style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                                                <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                                    {notif.title}
                                                </span>
                                                {notif.content ? (
                                                    <span style={{
                                                        fontSize: '0.78rem',
                                                        color: 'var(--text-secondary)',
                                                        lineHeight: '1.4',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {notif.content}
                                                    </span>
                                                ) : null}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '0.75rem',
                                marginTop: '1.25rem',
                                paddingTop: '1.25rem',
                                borderTop: '1px solid var(--border-color)',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={handleResetNotifications}
                                    disabled={!hasNotificationChanges || isSavingNotifications}
                                    style={{
                                        opacity: (!hasNotificationChanges || isSavingNotifications) ? 0.55 : 1,
                                        cursor: (!hasNotificationChanges || isSavingNotifications) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <RotateCcw size={16} />
                                    <span>Reset</span>
                                </button>
                                <button
                                    type="button"
                                    className="primary-btn"
                                    onClick={handleSaveNotifications}
                                    disabled={!hasNotificationChanges || isSavingNotifications}
                                    style={{
                                        opacity: (!hasNotificationChanges || isSavingNotifications) ? 0.55 : 1,
                                        cursor: (!hasNotificationChanges || isSavingNotifications) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSavingNotifications ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    <span>{isSavingNotifications ? 'Saving...' : 'Save'}</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="modal-content profile-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Profile</h3>
                            <button className="close-btn" onClick={() => setIsEditing(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    {/* First Name */}
                                    <div className="input-group">
                                        <User className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="firstName"
                                            placeholder="First Name"
                                            value={editFormData.firstName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div className="input-group">
                                        <User className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="lastName"
                                            placeholder="Last Name"
                                            value={editFormData.lastName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <Mail className="input-icon" size={18} />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            value={editFormData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    {/* Contact */}
                                    <div className="input-group">
                                        <Phone className="input-icon" size={18} />
                                        <input
                                            type="tel"
                                            name="contact"
                                            placeholder="Contact Number"
                                            value={editFormData.contact}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* NIC */}
                                    <div className="input-group">
                                        <FileText className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="nic"
                                            placeholder="NIC"
                                            value={editFormData.nic}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* User Type - Mocked Read Only or Select */}
                                    {allowAssignEmployee ? (
                                        <div className="input-group">
                                            <Briefcase className="input-icon" size={18} />
                                            <select
                                                name="userType"
                                                value={editFormData.userType}
                                                onChange={handleInputChange}
                                                className="modal-select"
                                                style={{ width: '100%', paddingLeft: '2.5rem', height: '100%', border: 'none', color: 'inherit', background: 'transparent', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}
                                            >
                                                <option value="USER">User</option>
                                                {/* <option value="ADMIN">Admin</option> */}
                                                <option value="EMPLOYEE">Employee</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="input-group">
                                            <Briefcase className="input-icon" size={18} />
                                            <select
                                                name="userType"
                                                value={editFormData.userType}
                                                onChange={handleInputChange}
                                                disabled
                                                className="modal-select"
                                                style={{ width: '100%', paddingLeft: '2.5rem', height: '100%', border: 'none', color: 'inherit', background: 'transparent', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}
                                            >
                                                <option value="USER">User</option>
                                                {/* <option value="ADMIN">Admin</option> */}
                                                <option value="EMPLOYEE">Employee</option>
                                            </select>
                                        </div>
                                    )}


                                    {/* Role */}
                                    {allowAssignRole ?
                                        (<div className="input-group">
                                            <Shield className="input-icon" size={18} />
                                            {isLoadingRoles ? (
                                                <div style={{ padding: '0.8rem 0.8rem 0.8rem 2.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</div>
                                            ) : (
                                                <select
                                                    name="roleId"
                                                    value={editFormData.roleId}
                                                    onChange={handleInputChange}
                                                    className="modal-select"
                                                    required
                                                    style={{ width: '100%', paddingLeft: '2.5rem', height: '100%', border: 'none', color: 'inherit', background: 'transparent', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}
                                                >
                                                    <option value="">Select Role</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>{role.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>) : (
                                            <div className="input-group">
                                                <Shield className="input-icon" size={18} />
                                                {isLoadingRoles ? (
                                                    <div style={{ padding: '0.8rem 0.8rem 0.8rem 2.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</div>
                                                ) : (
                                                    <select
                                                        name="roleId"
                                                        value={editFormData.roleId}
                                                        onChange={handleInputChange}
                                                        className="modal-select"
                                                        disabled
                                                        required
                                                        style={{ width: '100%', paddingLeft: '2.5rem', height: '100%', border: 'none', color: 'inherit', background: 'transparent', outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}
                                                    >
                                                        <option value="">Select Role</option>
                                                        {roles.map(role => (
                                                            <option key={role.id} value={role.id}>{role.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}


                                    {/* Service Center - Mocked Read Only */}
                                    <div className="input-group">
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="serviceCenter"
                                            value={editFormData.serviceCenter}
                                            disabled
                                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="input-group">
                                        <Lock className="input-icon" size={18} />
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="New Password (Optional)"
                                            value={editFormData.password}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="input-group">
                                        <Lock className="input-icon" size={18} />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Confirm New Password"
                                            value={editFormData.confirmPassword}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginBottom: '1.5rem', marginRight: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="secondary-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">
                                    <Save size={18} />
                                    <span>Update Profile</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
