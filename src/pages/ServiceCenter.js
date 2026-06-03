import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Layout, Briefcase, ChevronLeft, MapPin, Phone, Clock, Mail, Edit2, Loader2, UserPlus, Trash2, Layers, Ban, CheckCircle, Plus, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Skeleton } from '@mui/material';
import { getServiceCenterById, getEmployeesByCenterId, removeUserFromCenter, getServicePointsByCenterId, deleteServicePoint, getClusters, removeClusterFromCenter, getClustersByCenterId, removeClusterFromCenterById, getClusterServicesByCenterClusterId, toggleClusterServiceStatus, getServiceCenters, updateCenterClusterService, reorderClusterServices, checkServicesAssignToPoint } from '../services/serviceProviderService';
import AssignUserModal from '../components/AssignUserModal';
import AssignClusterModal from '../components/AssignClusterModal';
import ServiceCenterModal from '../components/ServiceCenterModal';
import ServicePointModal from '../components/ServicePointModal';
import AssignServiceToPointModal from '../components/AssignServiceToPointModal';
import ManagePointServicesModal from '../components/ManagePointServicesModal';
import EditClusterServiceModal from '../components/EditClusterServiceModal';
import ClusterWarningModal from '../components/ClusterWarningModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useUser } from '../context/UserContext';
import '../App.css';
import Tooltip from '@mui/material/Tooltip';

