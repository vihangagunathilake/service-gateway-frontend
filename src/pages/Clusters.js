import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Search, Plus, Layers, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@mui/material';
import ClusterModal from '../components/ClusterModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { getClusters, deleteCluster } from '../services/serviceProviderService';
import { toast } from 'react-toastify';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Clusters = () => {
    const navigate = useNavigate();

    const { hasPermissionAccess } = useUser();

    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [clustersList, setClustersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [clusterToDelete, setClusterToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const isInitialMount = useRef(true);

    const canAddWorkflow = () =>
        hasPermissionAccess(
            'Cluster Management',
            'adding'
        );

    const canDeleteWorkflow = () =>
        hasPermissionAccess(
            'Cluster Management',
            'deleting'
        );

    const canEditWorkflow = () =>
        hasPermissionAccess(
            'Cluster Management',
            'updating'
        );

    const allowAddWorkflow = canAddWorkflow();

    const allowDeleteWorkflow = canDeleteWorkflow();

    const allowEditWorkflow = canEditWorkflow();

    const fetchClusters = async () => {
        try {
            setLoading(true);
            const data = await getClusters();
            // Sort services by orderNumber within each cluster
            const sortedClusters = (data || []).map(cluster => ({
                ...cluster,
                services: cluster.services?.sort((a, b) => a.orderNumber - b.orderNumber) || []
            }));
            setClustersList(sortedClusters);
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

    useEffect(() => {
        if (isInitialMount.current) {
            fetchClusters();
            isInitialMount.current = false;
        }
    }, []);

    const handleClusterSaved = () => {
        // Refresh the list from API to get fresh data
        fetchClusters();
        setSelectedCluster(null);
    };

    const handleEdit = (cluster) => {
        setSelectedCluster(cluster);
        setIsCreateModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedCluster(null);
        setIsCreateModalOpen(true);
    };

    const handleDeleteClick = (cluster) => {
        setClusterToDelete(cluster);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!clusterToDelete) return;

        setIsDeleting(true);
        try {
            await deleteCluster(clusterToDelete.id);
            toast.success('Workflow deleted successfully');
            fetchClusters();
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
            setIsDeleting(false);
            setClusterToDelete(null);
            setIsDeleteDialogOpen(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Healthy': return { background: 'var(--success-bg)', color: 'var(--success-color)' };
            case 'Attention': return { background: 'var(--warning-bg)', color: 'var(--warning-color)' };
            case 'Critical': return { background: 'var(--danger-bg)', color: 'var(--danger-color)' };
            default: return { background: 'var(--hover-bg)', color: 'var(--text-secondary)' };
        }
    };

    const filteredClusters = clustersList.filter(cluster =>
        cluster.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cluster.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cluster.manager.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h3>Service Workflows</h3>
                    <p className="subtitle">Workflows are useful for your customers and make it easy to choose multiple services at once.</p>
                </div>
                <div className="header-actions">
                    {allowAddWorkflow ? (
                        <button className="primary-btn" onClick={handleCreate}>
                            <Plus size={18} />
                            <span>Create Workflow</span>
                        </button>
                    ) :
                        <button className="primary-btn-disabled"
                            onClick={() => { toast.warn("Required Workflow Add Permission"); }}>
                            <Plus size={18} />
                            <span>Create Workflow</span>
                        </button>
                    }
                </div>
            </div>

            {/* <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card">
                    <h3>Total Workflows</h3>
                    <div className="stat-value">03</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Across 03 Regions</div>
                </div>
                <div className="stat-card">
                    <h3>Active Centers</h3>
                    <div className="stat-value">30</div>
                    <div style={{ color: 'var(--success-color)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '600' }}>↑ 100% Operational</div>
                </div>
                <div className="stat-card">
                    <h3>Peak Efficiency</h3>
                    <div className="stat-value">89%</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Average across Western</div>
                </div>
            </div> */}

            <div className="content-card">
                <div className="table-toolbar" style={{ marginBottom: '1.5rem' }}>
                    <div className="search-bar" style={{ position: 'relative', width: '100%', maxWidth: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search workflows, regions or managers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="form-control"
                            style={{ paddingLeft: '40px', width: '100%' }}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Workflow Name</th>
                                <th className="mobile-hidden">Services</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, index) => (
                                    <tr key={`skeleton-${index}`}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.1)' }} className="mobile-hidden" />
                                                    <Skeleton variant="text" width={120} height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                </div>
                                                <div className="desktop-hidden" style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                                                    <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                    <Skeleton variant="rectangular" width={60} height={20} sx={{ borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            <div className="permissions-list">
                                                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-buttons justify-end justify-mobile-center">
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} className="mobile-hidden" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredClusters.length > 0 ? (
                                filteredClusters.map(cluster => (
                                    <tr key={cluster.id}>
                                        <td className="font-medium">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="mobile-hidden" style={{ padding: '8px', background: 'var(--info-bg)', color: 'var(--info-color)', borderRadius: '8px' }}>
                                                        <Layers size={16} />
                                                    </div>
                                                    {cluster.name}
                                                </div>
                                                <div className="desktop-hidden" style={{ marginTop: '4px' }}>
                                                    <div className="permissions-list" style={{ flexWrap: 'wrap' }}>
                                                        {cluster.services && cluster.services.map((service, index) => (
                                                            <span key={service.id || index} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '2px 8px' }}>
                                                                <span style={{
                                                                    background: 'var(--primary-color)',
                                                                    color: 'white',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    borderRadius: '50%',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '0.6rem',
                                                                    fontWeight: '600',
                                                                    flexShrink: 0
                                                                }}>
                                                                    {service.orderNumber || index + 1}
                                                                </span>
                                                                {typeof service === 'string' ? service : service.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="mobile-hidden">
                                            <div className="permissions-list">
                                                {cluster.services && cluster.services.map((service, index) => (
                                                    <span key={service.id || index} className="badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{
                                                            background: 'var(--primary-color)',
                                                            color: 'white',
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '50%',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.7rem',
                                                            fontWeight: '600',
                                                            flexShrink: 0
                                                        }}>
                                                            {service.orderNumber || index + 1}
                                                        </span>
                                                        {typeof service === 'string' ? service : service.name}
                                                    </span>
                                                ))}
                                                {(!cluster.services || cluster.services.length === 0) && (
                                                    <span className="text-secondary" style={{ fontSize: '0.85rem' }}>No services assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="action-buttons justify-end justify-mobile-center">
                                                {allowEditWorkflow ?
                                                    <button className="icon-action-btn" title="Edit" onClick={() => handleEdit(cluster)}>
                                                        <Pencil size={16} />
                                                    </button> :
                                                    <button className="icon-action-btn-disabled" title="Edit"
                                                        onClick={() => toast.warn("Required Workflow Update Permission")}>
                                                        <Pencil size={16} />
                                                    </button>}

                                                {allowDeleteWorkflow ?
                                                    <button className="icon-action-btn text-danger mobile-hidden" title="Delete" onClick={() => handleDeleteClick(cluster)}>
                                                        <Trash2 size={16} />
                                                    </button> :
                                                    <button className="icon-action-btn-disabled text-danger mobile-hidden" title="Delete" onClick={() => toast.warn("Required Workflow Delete Permission")}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                }


                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center" style={{ padding: '3rem', color: 'var(--text-secondary)' }}>
                                        No workflows found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ClusterModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setSelectedCluster(null);
                }}
                onClusterSaved={handleClusterSaved}
                cluster={selectedCluster}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    if (!isDeleting) {
                        setIsDeleteDialogOpen(false);
                        setClusterToDelete(null);
                    }
                }}
                onConfirm={confirmDelete}
                title="Delete Cluster"
                message={`Are you sure you want to delete the cluster "${clusterToDelete?.name}"? This action cannot be undone.`}
                confirmText={isDeleting ? "Deleting..." : "Delete"}
                type="danger"
            />
        </div>
    );
};

export default Clusters;
