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

const UserContext = createContext();

export const UserProvider = ({ children }) => {

    const [userInfo, setUserInfo] = useState({
        name: 'Loading...',
        email: '',
        userType: '',
        provider: '',
        providerId: '',
        userId: '',
        image: null
    });

    const [permissions, setPermissions] = useState([]);
    const [permissionAccess, setPermissionAccess] = useState([]);
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

            const [
                userData,
                userPermissions,
                userPermissionAccess
            ] = await Promise.all([
                getUserHeaderData(),
                getUserPermissions(),
                getUserPermissionAccess()
            ]);

            setUserInfo({
                name: userData.userName || 'User',
                email: userData.email || '',
                userType: userData.userType || 'User',
                provider: userData.serviceCenter || '',
                providerId: userData.providerId || '',
                userId: userData.userId || userData.id || '',
                image: userData.image || null
            });

            setPermissions(userPermissions || []);
            setPermissionAccess(userPermissionAccess || []);

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
    CONTEXT VALUE
    ==================================================
    */

    const value = {
        userInfo,
        permissions,
        permissionAccess,
        loading,

        hasPermission,
        hasPermissionAccess,

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