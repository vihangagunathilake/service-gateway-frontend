import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bell, UserCircle, User, Settings, LogOut, Building, Menu } from 'lucide-react';
import SettingsModal from '../components/SettingsModal';
import { getConfig } from '../config';
import { toast } from 'react-toastify';
import { useUser } from '../context/UserContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const Header = ({ toggleSidebar }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);

    const { userInfo, loading: isLoadingUserData, hasPermission } = useUser();
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const baseUrl = getConfig().baseUrl || 'http://localhost:8686/service-gateway';
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${baseUrl}/notification/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

                if (response.data && response.data.data) {
                    const data = response.data.data;
                    setNotifications(data);

                    // Set count to the number of unread notifications
                    setNotificationCount(data.filter(n => !(n.read || n.isRead)).length);
                }
        } catch (error) {
            console.error('Failed to fetch notification summary:', error);
        }
    };

    // Fetch initial notification summary only if user has permission
    useEffect(() => {
        if (hasPermission('Notification Permission')) {
            fetchNotifications();
        }
    }, [userInfo, hasPermission]);

    // WebSocket connection for notifications
    useEffect(() => {
        let socketUserId = userInfo?.userId;
        
        // Fallback to extract userId from JWT token if missing from context
        if (!socketUserId) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    socketUserId = JSON.parse(jsonPayload).user || '';
                } catch (e) {
                    console.error('Error decoding token for websocket', e);
                }
            }
        }

        console.info("WebSocket resolving userId to: ", socketUserId);
        if (!hasPermission('Notification Permission')) return;

        const baseUrl = getConfig().baseUrl || 'http://localhost:8686/service-gateway';

        const client = new Client({
            webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
            onConnect: () => {
                console.log('Connected to WebSocket for notifications');
                client.subscribe(`/topic/notifications/user/${socketUserId}`, (message) => {
                    if (message.body) {
                        try {
                            const notification = JSON.parse(message.body);
                            console.log("notification: ", notification);

                            // Re-fetch summaries to get the exact unread count and updated list
                            fetchNotifications();
                        } catch (e) {
                            console.error('Error parsing notification:', e);
                        }
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [userInfo]);

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
                    <h2 className="header-title">{userInfo.provider}</h2>
                    <span className="badge-pill">{userInfo.providerId}</span>
                </div>
                <div className="header-right">
                    {hasPermission('Notification Permission') && (
                        <div className="notification-section" ref={notificationRef} style={{ position: 'relative' }}>
                            <button className="icon-btn" onClick={() => {
                                if (!isNotificationOpen) {
                                    fetchNotifications();
                                }
                                setIsNotificationOpen(!isNotificationOpen);
                            }}>
                                <Bell size={20} />
                                {notificationCount > 0 && <span className="badge">{notificationCount}</span>}
                            </button>

                            {isNotificationOpen && (
                                <div className="profile-dropdown notification-dropdown">
                                    <div className="notification-dropdown-header">
                                        <h4>Notifications</h4>
                                    </div>
                                    <div className="notification-dropdown-list">
                                        {notifications.length > 0 ? (
                                            notifications.map((notif, idx) => (
                                                <div
                                                    key={notif.id || idx}
                                                    className={`notification-dropdown-item ${(notif.read || notif.isRead) ? '' : 'unread'}`}
                                                    onClick={async () => {
                                                    if (!(notif.read || notif.isRead) && notif.id) {
                                                        try {
                                                            const baseUrl = getConfig().baseUrl || 'http://localhost:8686/service-gateway';
                                                            const token = localStorage.getItem('token');
                                                            await axios.put(`${baseUrl}/notification/user-notification/${notif.id}/mark-as-read`, {}, {
                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                            });

                                                            // Update local state to immediately show it as read
                                                            const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true, isRead: true } : n);
                                                            setNotifications(updated);
                                                            setNotificationCount(updated.filter(n => !(n.read || n.isRead)).length);
                                                        } catch (err) {
                                                            console.error('Failed to mark notification as read:', err);
                                                        }
                                                    }

                                                    if (notif.link) {
                                                        navigate(notif.link);
                                                        setIsNotificationOpen(false);
                                                    }
                                                }}>
                                                    <p><b>{notif.count}</b> {notif.description}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="notification-dropdown-empty">
                                                No new notifications
                                            </div>
                                        )}
                                    </div>
                                    <div className="notification-dropdown-footer">
                                        <span>View All</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="profile-section" ref={dropdownRef}>
                        <button
                            className="profile-trigger"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <UserCircle size={32} className="profile-icon" />
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
