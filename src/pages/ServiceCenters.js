import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Phone, Building, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Search, Clock, Loader2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@mui/material';
import ServiceCenterModal from '../components/ServiceCenterModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getServiceCenters, deleteServiceCenter } from '../services/serviceProviderService';

const ServiceCenters = () => {
    const navigate = useNavigate();
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [centerToDelete, setCenterToDelete] = useState(null);
    const [isViewOnly, setIsViewOnly] = useState(false);

    const itemsPerPage = 10;

    const fetchCenters = useCallback(async () => {
        setLoading(true);
        try {
            // API expects 0-indexed page
            const data = await getServiceCenters(currentPage - 1, itemsPerPage, searchQuery);
            if (data) {
                if (data.totalElements === 1 && data.content && data.content.length > 0) {
                    navigate(`/service-centers/${data.content[0].id}`, { replace: true });
                    return;
                }
                setCenters(data.content || []);
                setTotalPages(data.totalPages || 0);
                setTotalItems(data.totalElements || 0);
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
                toast.error('Failed to load service centers');
            }
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, navigate]);

    // Debounce Search & Fetch
    const lastFetchParams = useRef(null);
    useEffect(() => {
        const currentParams = JSON.stringify({ currentPage, searchQuery });
        if (lastFetchParams.current !== currentParams) {
            fetchCenters();
            lastFetchParams.current = currentParams;
        }
    }, [fetchCenters, currentPage, searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on search change
    };

    const handleSaveCenter = () => {
        // Refresh data after adding/updating center
        fetchCenters();
    };

    const handleAddClick = () => {
        setSelectedCenter(null);
        setIsViewOnly(false);
        setIsModalOpen(true);
    };

    const handleEditClick = (center) => {
        setSelectedCenter(center);
        setIsViewOnly(false);
        setIsModalOpen(true);
    };

    const handleViewClick = (center) => {
        navigate(`/service-centers/${center.id}`);
    };

    const handleDeleteClick = (id) => {
        setCenterToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDeleteCenter = async () => {
        if (!centerToDelete) return;

        try {
            await deleteServiceCenter(centerToDelete);
            toast.success('Service Center deleted successfully');
            fetchCenters(); // Refresh list
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
            setIsDeleteDialogOpen(false);
            setCenterToDelete(null);
        }
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Determines view mode based on total items count
    const isTableView = totalItems < 10;

    return (
        <div className="page-container">
            <ServiceCenterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCenter}
                initialData={selectedCenter}
                isViewOnly={isViewOnly}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setCenterToDelete(null);
                }}
                onConfirm={confirmDeleteCenter}
                title="Delete Service Center"
                message="Are you sure you want to delete this service center? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />

            <div className="page-header">
                <div>
                    <h3>Service Centers</h3>
                    <p className="subtitle">Manage service center locations</p>
                </div>
                <div className="header-actions">
                    <button className="primary-btn" onClick={handleAddClick}>
                        <Plus size={18} />
                        <span>Add Center</span>
                    </button>
                </div>
            </div>

            <div className="content-card">
                {/* Toolbar with Search - Always visible for consistency */}
                <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="search-bar" style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="text"
                                placeholder="Search centers..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="form-control"
                                style={{ paddingLeft: '35px', width: '100%' }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th className="mobile-hidden">Location</th>
                                    <th className="mobile-hidden">Contact</th>
                                    <th className="mobile-hidden">Opening Hours</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from(new Array(5)).map((_, i) => (
                                    <tr key={i}>
                                        <td><Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width="90%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></td>
                                        <td className="mobile-hidden"><Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} /></td>
                                        <td>
                                            <div className="action-buttons justify-end">
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <>
                        {isTableView ? (
                            /* Table View */
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th className="mobile-hidden">Location</th>
                                            <th className="mobile-hidden">Contact</th>
                                            <th className="mobile-hidden">Opening Hours</th>
                                            <th className="text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {centers.length > 0 ? (
                                            centers.map(center => (
                                                <tr key={center.id}>
                                                    <td className="font-medium">{center.name}</td>
                                                    <td className="mobile-hidden">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <MapPin size={14} className="text-muted" />
                                                            {center.location}
                                                        </div>
                                                    </td>
                                                    <td className="mobile-hidden">{center.contact}</td>
                                                    <td className="mobile-hidden">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            {`${center.fopenTime || ''} - ${center.fcloseTime || ''}`}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons justify-end">
                                                            <button
                                                                className="icon-action-btn text-primary"
                                                                title="View"
                                                                onClick={() => handleViewClick(center)}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                className="icon-action-btn"
                                                                title="Edit"
                                                                onClick={() => handleEditClick(center)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                className="icon-action-btn text-danger"
                                                                title="Delete"
                                                                onClick={() => handleDeleteClick(center.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center" style={{ padding: '2rem', color: '#94a3b8' }}>
                                                    No service centers found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Card Grid View */
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
                                {centers.map(center => (
                                    <div key={center.id} className="content-card" style={{
                                        borderLeft: '4px solid #3b82f6',
                                        transition: 'transform 0.2s',
                                        cursor: 'pointer',
                                        marginBottom: 0
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                            <h5 style={{ margin: 0, fontSize: '1.1rem' }}>{center.name}</h5>
                                            <div className="action-buttons">
                                                <button
                                                    className="icon-action-btn text-primary"
                                                    title="View"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewClick(center);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="icon-action-btn"
                                                    title="Edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditClick(center);
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="icon-action-btn text-danger"
                                                    title="Delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent card click
                                                        handleDeleteClick(center.id);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <span style={{ color: '#1174f6ff' }}>
                                                    {`${center.fopenTime || ''} - ${center.fcloseTime || ''}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalItems > 0 && (
                            <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.5rem' }}>
                                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
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

                                    {totalPages <= 5 ? (
                                        [...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => paginate(i + 1)}
                                                style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '4px',
                                                    background: currentPage === i + 1 ? 'var(--primary-color)' : 'var(--modal-bg)',
                                                    color: currentPage === i + 1 ? 'white' : 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    border: '1px solid var(--border-color)'
                                                }}
                                            >
                                                {i + 1}
                                            </button>
                                        ))
                                    ) : (
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <span style={{ padding: '0.25rem', color: 'var(--text-primary)' }}>Page {currentPage} of {totalPages}</span>
                                        </div>
                                    )}

                                    <button
                                        className="icon-btn"
                                        onClick={() => paginate(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        style={{ padding: '0.5rem', borderRadius: '4px', background: currentPage === totalPages ? 'var(--hover-bg)' : 'var(--modal-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ServiceCenters;
