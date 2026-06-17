import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, User, Phone, Mail, FileText, Briefcase, CheckCircle, Clock, Edit2, Trash2, ShieldCheck, ShieldAlert, Bell } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getConfig } from '../config';
import ConfirmDialog from '../components/ConfirmDialog';
import InfoModal from '../components/InfoModal';
import UserModal from '../components/UserModal';
import NotificationAccessModal from '../components/NotificationAccessModal';
import { Skeleton } from '@mui/material';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Users = () => {
    const { hasPermissionAccess } = useUser();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);

    const [specialSearchOne, setSpecialSearchOne] = useState('');
    const [specialSearchTwo, setSpecialSearchTwo] = useState('');
    const [searchFilter, setSearchFilter] = useState('none'); // 'none', 'nic', 'contact'

    // Deletion State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Approval/Rejection State
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [userToAct, setUserToAct] = useState(null);

    // Add User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Notification Access Modal State
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [selectedUserForNotification, setSelectedUserForNotification] = useState(null);

    // Info Modal State
    const [infoModal, setInfoModal] = useState({
        isOpen: false,
        title: '',
        content: ''
    });

    const lastFetchParams = useRef(null);

    const canAddUser = () =>
        hasPermissionAccess(
            'User Management',
            'adding'
        );

    const canUpdateUser = () =>
        hasPermissionAccess(
            'User Management',
            'updating'
        );

    const canDeleteUser = () =>
        hasPermissionAccess(
            'User Management',
            'deleting'
        );

    const canGetUser = () =>
        hasPermissionAccess(
            'User Management',
            'getting'
        );

    const canDecryptData = () =>
        hasPermissionAccess(
            'Decrypt Data',
            'getting'
        );

    const getAllocationData = () =>
        hasPermissionAccess(
            'Allocate Data',
            'getting'
        );

    const allowAddUser = canAddUser();
    const allowUpdateUser = canUpdateUser();
    const allowDeleteUser = canDeleteUser();
    const allowGetUser = canGetUser();
    const allowDecryptData = canDecryptData();

    useEffect(() => {
        const currentParams = JSON.stringify({ currentPage, searchQuery, searchFilter });
        if (lastFetchParams.current !== currentParams) {
            fetchUsers();
            lastFetchParams.current = currentParams;
        }
    }, [currentPage, searchQuery, searchFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');

            const payload = {
                page: currentPage - 1, // API is 0-indexed
                size: usersPerPage,
                searchText: searchFilter === 'none' ? searchQuery : '',
                specialSearchOne: searchFilter === 'nic' ? searchQuery : '',
                specialSearchTwo: searchFilter === 'contact' ? searchQuery : '',
                sort: { direction: 'DESC', property: 'id' } // Default sort
            };

            const response = await axios.post(`${baseUrl}/user/get-all`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                // Handle response.data.data as either list or Page object
                if (Array.isArray(response.data.data)) {
                    setUsers(response.data.data);
                    // If backend doesn't return total count, we can't calculate pages accurately without it.
                    // For now, setting totalUsers to length logic or if response has a metadata field
                    console.log(response.data.totalCount || response.data.data.length);
                    setTotalUsers(response.data.totalCount || response.data.data.length);
                } else if (response.data.data.content) {
                    // If it follows Spring Page structure
                    setUsers(response.data.data.content);
                    setTotalUsers(response.data.data.totalElements);
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
            setLoading(false);
        }
    };

    // Pagination logic
    // Server-side pagination means 'users' is already the current page content
    const totalPages = Math.ceil(totalUsers / usersPerPage) || 1;

    const totPages = totalUsers / usersPerPage;

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleSpecialSearchOne = (e) => {
        setSpecialSearchOne(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleSpecialSearchTwo = (e) => {
        setSpecialSearchTwo(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const getUserTypeBadgeClass = (type) => {
        return 'badge-pill badge-neutral';
    };

    // Action Handlers
    const handleAddUser = () => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user) => {
        // Prepare user object for the modal
        // Depending on how roles are returned (object or name), we might need to handle it in the modal or here
        // The modal expects roleId in user.role.id or user.roleId
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleApproveClick = (user) => {
        setUserToAct(user);
        setIsApproveDialogOpen(true);
    };

    const handleRejectClick = (user) => {
        setUserToAct(user);
        setIsRejectDialogOpen(true);
    };

    const confirmApproveUser = async () => {
        if (!userToAct) return;
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            await axios.put(`${baseUrl}/user/${userToAct.id}/approve`, {
                userId: userToAct.id
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success(`User ${userToAct.name || userToAct.firstName} approved successfully`);
            fetchUsers();
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
            setUserToAct(null);
            setIsApproveDialogOpen(false);
        }
    };

    const confirmRejectUser = async () => {
        if (!userToAct) return;
        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            await axios.put(`${baseUrl}/user/${userToAct.id}/reject`, {
                userId: userToAct.id
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            toast.success(`User ${userToAct.name || userToAct.firstName} rejected successfully`);
            fetchUsers();
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
            setUserToAct(null);
            setIsRejectDialogOpen(false);
        }
    };


    const handleNotificationAccessClick = (user) => {
        setSelectedUserForNotification(user);
        setIsNotificationModalOpen(true);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${baseUrl}/user/${userToDelete.id}/delete`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data) {
                toast.success('User deleted successfully');
                fetchUsers();
            } else {
                toast.error(response.data?.message || 'Failed to delete user');
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
            setUserToDelete(null);
        }
    };

    const handleDecrypt = async (value) => {

        if (value === undefined) {
            setInfoModal({
                isOpen: true,
                title: 'Contact Information',
                content: "No contact information available"
            });
            return;
        }

        try {
            const payload = {
                key: value
            };

            const baseUrl = getConfig().baseUrl;
            const token = localStorage.getItem('token');
            const response = await axios.post(`${baseUrl}/user/decrypt`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                setInfoModal({
                    isOpen: true,
                    title: 'Contact Information',
                    content: response.data.data
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
            setUserToDelete(null);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>User Management</h3>
                    <p className="subtitle">Manage users of system and employees</p>
                </div>
                <div className="header-actions">
                    {
                        allowAddUser ? (
                            <button className="primary-btn" onClick={handleAddUser}>
                                <Plus size={18} />
                                <span>Add User</span>
                            </button>
                        ) : (
                            <button
                                className="primary-btn-disabled"
                                onClick={() => { toast.warn("Required User Add Permission"); }}
                            >
                                <Plus size={18} />
                                <span>Add User</span>
                            </button>

                        )
                    }
                </div>
            </div>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setUserToDelete(null);
                }}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
            />

            <ConfirmDialog
                isOpen={isApproveDialogOpen}
                onClose={() => {
                    setIsApproveDialogOpen(false);
                    setUserToAct(null);
                }}
                onConfirm={confirmApproveUser}
                title="Approve User"
                message={`Are you sure you want to approve ${userToAct?.name || (userToAct?.firstName + ' ' + userToAct?.lastName)}?`}
                confirmText="Approve"
                cancelText="Cancel"
                type="success"
                icon={ShieldCheck}
            />

            <ConfirmDialog
                isOpen={isRejectDialogOpen}
                onClose={() => {
                    setIsRejectDialogOpen(false);
                    setUserToAct(null);
                }}
                onConfirm={confirmRejectUser}
                title="Reject User"
                message={`Are you sure you want to reject ${userToAct?.name || (userToAct?.firstName + ' ' + userToAct?.lastName)}?`}
                confirmText="Reject"
                cancelText="Cancel"
                type="warning"
                icon={ShieldAlert}
            />

            <InfoModal
                isOpen={infoModal.isOpen}
                onClose={() => setInfoModal({ ...infoModal, isOpen: false })}
                title={infoModal.title}
                content={infoModal.content}
            />

            <NotificationAccessModal
                isOpen={isNotificationModalOpen}
                onClose={() => {
                    setIsNotificationModalOpen(false);
                    setSelectedUserForNotification(null);
                }}
                user={selectedUserForNotification}
            />

            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => {
                    setIsUserModalOpen(false);
                    setSelectedUser(null);
                }}
                onSave={fetchUsers}
                user={selectedUser}
            />

            <div className="content-card">
                {/* Search and Toolbar */}
                <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="text"
                                placeholder={searchFilter === 'nic' ? "Search by NIC..." : searchFilter === 'contact' ? "Search by Contact..." : "Search users..."}
                                value={searchQuery}
                                onChange={handleSearch}
                                className="form-control"
                                style={{ paddingLeft: '35px', width: '100%' }}
                            />
                        </div>
                        <div className="search-filters mobile-hidden" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className={`filter-btn ${searchFilter === 'none' ? 'active' : ''}`}
                                onClick={() => setSearchFilter('none')}
                            >
                                None
                            </button>

                            {allowDecryptData ? (
                                <button
                                    className={`filter-btn ${searchFilter === 'nic' ? 'active' : ''}`}
                                    onClick={() => setSearchFilter('nic')}
                                >
                                    NIC
                                </button>
                            ) : (

                                <button
                                    className={`filter-btn-disabled nic`}
                                    onClick={() => { toast.warn("Required Decrypt Get Permission"); }}
                                >
                                    NIC
                                </button>

                            )}

                            {allowDecryptData ? (
                                <button
                                    className={`filter-btn ${searchFilter === 'contact' ? 'active' : ''}`}
                                    onClick={() => setSearchFilter('contact')}
                                >
                                    Contact
                                </button>
                            ) : (
                                <button
                                    className={`filter-btn-disabled contact`}
                                    onClick={() => { toast.warn("Required Decrypt Get Permission"); }}
                                >
                                    Contact
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th className="mobile-hidden">Email</th>
                                <th className="mobile-hidden">Contact</th>
                                <th className="mobile-hidden">NIC</th>
                                <th className="mobile-hidden">User Type</th>
                                <th className="mobile-hidden">Role</th>
                                <th className="mobile-hidden">Service Center</th>
                                <th className="mobile-hidden">Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from(new Array(5)).map((_, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="user-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Skeleton variant="circular" width={32} height={32} />
                                                <Skeleton variant="text" width={120} height={20} />
                                            </div>
                                        </td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width={150} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width={100} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width={100} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="rounded" width={80} height={24} sx={{ borderRadius: '12px' }} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width={100} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width={120} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width={80} /></td>
                                        <td>
                                            <div className="action-buttons justify-end">
                                                <Skeleton variant="circular" width={28} height={28} />
                                                <Skeleton variant="circular" width={28} height={28} className="mobile-hidden" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : totalUsers === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center" style={{ padding: '2rem' }}>
                                        <div style={{ color: 'var(--text-secondary)' }}>No users found</div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user.id || index}>
                                        <td>
                                            <div className="user-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="avatar-placeholder" style={{ width: '32px', height: '32px', flexShrink: 0, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={16} className="text-secondary" />
                                                </div>
                                                <span className="font-medium">{user.name || `${user.firstName || ''} ${user.lastName || ''}`}</span>
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {/* <Mail size={14} className="text-muted" /> */}
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {/* <Phone size={14} className="text-muted" />
                                                {user.contact || user.mobile} */}
                                                {
                                                    user.mobile !== null && user.mobile !== "" ? (
                                                        allowDecryptData ? (
                                                            <button className='icon-action-btn text-success' onClick={() => handleDecrypt(user.mobile)}>View Contact</button>
                                                        ) : (
                                                            <button className='icon-action-btn-disabled'
                                                                onClick={() => { toast.warn("Required Decrypt Get Permission"); }}
                                                            >Not allowed</button>
                                                        )
                                                    ) : (
                                                        <span> -- </span>
                                                    )
                                                }
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {/* <FileText size={14} className="text-muted" /> */}
                                                {
                                                    user.nic && user.nic !== "" ? (
                                                        allowDecryptData ? (
                                                            <button className='icon-action-btn text-success' onClick={() => handleDecrypt(user.nic)}>View NIC</button>
                                                        ) : (
                                                            <button className='icon-action-btn-disabled'
                                                                onClick={() => { toast.warn("Required Decrypt Get Permission"); }}
                                                            >Not allowed</button>
                                                        )

                                                    ) : (
                                                        <span> -- </span>
                                                    )
                                                }
                                                {/* {user.nic} */}
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            <span className={getUserTypeBadgeClass(user.userType)}>
                                                {user.userType}
                                            </span>
                                        </td>
                                        <td className="mobile-hidden">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {/* <Briefcase size={14} className="text-muted" /> */}
                                                {user.role?.name || user.role || '-'}
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            {user.serviceCenter ? (
                                                <div className="service-center-info">
                                                    <div className="font-medium">{user.serviceCenter.name || user.serviceCenter}</div>
                                                </div>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td className="mobile-hidden">
                                            <div className={`status-text ${user.providerApproved === "approved" ? 'text-secondary' : 'text-primary'}`} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {user.providerApproved === "approved" ? (
                                                    <><CheckCircle size={10} /> Approved</>
                                                ) : (
                                                    <><Clock size={10} /> Pending</>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons justify-end">
                                                {/* Approve Button - Only if not already approved or strictly for providers? Assuming logical check */}
                                                {user.providerApproved === "pending" && user.serviceCenter && (
                                                    <div className="mobile-hidden" style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            className="icon-action-btn text-success"
                                                            title="Approve"
                                                            onClick={() => handleApproveClick(user)}
                                                        >
                                                            <ShieldCheck size={16} />
                                                        </button>
                                                        <button
                                                            className="icon-action-btn text-warning"
                                                            title="Reject"
                                                            onClick={() => handleRejectClick(user)}
                                                        >
                                                            <ShieldAlert size={16} />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* <button
                                                    className="icon-action-btn text-info"
                                                    title="Notification Access"
                                                    onClick={() => handleNotificationAccessClick(user)}
                                                >
                                                    <Bell size={16} />
                                                </button> */}
                                                {
                                                    allowUpdateUser ? (
                                                        <button
                                                            className="icon-action-btn"
                                                            title="Edit"
                                                            onClick={() => handleEditUser(user)}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="icon-action-btn-disabled"
                                                            title="Edit"
                                                            onClick={() => { toast.warn("Required User Update Permission"); }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )
                                                }
                                                {
                                                    allowDeleteUser ? (
                                                        <button
                                                            className="icon-action-btn text-danger mobile-hidden"
                                                            title="Delete"
                                                            onClick={() => handleDeleteClick(user)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="icon-action-btn-disabled"
                                                            title="Delete"
                                                            onClick={() => { toast.warn("Required User Delete Permission"); }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )
                                                }
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && totalUsers > 0 && (
                    <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem' }}>
                        <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                            Showing {(currentPage - 1) * usersPerPage + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} entries
                        </div>
                        <div className="pagination-controls" style={{ display: 'flex', gap: '5px' }}>
                             <button
                                className="icon-btn"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{ padding: '0.5rem', borderRadius: '4px', background: currentPage === 1 ? 'var(--hover-bg)' : 'var(--modal-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {/* Simple Page Numbers */}
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    // onClick={() => paginate(i + 1)}
                                    style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '4px',
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        border: '1px solid var(--border-color)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {currentPage}
                                </button>
                            ))}

                            <button
                                className="icon-btn"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={totPages < 1}
                                style={{ padding: '0.5rem', borderRadius: '4px', background: currentPage === totalPages ? 'var(--hover-bg)' : 'var(--modal-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: totPages < 1 ? 'not-allowed' : 'pointer' }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
