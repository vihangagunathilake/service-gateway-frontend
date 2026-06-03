import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Shield, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getConfig } from '../config';
import RoleModal from '../components/RoleModal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../App.css';
import { Skeleton } from '@mui/material';
import { useUser } from '../context/UserContext';

const PERMISSION_ACTION_FIELDS = [
    { key: 'add_permission', label: 'Add Permission' },
    { key: 'update_permission', label: 'Update Permission' },
    { key: 'delete_permission', label: 'Delete Permission' },
    { key: 'getAll_permission', label: 'Get All Permission' },
    { key: 'get_permission', label: 'Get Permission' },
    { key: 'assign_permission', label: 'Assign Permission' },
    { key: 'all_permission', label: 'All Permission' }
];

const EXCLUDED_PERMISSION_POPUP_NAME = 'Permit This';

const Roles = () => {
    const navigate = useNavigate();
    const { hasPermissionAccess, loading } = useUser();
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roles, setRoles] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [isLoadingPermissionAccess, setIsLoadingPermissionAccess] = useState(false);
    const [isAssigningPermissionAccess, setIsAssigningPermissionAccess] = useState(false);
    const hasFetchedRef = useRef(false);

    const canAddRole = () =>
        hasPermissionAccess(
            'Role Management',
            'adding'
        );

    const canUpdateRole = () =>
        hasPermissionAccess(
            'Role Management',
            'updating'
        );

    const canDeleteRole = () =>
        hasPermissionAccess(
            'Role Management',
            'deleting'
        );

    const canAssignPermissionAccess = () =>
        hasPermissionAccess(
            'Permission Access',
            'getting'
        );

    const canAssignPermission = () =>
        hasPermissionAccess(
            'Permission Access',
            'assigning'
        );

    const showNotifications = () =>
        hasPermissionAccess(
            'Notification Permission',
            'getAll'
        );

    const showAllPermissions = () =>
        hasPermissionAccess(
            'Role Management',
            'getting'
        );

    const showAllRoles = () =>
        hasPermissionAccess(
            'Role Management',
            'getAll'
        );

    const canOpenPermissionAccessPopup = canAssignPermissionAccess();

    const canShowAllRoles = showAllRoles();

    const canAddRoles = canAddRole();

    // Fetch roles from API
    useEffect(() => {
        if (!loading && canShowAllRoles && !hasFetchedRef.current) {
            fetchRoles();
            hasFetchedRef.current = true;
        }
    }, [loading, canShowAllRoles]);

    const fetchRoles = async () => {
        if (!canShowAllRoles) return;
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
            setRoles([]);
        } finally {
            setIsLoadingRoles(false);
        }
    };

    const handleAddRole = () => {
        setEditingRole(null);
        setIsRoleModalOpen(true);
    };

    const handleEditRole = (role) => {
        setEditingRole(role);
        setIsRoleModalOpen(true);
    };

    const handleSaveRole = (roleData) => {
        // After saving, refresh the roles list
        fetchRoles();
        setIsRoleModalOpen(false);
    };

    const handleDeleteRole = async (roleId) => {
        // Show confirmation dialog
        setRoleToDelete(roleId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteRole = async () => {
        if (!roleToDelete) return;

        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${baseUrl}/role/${roleToDelete}/delete`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                toast.success('Role deleted successfully');
                fetchRoles(); // Refresh the roles list
            } else {
                toast.error(response.data?.message || 'Failed to delete role');
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
            setRoleToDelete(null);
        }
    };

    const getPermissionName = (permission) => (
        typeof permission === 'object' && permission !== null
            ? permission.name || permission.permissionName || permission.permission || '-'
            : permission
    );

    const isPermissionAllowed = (permission) => (
        typeof permission !== 'object' || permission === null || permission.allowed !== false
    );

    const renderPermissionBadgeContent = (permissionName, allowed) => (
        <>
            {!allowed && (
                <AlertTriangle
                    size={13}
                    aria-label="Permission not allowed"
                    style={{ color: 'var(--warning-color)', flexShrink: 0 }}
                />
            )}
            <span>{permissionName}</span>
        </>
    );

    const normalizePermissionFlags = (flags) => {
        if (!flags.all_permission) {
            return flags;
        }

        return PERMISSION_ACTION_FIELDS.reduce((normalizedFlags, field) => ({
            ...normalizedFlags,
            [field.key]: field.key === 'all_permission'
        }), {});
    };

    const getPermissionFlags = (permission) => normalizePermissionFlags(
        PERMISSION_ACTION_FIELDS.reduce((flags, field) => ({
            ...flags,
            [field.key]: Boolean(typeof permission === 'object' && permission !== null && permission[field.key])
        }), {})
    );

    const handlePermissionClick = async (role, permission) => {
        const permissionName = getPermissionName(permission);
        if (permissionName === EXCLUDED_PERMISSION_POPUP_NAME) return;

        setSelectedPermission({
            id: null,
            roleName: role.name,
            name: permissionName,
            flags: getPermissionFlags(permission)
        });
        setIsLoadingPermissionAccess(true);

        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.post(`${baseUrl}/role/permission-access`, {
                roleId: role.id,
                permission: permissionName
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                const permissionAccess = response.data.data;
                const rolePermissionId = permissionAccess.rolePermission?.id ?? permissionAccess.rolePermissionId;
                setSelectedPermission(prev => {
                    if (!prev) return prev;

                    return {
                        ...prev,
                        id: rolePermissionId,
                        flags: normalizePermissionFlags(PERMISSION_ACTION_FIELDS.reduce((flags, field) => ({
                            ...flags,
                            [field.key]: Boolean(permissionAccess[field.key])
                        }), {}))
                    };
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
                toast.error('Failed to load permission access');
            }
        } finally {
            setIsLoadingPermissionAccess(false);
        }
    };

    const handlePermissionFlagChange = (key) => {
        setSelectedPermission(prev => {
            if (!prev) return prev;

            const nextValue = !prev.flags[key];
            const nextFlags = { ...prev.flags, [key]: nextValue };

            if (key === 'all_permission' && nextValue) {
                return {
                    ...prev,
                    flags: normalizePermissionFlags(nextFlags)
                };
            }

            if (key !== 'all_permission' && nextValue) {
                nextFlags.all_permission = false;
            }

            return { ...prev, flags: nextFlags };
        });
    };

    const handleAssignPermissionAccess = async () => {
        if (!selectedPermission?.id) {
            toast.error('Role permission id not found');
            return;
        }

        setIsAssigningPermissionAccess(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const flags = selectedPermission.flags;

            await axios.post(`${baseUrl}/role/update-permission-access`, {
                rolePermissionId: selectedPermission.id,
                add: Boolean(flags.add_permission),
                update: Boolean(flags.update_permission),
                delete: Boolean(flags.delete_permission),
                getAll: Boolean(flags.getAll_permission),
                get: Boolean(flags.get_permission),
                assign: Boolean(flags.assign_permission),
                all: Boolean(flags.all_permission)
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success('Permission access updated successfully');
            setSelectedPermission(null);
            fetchRoles();
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Failed to update permission access');
            }
        } finally {
            setIsAssigningPermissionAccess(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>Roles Management</h3>
                    <p className="subtitle">Manage user roles which determine what things a user can do</p>
                </div>
                <div className="header-actions">
                    <button
                        className={canAddRoles ? "primary-btn" : "primary-btn-disabled"}
                        onClick={handleAddRole}
                        disabled={!canAddRoles}
                    >
                        <Plus size={18} />
                        <span>Add Role</span>
                    </button>
                </div>
            </div>

            <RoleModal
                isOpen={isRoleModalOpen}
                onClose={() => setIsRoleModalOpen(false)}
                role={editingRole}
                onSave={handleSaveRole}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setRoleToDelete(null);
                }}
                onConfirm={confirmDeleteRole}
                title="Delete Role"
                message="Are you sure you want to delete this role? This action cannot be undone and will permanently remove the role and its permissions."
                confirmText="Delete"
                cancelText="Cancel"
            />

            {selectedPermission && (
                <div className="modal-overlay" onClick={() => setSelectedPermission(null)}>
                    <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ marginBottom: '0.25rem' }}>{selectedPermission.name}</h3>
                                <p className="subtitle" style={{ fontSize: '0.85rem' }}>{selectedPermission.roleName}</p>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedPermission(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {isLoadingPermissionAccess ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '0.8rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    background: 'var(--hover-bg)'
                                }}>
                                    {PERMISSION_ACTION_FIELDS.map(field => (
                                        <div key={field.key} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem'
                                        }}>
                                            <Skeleton variant="rounded" width={16} height={16} sx={{ borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                                            <Skeleton variant="text" width={field.label.length > 14 ? 140 : 110} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '0.8rem',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.5rem',
                                    padding: '1rem',
                                    background: 'var(--hover-bg)'
                                }}>
                                    {PERMISSION_ACTION_FIELDS.map(field => (
                                        <label key={field.key} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem',
                                            cursor: 'pointer',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.4
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPermission.flags[field.key]}
                                                onChange={() =>
                                                    canAssignPermission() &&
                                                    handlePermissionFlagChange(field.key)
                                                }
                                                disabled={!canAssignPermission()}
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    cursor: canAssignPermission() ? 'pointer' : 'not-allowed',
                                                    accentColor: 'var(--info-color)',
                                                    flexShrink: 0,
                                                    opacity: canAssignPermission() ? 1 : 0.6
                                                }}
                                            />
                                            <span>{field.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ marginBottom: '1rem', marginRight: '1rem' }}>
                            <button
                                className="secondary-btn"
                                onClick={() => setSelectedPermission(null)}
                                disabled={isAssigningPermissionAccess}
                            >
                                Close
                            </button>
                            <button
                                className={
                                    canAssignPermission()
                                        ? 'primary-btn'
                                        : 'primary-btn-disabled'
                                }
                                onClick={handleAssignPermissionAccess}
                                disabled={
                                    // isLoadingPermissionAccess ||
                                    // isAssigningPermissionAccess ||
                                    // !selectedPermission.id ||
                                    !canAssignPermission()
                                }
                            >
                                {isAssigningPermissionAccess ? 'Assigning...' : 'Assign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="content-card no-padding">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="col-role-name">Role Name</th>
                                <th className="col-permissions">Permissions</th>
                                <th className="col-notifications mobile-hidden">Notifications</th>
                                <th className="col-actions text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingRoles ? (
                                Array.from(new Array(5)).map((_, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="role-cell">
                                                <Skeleton variant="circular" width={16} height={16} sx={{ flexShrink: 0, bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="text" width={i % 2 === 0 ? "80%" : "60%"} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="permissions-list mobile-hidden">
                                                <Skeleton variant="rounded" width={50} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                            <div className="desktop-hidden" style={{ alignItems: 'center' }}>
                                                <Skeleton variant="rounded" width={100} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            <div className="permissions-list mobile-hidden">
                                                <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                            <div className="desktop-hidden" style={{ alignItems: 'center' }}>
                                                <Skeleton variant="rounded" width={100} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons justify-end">
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : roles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center" style={{ padding: '2rem' }}>
                                        <div style={{ color: 'var(--text-secondary)' }}>No roles found</div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {canShowAllRoles ? (
                                        roles.map((role) => (
                                            <tr key={role.id}>
                                                <td>
                                                    <div className="role-cell">
                                                        <Shield size={16} className="text-secondary" style={{ flexShrink: 0 }} />
                                                        <span className="font-medium">{role.name}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {showAllPermissions() ? (
                                                        <>
                                                            <div className="permissions-list mobile-hidden">
                                                                {role.permissions && role.permissions.length > 0 ? role.permissions.map((perm, index) => {
                                                                    const permissionName = getPermissionName(perm);
                                                                    const allowed = isPermissionAllowed(perm);
                                                                    const badgeStyle = {
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.35rem'
                                                                    };

                                                                    return permissionName === EXCLUDED_PERMISSION_POPUP_NAME || !canOpenPermissionAccessPopup ? (
                                                                        <span key={index} className="badge-pill" style={badgeStyle}>
                                                                            {permissionName === EXCLUDED_PERMISSION_POPUP_NAME
                                                                                ? permissionName
                                                                                : renderPermissionBadgeContent(permissionName, allowed)}
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            key={index}
                                                                            type="button"
                                                                            className="badge-pill"
                                                                            onClick={() => handlePermissionClick(role, perm)}
                                                                            style={{ ...badgeStyle, border: 'none', cursor: 'pointer' }}
                                                                        >
                                                                            {renderPermissionBadgeContent(permissionName, allowed)}
                                                                        </button>
                                                                    );
                                                                }) : <span className="text-muted">-</span>}
                                                            </div>
                                                            <div className="desktop-hidden" style={{ alignItems: 'center' }}>
                                                                <span className="badge-pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                                                                    {role.permissions?.length || 0}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : <span className="text-secondary">No Access</span>}
                                                </td>
                                                <td className="mobile-hidden">
                                                    {showNotifications() ? (
                                                        <>
                                                            <div className="permissions-list mobile-hidden">
                                                                {role.notifications && role.notifications.length > 0 ? role.notifications.map((notif, index) => (
                                                                    <span key={index} className="badge-pill badge-info" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>{notif}</span>
                                                                )) : <span className="text-muted">-</span>}
                                                            </div>
                                                            <div className="desktop-hidden" style={{ alignItems: 'center' }}>
                                                                {role.notifications && role.notifications.length > 0 ? (
                                                                    <span className="badge-pill" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                                                                        {role.notifications.length}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : <span className="text-secondary">No Access</span>}
                                                </td>
                                                <td>
                                                    <div className="action-buttons justify-end">
                                                        <button
                                                            className={canUpdateRole() ? "icon-action-btn" : "icon-action-btn-disabled"}
                                                            title="Edit"
                                                            onClick={() => handleEditRole(role)}
                                                            disabled={!canUpdateRole()}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            className={canDeleteRole() ? "icon-action-btn" : "icon-action-btn-disabled"}
                                                            title="Delete"
                                                            onClick={() => handleDeleteRole(role.id)}
                                                            disabled={!canDeleteRole()}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : null}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Roles;
