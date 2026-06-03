import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, MapPin, Briefcase, ClipboardList, Layers, Calendar, X, Bell } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Skeleton } from '@mui/material';

const Sidebar = ({ isOpen, onClose }) => {
    const { hasPermissionAccess, hasPermission, loading } = useUser();

    if (loading) {
        return (
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src={process.env.PUBLIC_URL + "/logo512.png"} alt="Service Gateway Logo" className="sidebar-logo" />
                </div>
                <nav className="sidebar-nav">
                    {Array.from(new Array(6)).map((_, i) => (
                        <div key={i} className="nav-item" style={{ cursor: 'default', pointerEvents: 'none' }}>
                            <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} animation="wave" />
                            <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} animation="wave" />
                        </div>
                    ))}
                </nav>
            </aside>
        );
    }

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <img src={process.env.PUBLIC_URL + "/logo512.png"} alt="Service Gateway Logo" className="sidebar-logo" />
                {/* <button className="sidebar-close" onClick={onClose}>
                    <X size={24} />
                </button> */}
            </div>
            <nav className="sidebar-nav">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                {hasPermission('Jobs Management') && (
                    <NavLink
                        to="/jobs"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <ClipboardList size={20} />
                        <span>Jobs</span>
                    </NavLink>
                )}
                {/* {hasPermission('Notification Management') && (
                    <NavLink
                        to="/notifications"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <Bell size={20} />
                        <span>Notifications</span>
                    </NavLink>
                )} */}

                {hasPermissionAccess('User Management', 'getAll') && (
                    <NavLink
                        to="/users"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <Users size={20} />
                        <span>Users</span>
                    </NavLink>
                )}

                {hasPermissionAccess('Role Management', 'getAll') && (
                    <NavLink
                        to="/roles"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <Shield size={20} />
                        <span>Roles</span>
                    </NavLink>
                )}

                {hasPermissionAccess('Centers Management', 'getAll') && (
                    <NavLink
                        to="/service-centers"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <MapPin size={20} />
                        <span>Centers</span>
                    </NavLink>
                )}

                {hasPermissionAccess('Services Management', 'getAll') && (
                    <NavLink
                        to="/services"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <Briefcase size={20} />
                        <span>Services</span>
                    </NavLink>
                )}

                {hasPermissionAccess('Cluster Management', 'getAll') && (
                    <NavLink
                        to="/clusters"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <Layers size={20} />
                        <span>Workflows</span>
                    </NavLink>
                )}

                {hasPermissionAccess('Holiday Management', 'getAll') && (
                    <NavLink
                        to="/calendar"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                    >
                        <Calendar size={20} />
                        <span>Calendar</span>
                    </NavLink>
                )}

            </nav>
            {/* Logout moved to Profile Dropdown */}
        </aside>
    );
};

export default Sidebar;
