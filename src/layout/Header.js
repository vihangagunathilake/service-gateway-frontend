import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserCircle, User, Settings, LogOut, Building, Menu, Bell, UserX } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import { getConfig } from '../config';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import { useNotification } from '../context/NotificationContext';

const formatBadgeCount = (n) => n > 9 ? '9+' : n;

const Header = ({ toggleSidebar }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { userInfo, loading: isLoadingUserData, hasPermission, hasNotificationAccess } = useUser();
    const { count, markAsNotified, noAgentCount } = useNotification();
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);



    const handleLogout = async () => {
        const cleanup = () => {
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userType');
            localStorage.removeItem('providerId');
            navigate('/login');
        };

        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');
        if (token) {
            await axios.get(`${baseUrl}/user/logout`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then(() => {
                cleanup();
            }).catch((error) => {
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
            });
        }
    };

    const openSettings = () => {
        setIsDropdownOpen(false);
        setIsSettingsOpen(true);
    };

    return (
        <>
            <header className="header">
                <div className="header-left">
                    <button className="menu-toggle" onClick={toggleSidebar}>
                        <Menu size={24} />
                    </button>
                    <h2 className={`header-title${userInfo.loggedInPoint ? ' header-title-hide-mobile' : ''}`}>{userInfo.provider}</h2>
                    <span className="commit-badge-count-disabled">{userInfo.providerId}</span>
                    {userInfo.loggedInPoint && (
                        <span className="commit-badge-count">{userInfo.loggedInPoint}</span>
                    )}
                </div>
                <div className="header-right">
                    {hasNotificationAccess('NO_AGENT_FOR_JOB') && (
                    <button 
                        className="nav-item-btn header-no-agent-btn" 
                        onClick={() => {
                            toast.warning("Warning: No agent available at the service point.");
                        }} 
                        aria-label="No Agent in Counter Notification"
                        style={{ color: noAgentCount > 0 ? '#ef4444' : 'var(--text-secondary)' }}
                    >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserX size={20} />
                            {noAgentCount > 0 && (
                                <span className="badge" style={{ backgroundColor: '#ef4444', top: '-6px', right: '-8px' }}>{formatBadgeCount(noAgentCount)}</span>
                            )}
                        </div>
                        <span className="nav-item-label">No Agent</span>
                    </button>
                    )}

                    {hasNotificationAccess('GENERAL') && (
                    <button 
                        className="nav-item-btn" 
                        onClick={markAsNotified} 
                        aria-label="Notifications"
                    >
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={20} />
                            {count > 0 && (
                                <span className="badge" style={{ backgroundColor: '#ef4444', top: '-6px', right: '-8px' }}>{formatBadgeCount(count)}</span>
                            )}
                        </div>
                        <span className="nav-item-label">Notifications</span>
                    </button>
                    )}

                    <div className="profile-section" ref={dropdownRef}>
                        <button
                            className="profile-trigger"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {userInfo.image
                                ? <img src={userInfo.image} alt="profile" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                : <UserCircle size={32} className="profile-icon" />
                            }
                            <span className="profile-name">{userInfo.name}</span>
                        </button>

                        {isDropdownOpen && (
                            <div className="profile-dropdown">
                                <div className="profile-info">
                                    <div className="profile-info-name">{userInfo.name}</div>
                                    <div className="profile-info-email">{userInfo.email}</div>
                                    <div className="profile-info-type">{userInfo.userType}</div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button onClick={() => { setIsDropdownOpen(false); navigate('/user-profile'); }} className="dropdown-item">
                                    <User size={16} />
                                    <span>User Profile</span>
                                </button>
                                <button onClick={() => { setIsDropdownOpen(false); navigate('/service-provider-profile'); }} className="dropdown-item">
                                    <Building size={16} />
                                    <span>Service Provider Profile</span>
                                </button>
                                <button onClick={openSettings} className="dropdown-item">
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </button>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item text-primary">
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
};

export default Header;