const ServiceCenter = () => {
    const { hasPermissionAccess } = useUser();
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('employees');
    const [loading, setLoading] = useState(true);
    const [centerDetails, setCenterDetails] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [employeeToRemove, setEmployeeToRemove] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [servicePoints, setServicePoints] = useState([]);
    const [pointsLoading, setPointsLoading] = useState(false);
    const [isPointModalOpen, setIsPointModalOpen] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isAssignPointModalOpen, setIsAssignPointModalOpen] = useState(false);
    const [selectedServiceForAssignment, setSelectedServiceForAssignment] = useState(null);
    const [pointServiceAssignments, setPointServiceAssignments] = useState({});
    const [isManageServicesModalOpen, setIsManageServicesModalOpen] = useState(false);
    const [selectedPointForServices, setSelectedPointForServices] = useState(null);
    const [isDeletePointDialogOpen, setIsDeletePointDialogOpen] = useState(false);
    const [pointToDelete, setPointToDelete] = useState(null);
    const [isDeletingPoint, setIsDeletingPoint] = useState(false);
    const [clusters, setClusters] = useState([]);
    const [clustersLoading, setClustersLoading] = useState(false);
    const [isAssignClusterModalOpen, setIsAssignClusterModalOpen] = useState(false);
    const [isRemoveClusterDialogOpen, setIsRemoveClusterDialogOpen] = useState(false);
    const [clusterToRemove, setClusterToRemove] = useState(null);
    const [isRemovingCluster, setIsRemovingCluster] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [clusterServices, setClusterServices] = useState([]);
    const [clusterServicesLoading, setClusterServicesLoading] = useState(false);
    const [isAddCenterModalOpen, setIsAddCenterModalOpen] = useState(false);

    // Edit Cluster Service Modal State
    const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
    const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null);

    // Cluster warnings state
    const [clusterWarnings, setClusterWarnings] = useState({});
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [warningModalData, setWarningModalData] = useState({ clusterName: '', services: [] });

    const [serviceCenterCount, setServiceCenterCount] = useState(0);

    const canAddCenter = () =>
        hasPermissionAccess(
            'Center Management',
            'adding'
        );

    const assignEmployeeToCenter = () =>
        hasPermissionAccess(
            'Employee Management',
            'assigning'
        );

    const removeEmployeeFromCenter = () =>
        hasPermissionAccess(
            'Employee Management',
            'deleting'
        );

    const addServicePoints = () =>
        hasPermissionAccess(
            'Points Management',
            'adding'
        );

    const updateServicePoints = () =>
        hasPermissionAccess(
            'Points Management',
            'updating'
        );

    const removeServicePoints = () =>
        hasPermissionAccess(
            'Points Management',
            'deleting'
        );

    const getServicePointDetails = () =>
        hasPermissionAccess(
            'Points Management',
            'getting'
        );

    const assignWorkflow = () =>
        hasPermissionAccess(
            'Cluster Management',
            'assigning'
        );

    const getWorkflow = () =>
        hasPermissionAccess(
            'Assigned Clusters Management',
            'getting'
        );

    const editWorkflow = () =>
        hasPermissionAccess(
            'Assigned Clusters Management',
            'updating'
        );

    const allowAddCenter = canAddCenter();

    const allowAssignEmployeeToCenter = assignEmployeeToCenter();

    const allowRemoveEmployeeFromCenter = removeEmployeeFromCenter();

    const allowAddServicePoints = addServicePoints();

    const allowUpdateServicePoints = updateServicePoints();

    const allowRemoveServicePoints = removeServicePoints();

    const allowGetServicePointDetails = getServicePointDetails();

    const allowAssignWorkflow = assignWorkflow();

    const allowGetWorkflow = getWorkflow();

    const allowEditWorkflow = editWorkflow();

    const fetchEmployees = async () => {
        setEmployeesLoading(true);
        try {
            const data = await getEmployeesByCenterId(id);
            setEmployees(data || []);
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
            setEmployeesLoading(false);
        }
    };

    const fetchServicePoints = async () => {
        setPointsLoading(true);
        try {
            const data = await getServicePointsByCenterId(id);
            setServicePoints(data || []);
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
            setPointsLoading(false);
        }
    };

    const updateClusterWarnings = async (clusterList) => {
        if (clusterList && clusterList.length > 0) {
            const warnings = {};
            await Promise.all(clusterList.map(async (cluster) => {
                try {
                    const unassignedServices = await checkServicesAssignToPoint(cluster.id);
                    if (unassignedServices && unassignedServices.length > 0) {
                        warnings[cluster.id] = unassignedServices;
                    }
                } catch (err) {
                    console.error(`Failed to check assignments for cluster ${cluster.id}`, err);
                }
            }));
            setClusterWarnings(warnings);
        }
    };

    const fetchClusters = async (showLoader = true) => {
        if (showLoader) setClustersLoading(true);
        try {
            const data = await getClustersByCenterId(id);
            setClusters(data || []);
            await updateClusterWarnings(data);
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
            if (showLoader) setClustersLoading(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [centerData, employeesData, pointsData, clustersData, centersData] = await Promise.all([
                getServiceCenterById(id),
                getEmployeesByCenterId(id),
                getServicePointsByCenterId(id),
                getClustersByCenterId(id),
                getServiceCenters(0, 5)
            ]);

            if (centerData) setCenterDetails(centerData);
            if (employeesData) setEmployees(employeesData);
            if (pointsData) setServicePoints(pointsData);
            if (clustersData) {
                setClusters(clustersData);
                await updateClusterWarnings(clustersData);
            }
            if (centersData) setServiceCenterCount(centersData.totalElements || 0);
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Failed to load service center details');
            }
            navigate('/service-centers');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveEmployee = async () => {
        if (!employeeToRemove) return;
        setIsRemoving(true);
        try {
            await removeUserFromCenter(employeeToRemove.userId);
            toast.success('Employee removed from center successfully');
            fetchEmployees();
        } catch (error) {
            if (error?.response?.data?.data) {
                if (error?.response?.data?.code === 1) {
                    toast.info("Session expired. Please login again.");
                    navigate('/login');
                } else {
                    toast.error(error?.response?.data?.data);
                }
            } else {
                toast.error('Failed to load service center details');
            }
        } finally {
            setIsRemoving(false);
            setEmployeeToRemove(null);
            setIsRemoveDialogOpen(false);
        }
    };

    const handleDeletePoint = async () => {
        if (!pointToDelete) return;
        setIsDeletingPoint(true);
        try {
            await deleteServicePoint(pointToDelete.id);
            toast.success('Service point deleted successfully');
            fetchServicePoints();
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
            setIsDeletingPoint(false);
            setPointToDelete(null);
            setIsDeletePointDialogOpen(false);
        }
    };
    const handleRemoveClusterClick = (cluster) => {
        setClusterToRemove(cluster);
        setIsRemoveClusterDialogOpen(true);
    };

    const confirmRemoveCluster = async () => {
        if (!clusterToRemove) return;
        setIsRemovingCluster(true);

        try {
            await removeClusterFromCenterById(clusterToRemove.id);
            toast.success(`Cluster "${clusterToRemove.name}" removed successfully`);
            fetchClusters(false);
            setIsRemoveClusterDialogOpen(false);
            setClusterToRemove(null);
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
            setIsRemovingCluster(false);
        }
    };

    const fetchClusterServices = async (centerClusterId, showLoader = true) => {
        if (showLoader) setClusterServicesLoading(true);
        try {
            const data = await getClusterServicesByCenterClusterId(centerClusterId);
            setClusterServices(data || []);
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
            setClusterServices([]);
        } finally {
            if (showLoader) setClusterServicesLoading(false);
        }
    };

    const handleClusterClick = (cluster) => {
        if (selectedCluster === cluster.id) {
            // Deselect if clicking the same cluster
            setSelectedCluster(null);
            setClusterServices([]);
        } else {
            // Select new cluster and fetch its services
            setSelectedCluster(cluster.id);
            fetchClusterServices(cluster.id);
        }
    };


    const handleEditClusterService = (service) => {
        setSelectedServiceForEdit(service);
        setIsEditServiceModalOpen(true);
    };

    const handleUpdateService = async (updatedService) => {
        try {
            await updateCenterClusterService(updatedService);
            toast.success('Service details updated successfully');
            setIsEditServiceModalOpen(false);
            setSelectedServiceForEdit(null);

            // Refresh list
            if (selectedCluster) {
                await fetchClusterServices(selectedCluster, false);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update service details');
        }
    };

    const handleToggleServiceStatus = async (service) => {
        try {
            // Optimistic UI update
            const updatedServices = clusterServices.map(s =>
                s.id === service.id ? { ...s, disabled: !s.disabled } : s
            );
            setClusterServices(updatedServices);

            // Call API to toggle status
            await toggleClusterServiceStatus(service.id);

            const newStatus = !service.disabled;
            // toast.success(`Service "${service.service}" ${newStatus ? 'disabled' : 'enabled'} successfully`);

            // Refresh the services list to ensure consistency
            if (selectedCluster) {
                await fetchClusterServices(selectedCluster, false);
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

            // Revert optimistic update on error
            if (selectedCluster) {
                await fetchClusterServices(selectedCluster, false);
            }
        }
    };

    const handleMoveService = async (index, direction) => {
        if (!selectedCluster) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= clusterServices.length) return;

        const updatedServices = [...clusterServices];
        // Swap items
        [updatedServices[index], updatedServices[newIndex]] = [updatedServices[newIndex], updatedServices[index]];

        // Update local order numbers
        let i = 1;

        updatedServices.forEach(service => {
            if (!service.disabled) {
                service.orderNumber = i++;
            }
        });

        // Update local state immediately (optimistic UI)
        setClusterServices(updatedServices);

        console.log("updatedServices: ", updatedServices);


        try {
            await reorderClusterServices(selectedCluster, updatedServices);
            // Optional: toast.success('Order updated');
        } catch (error) {
            toast.error('Failed to save new order');
            // Revert on error
            if (selectedCluster) {
                await fetchClusterServices(selectedCluster, false);
            }
        }
    };


    const lastFetchId = useRef(null);
    useEffect(() => {
        if (id && lastFetchId.current !== id) {
            fetchData();
            lastFetchId.current = id;
        }
    }, [id, navigate]);

    useEffect(() => {
        if (activeTab === 'clusters') {
            fetchClusters(false);
        }
    }, [activeTab]);

    const renderEmployeesSection = () => (
        <div className="tab-section-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h4 style={{ margin: 0 }}>Assigned Employees</h4>
                {allowAssignEmployeeToCenter ? (
                    <button
                        className="primary-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => setIsAssignModalOpen(true)}
                    >
                        <UserPlus size={18} />
                        Assign Employee
                    </button>
                ) : (
                    <button
                        className="primary-btn-disabled"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => { toast.warn("Required Employee Assign Permission"); }}
                    >
                        <UserPlus size={18} />
                        Assign Employee
                    </button>
                )}

            </div>

            {employeesLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" width="100%" height={60} sx={{ borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    ))}
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th className="mobile-hidden">Role</th>
                                <th className="mobile-hidden">Email</th>
                                <th className="mobile-hidden">Contact</th>
                                {/* <th>Status</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length > 0 ? (
                                employees.map(emp => (
                                    <tr key={emp.userId}>
                                        <td className="font-medium">{emp.userName}</td>
                                        <td className="mobile-hidden">{emp.role?.name || emp.role || 'N/A'}</td>
                                        <td className="mobile-hidden">{emp.email}</td>
                                        <td className="mobile-hidden">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                {emp.contact}
                                                {allowRemoveEmployeeFromCenter ? (
                                                    <button
                                                        className="icon-action-btn text-danger"
                                                        title="Remove from Center"
                                                        onClick={() => {
                                                            setEmployeeToRemove(emp);
                                                            setIsRemoveDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="icon-action-btn-disabled text-danger"
                                                        title="Remove from Center"
                                                        onClick={() => { toast.warn("Required Employee Deleting Permission"); }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center" style={{ padding: '2rem', color: '#94a3b8' }}>
                                        No employees assigned to this center.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderPointsSection = () => (
        <div className="tab-section-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h4 style={{ margin: 0 }}>Active Service Points</h4>
                {allowAddServicePoints ? (
                    <button
                        className="primary-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => {
                            setSelectedPoint(null);
                            setIsPointModalOpen(true);
                        }}
                    >
                        <Layout size={18} />
                        Add Service Point
                    </button>
                ) : (
                    <button
                        className="primary-btn-disabled"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => { toast.warn("Required Points Add Permission"); }}
                    >
                        <Layout size={18} />
                        Add Service Point
                    </button>

                )}
            </div>

            {pointsLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" width="100%" height={180} sx={{ borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
                    {servicePoints.length > 0 ? (
                        servicePoints.map(point => (
                            <div key={point.id} className="stat-card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: !point.temporaryClosed ? '#10b981' : '#ef4444' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div className="icon-box-primary" style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                                        <span className='text-primary'>{point.shortName || <Layout size={24} className="text-primary" />}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        background: !point.temporaryClosed ? '#10b98115' : '#ef444415',
                                        color: !point.temporaryClosed ? '#10b981' : '#ef4444',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {!point.temporaryClosed ? 'Active' : 'Closed'}
                                    </span>
                                </div>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{point.name}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <Clock size={16} />
                                        <span>{point.openTime} - {point.closeTime}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <Briefcase size={14} style={{ color: 'var(--primary-color)' }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {point.serviceCount} service(s) assigned
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                        {allowGetServicePointDetails ? (
                                            <button
                                                className="icon-action-btn text-primary"
                                                style={{ color: 'var(--primary-color)' }}
                                                onClick={() => {
                                                    setSelectedPointForServices(point);
                                                    setIsManageServicesModalOpen(true);
                                                }}
                                            >
                                                <Briefcase size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                className="icon-action-btn-disabled text-primary"
                                                style={{ color: 'var(--primary-color)' }}
                                                onClick={() => { toast.warn("Required Points Get Permission"); }}
                                            >
                                                <Briefcase size={16} />
                                            </button>
                                        )}

                                        {allowUpdateServicePoints ? (
                                            <button
                                                className="icon-action-btn"
                                                onClick={() => {
                                                    setSelectedPoint(point);
                                                    setIsPointModalOpen(true);
                                                }}
                                                title="Edit Details"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                className="icon-action-btn-disabled"
                                                onClick={() => { toast.warn("Required Points Update Permission"); }}
                                                title="Edit Details"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}

                                        {allowRemoveServicePoints ? (
                                            <button
                                                className="icon-action-btn text-danger"
                                                onClick={() => {
                                                    setPointToDelete(point);
                                                    setIsDeletePointDialogOpen(true);
                                                }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        ) : (

                                            <button
                                                className="icon-action-btn-disabled text-danger"
                                                onClick={() => { toast.warn("Required Points Delete Permission"); }}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}

                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'var(--hover-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                            <Layout size={40} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No service points added yet.</p>
                            <button
                                onClick={() => setIsPointModalOpen(true)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' }}
                            >
                                Create your first service point
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderClustersSection = () => (
        <div className="tab-section-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h4 style={{ margin: 0 }}>Active Service Workflows</h4>
                {
                    allowAssignWorkflow ? (
                        <button
                            className="primary-btn"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => setIsAssignClusterModalOpen(true)}
                        >
                            Add Workflow
                        </button>
                    ) : (

                        <button
                            className="primary-btn-disabled"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => { toast.warn("Required Cluster Assign Permission"); }}
                        >
                            Add Workflow
                        </button>

                    )
                }

            </div>

            {clustersLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" width="100%" height={100} sx={{ borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.05)' }} />
                    ))}
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', marginBottom: selectedCluster ? '2rem' : '0' }}>
                        {clusters.length > 0 ? (
                            clusters.map(cluster => (
                                <div
                                    key={cluster.id}
                                    className="stat-card"
                                    onClick={() => handleClusterClick(cluster)}
                                    style={{
                                        padding: '1.5rem',
                                        border: selectedCluster === cluster.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                        borderRadius: '16px',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        background: selectedCluster === cluster.id ? 'rgba(37, 99, 235, 0.05)' : 'var(--card-bg)',
                                        transform: selectedCluster === cluster.id ? 'translateY(-2px)' : 'none',
                                        boxShadow: selectedCluster === cluster.id ? '0 8px 16px rgba(37, 99, 235, 0.15)' : 'none'
                                    }}
                                >
                                    {
                                        allowAssignWorkflow ? (
                                            <button
                                                className="icon-action-btn text-danger"
                                                style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveClusterClick(cluster);
                                                }}
                                                title="Remove from center"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        ) : (

                                            <button
                                                className="icon-action-btn-disabled text-danger"
                                                style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
                                                onClick={() => { toast.warn("Required Cluster Assign Permission"); }}
                                                title="Remove from center"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                        )
                                    }


                                    {clusterWarnings[cluster.id] && (
                                        <button
                                            className="icon-action-btn text-danger"
                                            style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, marginRight: '2rem', color: '#f59e0b' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setWarningModalData({
                                                    clusterName: cluster.name,
                                                    services: clusterWarnings[cluster.id]
                                                });
                                                setIsWarningModalOpen(true);
                                            }}
                                            title="View unassigned services"
                                        >
                                            <AlertTriangle size={16} />
                                        </button>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '2rem' }}>
                                        <div className="icon-box-primary" style={{
                                            background: selectedCluster === cluster.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                                            padding: '0.75rem',
                                            borderRadius: '12px',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <Layers size={24} className="text-primary" />
                                        </div>
                                        <h4 style={{ margin: '0', fontSize: '1.1rem' }}>{cluster.name}</h4>
                                    </div>
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        marginTop: '0.75rem',
                                        marginBottom: '0',
                                        fontStyle: 'italic'
                                    }}>
                                        {selectedCluster === cluster.id ? 'Click to collapse' : 'Click to view services'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'var(--hover-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                                <Layers size={40} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No workflows found.</p>
                            </div>
                        )}
                    </div>

                    {selectedCluster && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '1.5rem',
                            background: 'var(--card-bg)',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            animation: 'fadeIn 0.3s ease',
                            minHeight: '400px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Briefcase size={20} className="text-primary" />
                                    Workflow Services
                                </h4>
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--hover-bg)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px'
                                }}>
                                    {clusterServicesLoading ? 'Loading...' : `${clusterServices.length} services`}
                                </span>
                            </div>

                            {clusterServicesLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                </div>
                            ) : clusterServices.length > 0 ? (
                                <>
                                    {allowGetWorkflow ? (
                                        <div className="table-responsive">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th className="mobile-hidden">Order</th>
                                                        <th>Service Name</th>
                                                        <th className="mobile-hidden">Service Time</th>
                                                        <th className="mobile-hidden">Total Price</th>
                                                        <th className="mobile-hidden">Down Payment</th>
                                                        <th className="mobile-hidden">Status</th>
                                                        <th style={{ textAlign: 'center' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {clusterServices.map((service, index) => (
                                                        <tr key={index} style={{
                                                            opacity: service.disabled ? 0.6 : 1,
                                                            background: service.disabled ? 'var(--hover-bg)' : 'transparent'
                                                        }}>
                                                            <td className="mobile-hidden">
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '8px',
                                                                    background: 'rgba(37, 99, 235, 0.1)',
                                                                    color: 'var(--primary-color)',
                                                                    fontWeight: '600',
                                                                    fontSize: '0.9rem'
                                                                }}>
                                                                    {service.orderNumber}
                                                                </span>
                                                            </td>
                                                            <td className="font-medium">{service.service}</td>
                                                            <td className="mobile-hidden">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                                                                    <span>{service.serviceTime}</span>
                                                                </div>
                                                            </td>
                                                            <td className="mobile-hidden">
                                                                <span style={{
                                                                    fontWeight: '600',
                                                                    color: 'var(--primary-color)'
                                                                }}>
                                                                    Rs. {service.total.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="mobile-hidden">
                                                                <span style={{ color: service.downPay > 0 ? '#10b981' : 'var(--text-secondary)' }}>
                                                                    Rs. {service.downPay.toLocaleString()}
                                                                </span>
                                                            </td>
                                                            <td className="mobile-hidden">
                                                                <span style={{
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: '600',
                                                                    padding: '0.35rem 0.75rem',
                                                                    borderRadius: '20px',
                                                                    background: service.disabled ? '#ef444415' : '#10b98115',
                                                                    color: service.disabled ? '#ef4444' : '#10b981',
                                                                    textTransform: 'uppercase',
                                                                    letterSpacing: '0.05em'
                                                                }}>
                                                                    {service.disabled ? 'Disabled' : 'Active'}
                                                                </span>
                                                            </td>
                                                            {allowEditWorkflow ?
                                                                <td>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                                        <button
                                                                            className="icon-action-btn text-primary"
                                                                            onClick={() => handleEditClusterService(service)}
                                                                            title="Edit Service"
                                                                            style={{
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="icon-action-btn"
                                                                            onClick={() => handleToggleServiceStatus(service)}
                                                                            title={service.disabled ? 'Enable Service' : 'Disable Service'}
                                                                            style={{
                                                                                color: service.disabled ? '#10b981' : '#ef4444',
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                        >
                                                                            {service.disabled ? (
                                                                                <CheckCircle size={16} />
                                                                            ) : (
                                                                                <Ban size={16} />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </td> :

                                                                <td>
                                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>

                                                                        <button
                                                                            className="icon-action-btn-disabled text-primary"
                                                                            onClick={() => { toast.warn("Required Assigned Cluster Update Permission"); }}
                                                                            title="Edit Service"
                                                                            style={{
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                        >
                                                                            <Edit2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            className="icon-action-btn-disabled"
                                                                            onClick={() => { toast.warn("Required Assigned Cluster Update Permission"); }}
                                                                            title={service.disabled ? 'Enable Service' : 'Disable Service'}
                                                                            style={{
                                                                                color: service.disabled ? '#10b981' : '#ef4444',
                                                                                transition: 'all 0.2s ease'
                                                                            }}
                                                                        >
                                                                            {service.disabled ? (
                                                                                <CheckCircle size={16} />
                                                                            ) : (
                                                                                <Ban size={16} />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            }
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--hover-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>

                                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Required Assigned Clusters Management Permission to get the content.</p>
                                        </div>
                                    )}
                                </>


                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--hover-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                                    <Briefcase size={40} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No services found for this cluster.</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // Dummy Data for rest of the tabs
    const dummyServicePoints = [
        { id: 1, name: "Counter 01", type: "Standard", status: "Open" },
        { id: 2, name: "Counter 02", type: "Express", status: "Closed" },
        { id: 3, name: "Counter 03", type: "Premium", status: "Open" },
        { id: 4, name: "Self-Service Kiosk", type: "Digital", status: "Online" }
    ];

    const dummyServices = [
        { id: 1, name: "Standard Repair", time: "01:30:00", price: "Rs. 2,500" },
        { id: 2, name: "Premium Inspection", time: "00:45:00", price: "Rs. 1,200" },
        { id: 3, name: "Oil Change & Filter", time: "01:00:00", price: "Rs. 4,500" },
        { id: 4, name: "Full Diagnostics", time: "02:00:00", price: "Rs. 3,800" }
    ];

    if (loading) {
        return (
            <div className="page-container">
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <div>
                            <Skeleton variant="text" width="60%" height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                            <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        </div>
                    </div>
                </div>

                <div className="service-center-detail-grid">
                    <div className="content-card">
                        <Skeleton variant="text" width="40%" height={24} sx={{ marginBottom: '1.5rem', bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Skeleton variant="circular" width={18} height={18} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ flex: 1 }}>
                                        <Skeleton variant="text" width="30%" height={14} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                        <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="content-card">
                        <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} variant="text" width={80} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <Skeleton variant="text" width="40%" height={24} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                            <Skeleton variant="rounded" width="30%" height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        </div>
                        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (!centerDetails) return null;

    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        className="icon-btn"
                        onClick={() => navigate('/service-centers')}
                        style={{ background: 'var(--hover-bg)', padding: '0.5rem', borderRadius: '50%' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h3>{centerDetails.name}</h3>
                        <p className="subtitle">Detailed view of service center operations</p>
                    </div>
                </div>
                {serviceCenterCount <= 1 && (
                    <>
                        {
                            allowAddCenter ? (
                                <button
                                    className="primary-btn"
                                    onClick={() => setIsAddCenterModalOpen(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={18} />
                                    Add Center
                                </button>
                            ) : (
                                <button
                                    className="primary-btn-disabled"
                                    onClick={() => { toast.warn("Required Center Add Permission"); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Plus size={18} />
                                    Add Center
                                </button>

                            )
                        }
                    </>

                )}
            </div>

            <div className="service-center-detail-grid">
                {/* Sidebar Details Card */}
                <div className="content-card center-info-sidebar">
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>General Info</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <MapPin size={18} className="text-muted" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Location</small>
                                <span style={{ fontSize: '0.9rem', overflowWrap: 'break-word' }}>{centerDetails.location}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Phone size={18} className="text-muted" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Contact</small>
                                <span style={{ fontSize: '0.9rem', overflowWrap: 'break-word' }}>{centerDetails.contact}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Mail size={18} className="text-muted" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Email</small>
                                <span style={{ fontSize: '0.9rem', overflowWrap: 'break-word' }}>{centerDetails.email || 'N/A'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Clock size={18} className="text-muted" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                                <small style={{ color: 'var(--text-secondary)', display: 'block' }}>Opening Hours</small>
                                <span style={{ fontSize: '0.9rem', color: '#10b981', overflowWrap: 'break-word' }}>
                                    {centerDetails.fopenTime} - {centerDetails.fcloseTime}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs */}
                {/* Desktop View - Tabbed Content */}
                <div className="content-card mobile-hidden">
                    <div className="tabs" style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <button
                            className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
                            onClick={() => setActiveTab('employees')}
                            style={{
                                padding: '1rem 0',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'employees' ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: activeTab === 'employees' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'employees' ? '600' : '400',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexShrink: 0
                            }}
                        >
                            <Users size={18} />
                            Assigned Employees
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`}
                            onClick={() => setActiveTab('points')}
                            style={{
                                padding: '1rem 0',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'points' ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: activeTab === 'points' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'points' ? '600' : '400',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexShrink: 0
                            }}
                        >
                            <Layout size={18} />
                            Service Points
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'clusters' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clusters')}
                            style={{
                                padding: '1rem 0',
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'clusters' ? '2px solid var(--primary-color)' : '2px solid transparent',
                                color: activeTab === 'clusters' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                fontWeight: activeTab === 'clusters' ? '600' : '400',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexShrink: 0
                            }}
                        >
                            <Layers size={18} />
                            Service Workflows
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'employees' && renderEmployeesSection()}
                        {activeTab === 'points' && renderPointsSection()}
                        {activeTab === 'clusters' && renderClustersSection()}
                    </div>
                </div>

                {/* Mobile View - Vertical Card Stacking */}
                <div className="desktop-hidden" style={{ flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                    <div className="content-card">
                        {renderEmployeesSection()}
                    </div>
                    <div className="content-card">
                        {renderPointsSection()}
                    </div>
                    <div className="content-card">
                        {renderClustersSection()}
                    </div>
                </div>
            </div>

            <AssignUserModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                centerId={id}
                onSave={fetchEmployees}
            />

            <ServiceCenterModal
                isOpen={isAddCenterModalOpen}
                onClose={() => setIsAddCenterModalOpen(false)}
                onSave={() => navigate('/service-centers')}
            />

            <AssignClusterModal
                isOpen={isAssignClusterModalOpen}
                onClose={() => setIsAssignClusterModalOpen(false)}
                centerId={id}
                onSave={() => fetchClusters(false)}
            />

            <ServicePointModal
                isOpen={isPointModalOpen}
                onClose={() => setIsPointModalOpen(false)}
                centerId={id}
                onSave={fetchServicePoints}
                initialData={selectedPoint}
            />

            <ManagePointServicesModal
                isOpen={isManageServicesModalOpen}
                onClose={() => {
                    fetchServicePoints();
                    setIsManageServicesModalOpen(false);
                }}
                servicePoint={selectedPointForServices}
                assignedServices={selectedPointForServices ? (pointServiceAssignments[selectedPointForServices.id] || []) : []}
                onUpdateServices={(pointId, services) => {
                    setPointServiceAssignments(prev => ({
                        ...prev,
                        [pointId]: services
                    }));
                }}
            />

            <ConfirmDialog
                isOpen={isRemoveDialogOpen}
                onClose={() => {
                    if (!isRemoving) {
                        setIsRemoveDialogOpen(false);
                        setEmployeeToRemove(null);
                    }
                }}
                onConfirm={handleRemoveEmployee}
                title="Remove Employee"
                message={`Are you sure you want to remove ${employeeToRemove?.userName} from this service center?`}
                confirmText={isRemoving ? "Removing..." : "Remove"}
                type="danger"
            />
            <ConfirmDialog
                isOpen={isDeletePointDialogOpen}
                onClose={() => {
                    if (!isDeletingPoint) {
                        setIsDeletePointDialogOpen(false);
                        setPointToDelete(null);
                    }
                }}
                onConfirm={handleDeletePoint}
                title="Delete Service Point"
                message={`Are you sure you want to delete ${pointToDelete?.name}? This action cannot be undone.`}
                confirmText={isDeletingPoint ? "Deleting..." : "Delete"}
                type="danger"
            />

            <EditClusterServiceModal
                isOpen={isEditServiceModalOpen}
                onClose={() => setIsEditServiceModalOpen(false)}
                service={selectedServiceForEdit}
                onSave={handleUpdateService}
            />

            <ConfirmDialog
                isOpen={isRemoveClusterDialogOpen}
                onClose={() => {
                    if (!isRemovingCluster) {
                        setIsRemoveClusterDialogOpen(false);
                        setClusterToRemove(null);
                    }
                }}
                onConfirm={confirmRemoveCluster}
                title="Remove Workflow"
                message={`Are you sure you want to remove the workflow "${clusterToRemove?.name}" from this center?`}
                confirmText={isRemovingCluster ? "Removing..." : "Remove"}
                type="danger"
            />
            <ClusterWarningModal
                isOpen={isWarningModalOpen}
                onClose={() => setIsWarningModalOpen(false)}
                clusterName={warningModalData.clusterName}
                services={warningModalData.services}
            />
        </div>
    );
};

export default ServiceCenter;
