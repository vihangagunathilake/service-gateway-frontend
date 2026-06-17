import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, Globe, Shield, Clock, Building, CheckCircle, AlertCircle, Search, Filter, Edit2, Save, X } from 'lucide-react';
import '../App.css';
import { getServiceProviderProfile, updateServiceProviderProfile, getSummarizedServiceCenters } from '../services/serviceProviderService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import { useUser } from '../context/UserContext';

const ServiceProviderProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [centersLoading, setCentersLoading] = useState(true);

    const [provider, setProvider] = useState({
        id: '',
        name: '',
        regNo: '',
        email: '',
        contact: '',
        address: '',
        website: '',
        status: '',
        joinDate: '',
        description: ''
    });

    const [serviceCenters, setServiceCenters] = useState([]);

    const fetchInitiated = useRef(false);

    const { hasPermissionAccess } = useUser();

    const canEditServiceProvider = () =>
        hasPermissionAccess(
            'Service Provider',
            'updating'
        );

    const allowEditServiceProvider = canEditServiceProvider();

    useEffect(() => {
        if (!fetchInitiated.current) {
            fetchProfile();
            fetchServiceCenters();
            fetchInitiated.current = true;
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getServiceProviderProfile();
            setProvider(data);
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

    const fetchServiceCenters = async () => {
        setCentersLoading(true);
        try {
            const data = await getSummarizedServiceCenters();
            setServiceCenters(data);
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Failed to load service centers');
            }
        } finally {
            setCentersLoading(false);
        }
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState(null);

    const handleEditClick = () => {
        setEditFormData({ ...provider });
        setIsEditing(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await updateServiceProviderProfile({
                name: editFormData.name,
                email: editFormData.email,
                contact: editFormData.contact,
                address: editFormData.address,
                website: editFormData.website,
                description: editFormData.description
            });

            if (response && response.code === 0) {
                toast.success("Service Provider updated successfully");
                setProvider(editFormData);
                setIsEditing(false);
            } else {
                toast.error(response.message || "Failed to update profile");
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
        }
    };

    const getCenterStatusBadgeClass = (status) => {
        return status === 'Active' || status === 'Opened' ? 'badge-pill badge-primary' : 'badge-pill badge-neutral';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>Service Provider Profile</h3>
                    <p className="subtitle">Manage provider details and service centers</p>
                </div>
                <div className="header-actions">
                    {allowEditServiceProvider ?
                        <button className="primary-btn edit-provider-btn" onClick={handleEditClick}>
                            <Edit2 size={18} />
                            <span>Edit Profile</span>
                        </button>
                        :
                        <button className="primary-btn-disabled" onClick={() => { toast.warn("Required Provider Edit Permission"); }}>
                            <Edit2 size={18} />
                            <span>Edit Profile</span>
                        </button>
                    }
                </div>
            </div>

            <div className="profile-layout">

                {/* Left Column: Provider Identity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="content-card" style={{ padding: '0', overflow: 'hidden', textAlign: 'center' }}>
                        <div style={{ background: 'var(--primary-color)', height: '140px' }}></div>
                        <div style={{ marginTop: '-70px', padding: '0 1.5rem 2rem' }}>
                            <div style={{
                                width: '140px',
                                height: '140px',
                                borderRadius: '1rem',
                                border: '4px solid var(--modal-bg)',
                                background: 'var(--primary-color)',
                                margin: '0 auto 1rem',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '3.5rem',
                                fontWeight: 'bold',
                                color: 'white',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                            }}>
                                {!loading && <Building size={64} />}
                            </div>

                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <Skeleton variant="text" width="60%" height={40} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        <Skeleton variant="rounded" width={100} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{provider.name}</h2>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <span className={getCenterStatusBadgeClass(provider.status)}>{provider.status}</span>
                                        <span className="badge-pill bg-dark-lighter text-muted">{provider.regNo}</span>
                                    </div>
                                </>
                            )}

                            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem' }}>
                                <div className="detail-group">
                                    {!loading ?
                                        <label style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Contact Information</label>
                                        : null}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {loading ? (
                                            <>
                                                <Skeleton variant="text" width="90%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="text" width="85%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="text" width="95%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                                                    <Mail size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                                                    {provider.email}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                                                    <Phone size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                                                    {provider.contact}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem' }}>
                                                    <Globe size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                                                    {provider.website}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', fontSize: '0.95rem' }}>
                                                    <MapPin size={16} className="text-secondary" style={{ marginTop: '3px', flexShrink: 0 }} />
                                                    {provider.address}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Service Centers & Overview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Overview Card */}
                    <div className="content-card">

                        {loading ? (
                            <>
                                <Skeleton variant="text" width="100%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                <Skeleton variant="text" width="90%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div>
                                        {/* <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Since</div> */}
                                        <Skeleton variant="text" width={120} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h4 className="card-title">
                                    <Shield className="text-secondary" size={20} style={{ marginRight: '0.5rem' }} />
                                    About Provider
                                </h4>
                                <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{provider.description}</p>
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Since</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{provider.joinDate}</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Service Centers Grid */}
                    <div>
                        {!centersLoading ?
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={20} className="text-secondary" />
                                    Service Centers
                                </h4>
                            </div>
                            : null}

                        <div className="centers-grid">
                            {centersLoading ? (
                                Array.from(new Array(4)).map((_, i) => (
                                    <div key={i} className="content-card" style={{ marginBottom: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <Skeleton variant="text" width="50%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            <Skeleton variant="rounded" width="20%" height={20} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                    </div>
                                ))
                            ) : serviceCenters.length > 0 ? (
                                serviceCenters.map(center => (
                                    <div key={center.id} className="content-card" style={{
                                        borderLeft: center.status === 'Opened' || center.status === 'Active' ? 'none' : '4px solid var(--border-color)',
                                        transition: 'transform 0.2s',
                                        cursor: 'pointer',
                                        marginBottom: 0
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <h5 style={{ margin: 0, fontSize: '1.1rem' }}>{center.name}</h5>
                                            <span className={getCenterStatusBadgeClass(center.status)} style={{ fontSize: '0.75rem' }}>{center.status}</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <MapPin size={14} className="text-muted" />
                                                {center.location}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Phone size={14} className="text-muted" />
                                                {center.contact}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', border: '1px dashed #334155', borderRadius: '1rem' }}>
                                    <p style={{ color: '#94a3b8' }}>No service centers found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="modal-content profile-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Provider Details</h3>
                            <button className="close-btn" onClick={() => setIsEditing(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-grid">

                                    {/* Company Name */}
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <Building className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Company Name"
                                            value={editFormData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    {/* Reg No */}
                                    <div className="input-group">
                                        <Shield className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="regNo"
                                            placeholder="Registration Number"
                                            value={editFormData.regNo}
                                            onChange={handleInputChange}
                                            disabled
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="input-group">
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
                                            required
                                        />
                                    </div>

                                    {/* Website */}
                                    <div className="input-group">
                                        <Globe className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="website"
                                            placeholder="Website URL"
                                            value={editFormData.website}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <MapPin className="input-icon" size={18} />
                                        <input
                                            type="text"
                                            name="address"
                                            placeholder="Physical Address"
                                            value={editFormData.address}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                        <textarea
                                            name="description"
                                            placeholder="Description"
                                            value={editFormData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            style={{
                                                width: '100%',
                                                padding: '0.8rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '0.5rem',
                                                color: 'white',
                                                fontSize: '0.95rem',
                                                fontFamily: 'inherit',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginBottom: '1.5rem', marginRight: '1.5rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="secondary-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="primary-btn">
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceProviderProfile;
