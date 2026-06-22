import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { X, User, Mail, Phone, Building2, Loader2, IdCard } from 'lucide-react';
import { getConfig } from '../config';
import '../App.css';
import { useNavigate } from 'react-router-dom';

const RegisterModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        providerName: '',
        mobile: '',
        providerEmail: '',
        multipleCenters: false,
        adminName: '',
        nic: '',
        adminEmail: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const adminNameParts = formData.adminName.trim().split(' ');
        const adminFName = adminNameParts[0];
        const adminLName = adminNameParts.length > 1 ? adminNameParts.slice(1).join(' ') : '';

        const payload = {
            provider: formData.providerName,
            providerEmail: formData.providerEmail,
            contact: formData.mobile,
            hasMultipleBranches: formData.multipleCenters,
            adminFName: adminFName,
            adminLName: adminLName,
            nic: formData.nic,
            adminEmail: formData.adminEmail,
        };

        try {
            const baseUrl = getConfig().baseUrl;
            const response = await axios.post(`${baseUrl}/user/register`, payload);
            console.log('Registration Success:', response.data);
            toast.success(response.data.data);

            // Reset form and close
            setFormData({
                providerName: '',
                mobile: '',
                providerEmail: '',
                multipleCenters: false,
                adminName: '',
                nic: '',
                adminEmail: '',
            });
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
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content register-modal expanded" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Customer Registration</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit} className="registration-form">
                        <section className="form-section">
                            <h4>Service Provider Details</h4>
                            <div className="form-grid">
                                <div className="input-group">
                                    <Building2 className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="providerName"
                                        placeholder="Service Provider Name"
                                        value={formData.providerName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <Phone className="input-icon" size={18} />
                                    <input
                                        type="tel"
                                        name="mobile"
                                        placeholder="Mobile Number"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="input-group full-width">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        type="email"
                                        name="providerEmail"
                                        placeholder="Service Provider Email"
                                        value={formData.providerEmail}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="multipleCenters"
                                            checked={formData.multipleCenters}
                                            onChange={handleChange}
                                        />
                                        <span>Multiple Centers Available</span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        <section className="form-section">
                            <h4>Admin Account Details</h4>
                            <div className="form-grid">
                                <div className="input-group">
                                    <User className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="adminName"
                                        placeholder="Admin Full Name"
                                        value={formData.adminName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <Mail className="input-icon" size={18} />
                                    <input
                                        type="email"
                                        name="adminEmail"
                                        placeholder="Admin Email"
                                        value={formData.adminEmail}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <IdCard className="input-icon" size={18} />
                                    <input
                                        type="text"
                                        name="nic"
                                        placeholder="Admin NIC"
                                        value={formData.nic}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        <button type="submit" className="login-btn mt-4" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Registering...
                                </>
                            ) : (
                                'Complete Registration'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterModal;
