import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Loader2, Type as TypeIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { addHoliday } from '../services/holidayService';
import '../App.css';
import { useNavigate } from 'react-router-dom';

const HolidayModal = ({ isOpen, onClose, onSave, selectedDate, allowAddHolidays }) => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        holiday: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                holiday: selectedDate || ''
            });
        }
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

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
        if (!formData.name.trim()) return toast.error('Holiday Name is required');
        if (!formData.holiday) return toast.error('Date is required');

        setIsSaving(true);

        try {
            await addHoliday(formData);
            toast.success('Holiday added successfully');
            onSave();
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Add New Holiday</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Holiday Name */}
                            <div className="input-group">
                                <TypeIcon className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Holiday Name (e.g. Christmas Day)"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Holiday Date */}
                            <div className="input-group">
                                <CalendarIcon className="input-icon" size={18} />
                                <input
                                    type="date"
                                    name="holiday"
                                    value={formData.holiday}
                                    onChange={handleChange}
                                    required
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>

                        <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button type="button" className="secondary-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
                            {allowAddHolidays ? <button type="submit" className="primary-btn" disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Holiday'
                                )}
                            </button> :
                                <button type="submit" className="primary-btn-disabled" onClick={() => toast.warn("Required Holiday Add Permission")}>
                                    Create Holiday
                                </button>}

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HolidayModal;
