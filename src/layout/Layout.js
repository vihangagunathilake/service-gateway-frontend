import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { UserX } from 'lucide-react';
import { toast } from 'react-toastify';

import { UserProvider, useUser } from '../context/UserContext';
import { NotificationProvider, useNotification } from '../context/NotificationContext';

const formatBadgeCount = (n) => n > 9 ? '9+' : n;

const MobileFooter = () => {
    const { noAgentCount } = useNotification();
    const { hasNotificationAccess } = useUser();

    return (
        <footer className="mobile-footer" style={{ gap: '2.5rem' }}>
            {hasNotificationAccess('NO_AGENT_FOR_JOB') && (
            <button 
                className="nav-item-btn" 
                onClick={() => {
                    toast.warning("Warning: No agent available at the service point.");
                }} 
                aria-label="No Agent in Counter Notification"
                style={{ color: noAgentCount > 0 ? '#ef4444' : 'var(--text-secondary)' }}
            >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserX size={22} />
                    {noAgentCount > 0 && (
                        <span className="badge" style={{ backgroundColor: '#ef4444', top: '-6px', right: '-8px' }}>{formatBadgeCount(noAgentCount)}</span>
                    )}
                </div>
                <span className="nav-item-label">No Agent</span>
            </button>
            )}
        </footer>
    );
};

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <UserProvider>
            <NotificationProvider>
                <div className="app-layout">
                    {/* Mobile Overlay */}
                    {isSidebarOpen && (
                        <div className="sidebar-overlay" onClick={closeSidebar}></div>
                    )}
                    
                    <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                    
                    <div className="main-content">
                        <Header toggleSidebar={toggleSidebar} />
                        <main className="page-content">
                            <Outlet />
                        </main>
                        <MobileFooter />
                    </div>
                </div>
            </NotificationProvider>
        </UserProvider>
    );
};

export default Layout;
