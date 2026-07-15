import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef
} from 'react';

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
    getUserHeaderData,
    getUserPermissions,
    getUserPermissionAccess
} from '../services/userService';

import { getRoleNotifications } from '../services/notificationService';

const UserContext = createContext();

const parseJwt = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export const UserProvider = ({ children }) => {

    const [userInfo, setUserInfo] = useState({
        name: 'Loading...',
        email: '',
        userType: '',
        userTypeId: localStorage.getItem('userType') || '',
        provider: '',
        providerId: '',
        userId: '',
        image: null,
        loggedInPoint: null,
        loggedInPointId: localStorage.getItem('servicePointId') || null
    });

    const [permissions, setPermissions] = useState([]);
    const [permissionAccess, setPermissionAccess] = useState([]);
    const [notificationAccess, setNotificationAccess] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const fetchRef = useRef(false);

    useEffect(() => {

        if (fetchRef.current) {
            return;
        }

        fetchRef.current = true;

        const token = localStorage.getItem('token');

        if (!token) {
            setLoading(false);
            navigate('/login');
            return;
        }

        loadUser();

    }, [navigate]);

    /*
    ==================================================
    LOAD USER
    ==================================================
    */

    const loadUser = async () => {

        try {

            setLoading(true);

            // Step 1: load permissions first
            const [
                userPermissions,
                userPermissionAccess
            ] = await Promise.all([
                getUserPermissions(),
                getUserPermissionAccess()
            ]);

            setPermissions(userPermissions || []);
            setPermissionAccess(userPermissionAccess || []);

            // Step 2: load notification access
            const roleNotifications = await getRoleNotifications();
            setNotificationAccess(roleNotifications || []);

            // Step 3: load header data (triggers NotificationContext via userId)
            const userData = await getUserHeaderData();

            const token = localStorage.getItem('token');
            const decoded = parseJwt(token);
            const tokenUserId = decoded?.user || decoded?.userId || '';

            setUserInfo({
                name: userData.userName || 'User',
                email: userData.email || '',
                userType: userData.userType || 'User',
                userTypeId: String(userData.userTypeId || localStorage.getItem('userType') || ''),
                provider: userData.serviceCenter || '',
                providerId: userData.providerId || '',
                userId: tokenUserId || userData.userId || userData.id || '',
                image: userData.image || null,
                loggedInPoint: userData.loggedInPoint || null,
                loggedInPointId: userData.loggedInPointId || localStorage.getItem('servicePointId') || null
            });

        } catch (error) {

            console.error(
                'Failed to fetch user context data:',
                error
            );

            if (error?.response?.data?.code === 1) {

                toast.info(
                    'Session expired. Please login again.'
                );

                navigate('/login');

            } else if (
                error?.message ===
                'No authentication token found'
            ) {

                navigate('/login');

            } else {

                toast.error(
                    error?.response?.data?.data
                    || 'Failed to initialize user session'
                );
            }

        } finally {
            setLoading(false);
        }
    };

    /*
    ==================================================
    BASIC PERMISSION
    ==================================================
    */

    const hasPermission = (permissionName) => {
        return permissions.includes(permissionName);
    };

    /*
    ==================================================
    ACCESS PERMISSION
    ==================================================
    */

    const hasPermissionAccess = (
        permissionName,
        ...accessTypes
    ) => {

        const permission = permissionAccess.find(
            p => p.permission === permissionName
        );

        if (!permission) {
            return false;
        }

        // Full access
        if (permission.allowAll) {
            return true;
        }

        // Check any requested access
        return accessTypes.some(
            type => permission[type]
        );
    };

    /*
    ==================================================
    NOTIFICATION ACCESS
    ==================================================
    */

    const hasNotificationAccess = (notificationType) => {
        return notificationAccess.includes(notificationType);
    };

    /*
    ==================================================
    CONTEXT VALUE
    ==================================================
    */

    const value = {
        userInfo,
        permissions,
        permissionAccess,
        notificationAccess,
        loading,

        hasPermission,
        hasPermissionAccess,
        hasNotificationAccess,

        refreshUser: loadUser
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {

    const context = useContext(UserContext);

    if (context === undefined) {
        throw new Error(
            'useUser must be used within a UserProvider'
        );
    }

    return context;
};