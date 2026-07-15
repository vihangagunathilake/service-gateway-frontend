import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Shield, FileText, Briefcase, Loader2, MapPin } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getConfig } from '../config';
import '../App.css';
import { useNavigate } from 'react-router-dom';

const UserModal = ({ isOpen, onClose, onSave, user }) => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [serviceCenters, setServiceCenters] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [isLoadingCenters, setIsLoadingCenters] = useState(false);
    const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        contact: '',
        nic: '',
        userType: 'USER', // Default to USER
        roleId: '',
        serviceCenterId: '',
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (user) {
                // Edit Mode - Fetch fresh details
                fetchUserDetails(user.id);
            } else {
                // Add Mode
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    contact: '',
                    nic: '',
                    userType: 'USER',
                    roleId: '',
                    serviceCenterId: '',
                });
            }
            fetchRoles();
            fetchServiceCenters();
        }
    }, [isOpen, user]);

    const fetchUserDetails = async (userId) => {
        setIsLoadingUserDetails(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseUrl}/user/${userId}/get`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                const userData = response.data.data;
                setFormData({
                    firstName: userData.fname || '',
                    lastName: userData.lname || '',
                    email: userData.email || '',
                    contact: userData.contact || userData.mobile || '',
                    nic: userData.nic || '',
                    userType: userData.userType === 0 ? 'USER' : userData.userType === 2 ? 'EMPLOYEE' : 'USER',
                    roleId: userData.role && userData.role.id ? userData.role.id : (userData.roleId || ''),
                    serviceCenterId: userData.serviceCenter && userData.serviceCenter.id ? userData.serviceCenter.id : (userData.serviceCenterId || ''),
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
            setIsLoadingUserDetails(false);
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
            console.error("Error fetching roles:", error);
            // Silent error or toast? choosing silent for now unless it breaks usage significantly
        } finally {
            setIsLoadingRoles(false);
        }
    };

    const fetchServiceCenters = async () => {
        setIsLoadingCenters(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.get(`${baseUrl}/service-center/dropdown`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                if (Array.isArray(response.data.data)) {
                    setServiceCenters(response.data.data);
                } else if (response.data.data.content) {
                    setServiceCenters(response.data.data.content);
                }
            }
        } catch (error) {
            console.error("Error fetching service centers:", error);
        } finally {
            setIsLoadingCenters(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.firstName.trim()) return toast.error('First Name is required');
        if (!formData.lastName.trim()) return toast.error('Last Name is required');
        if (!formData.email.trim()) return toast.error('Email is required');

        if (!user && formData.userType !== 'EMPLOYEE' && !formData.roleId) return toast.error('Please select a role');

        setIsSaving(true);

        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');

            let response;

            if (user) {
                // Update User
                const payload = {
                    userId: user.id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    contact: formData.contact,
                    nic: formData.nic,
                    userType: formData.userType,
                    roleId: parseInt(formData.roleId),
                    serviceCenterId: formData.serviceCenterId ? parseInt(formData.serviceCenterId) : null,
                };


                response = await axios.post(`${baseUrl}/user/update`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

            } else {
                // Add User
                const payload = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    contact: formData.contact,
                    nic: formData.nic,
                    userType: formData.userType === 'USER' ? 0 : 2,
                    roleId: formData.roleId ? parseInt(formData.roleId) : null,
                    serviceCenterId: formData.serviceCenterId || null,
                };

                response = await axios.post(`${baseUrl}/user/add`, payload, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (response.data && response.data.data) {
                toast.success(user ? 'User updated successfully' : 'User added successfully');
                onSave(); // Callback to refresh list and close modal
                onClose();
            } else {
                toast.error(response.data?.message || (user ? 'Failed to update user' : 'Failed to add user'));
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

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>{user ? 'Edit User' : 'Add New User'}</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                    {isLoadingUserDetails ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                            <Loader2 className="animate-spin text-primary" size={48} />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                {/* First Name */}
                                <div className="input-group">
                                    <User className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First Name"
                                        value={formData.firstName}
                                        onChange={handleChange}
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
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div className="input-group full-width">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
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
                                        value={formData.contact}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* NIC */}
                                <div className="input-group">
                                    <FileText className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="nic"
                                        placeholder="NIC"
                                        value={formData.nic}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* User Type */}
                                <div className="input-group">
                                    <Briefcase className="input-icon" size={18} />
                                    <select
                                        name="userType"
                                        value={formData.userType}
                                        onChange={handleChange}
                                        className="modal-select"
                                    >
                                        <option value="USER">User</option>
                                        {/* <option value="ADMIN">Admin</option> */}
                                        <option value="EMPLOYEE">Employee</option>
                                    </select>
                                </div>

                                {/* Role — hidden for Employee */}
                                {formData.userType !== 'EMPLOYEE' && (
                                    <div className="input-group">
                                        <Shield className="input-icon" size={18} />
                                        {isLoadingRoles ? (
                                            <div className="loading-text" style={{ padding: '0.8rem', color: '#999' }}>Loading roles...</div>
                                        ) : (
                                            <select
                                                name="roleId"
                                                value={formData.roleId}
                                                onChange={handleChange}
                                                className="modal-select"
                                                required
                                                style={!user && !formData.roleId ? { border: '1px solid #ef4444' } : {}}
                                            >
                                                <option value="">Select Role</option>
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {/* Service Center */}
                                <div className="input-group">
                                    <MapPin className="input-icon" size={18} />
                                    {isLoadingCenters ? (
                                        <div className="loading-text" style={{ padding: '0.8rem', color: '#999' }}>Loading centers...</div>
                                    ) : (
                                        <select
                                            name="serviceCenterId"
                                            value={formData.serviceCenterId}
                                            onChange={handleChange}
                                            className="modal-select"
                                        >
                                            <option value="">Select Service Center</option>
                                            {serviceCenters.map(center => (
                                                <option key={center.id} value={center.id}>{center.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                            </div>

                            <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            {user ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        user ? 'Update User' : 'Create User'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserModal;
