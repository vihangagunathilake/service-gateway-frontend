import React from 'react';
import { AlertTriangle, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import '../App.css';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger', // 'danger', 'primary', 'success', 'warning'
    icon: IconProp,
    children,
    confirmHidden = false
}) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        onClose();
    };

    const getIcon = () => {
        if (IconProp) return <IconProp size={24} className={`text-${type}`} />;

        switch (type) {
            case 'success': return <CheckCircle2 size={24} className="text-secondary" />;
            case 'warning': return <ShieldAlert size={24} className="text-secondary" />;
            case 'primary': return <AlertTriangle size={24} className="text-secondary" />;
            default: return <AlertTriangle size={24} className="text-secondary" />;
        }
    };

    const getConfirmButtonStyle = () => {
        let bgColor = 'var(--danger-color)';
        switch (type) {
            case 'success': bgColor = 'var(--success-color, #28a745)'; break;
            case 'primary': bgColor = 'var(--primary-color, #007bff)'; break;
            case 'warning': bgColor = 'var(--warning-color, #ffc107)'; break;
            default: bgColor = 'var(--danger-color)';
        }
        return { backgroundColor: bgColor, borderColor: bgColor };
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {getIcon()}
                        <h3>{title}</h3>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {message && (
                        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            {message}
                        </p>
                    )}
                    {children}
                </div>

                <div className="modal-footer" style={{ gap: '12px', marginTop: '1rem', padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button className="secondary-btn" style={{ padding: '0.6rem 1.2rem' }} onClick={onClose}>{cancelText}</button>
                    {!confirmHidden && (
                        <button className="primary-btn" style={{ ...getConfirmButtonStyle(), padding: '0.6rem 1.2rem' }} onClick={handleConfirm}>
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
