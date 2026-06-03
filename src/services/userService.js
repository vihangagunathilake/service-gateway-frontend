import axios from 'axios';
import { getConfig } from '../config';

/**
 * Fetch user header data (name, email, userType) for display in the header dropdown
 * @returns {Promise<Object>} User header data
 */
export const getUserHeaderData = async () => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/user/header-data`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch user header data:', error);
        throw error;
    }
};
/**
 * Fetch user permissions for authorized navigation
 * @returns {Promise<Array>} List of permission names
 */
export const getUserPermissions = async () => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/user/load-permissions`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch user permissions:', error);
        throw error;
    }
};

/**
 * Fetch user permission access
 * @returns {Promise<Array>} List of permission access objects
 */
export const getUserPermissionAccess = async () => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/user/load-permission-access`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch user permission access:', error);
        throw error;
    }
};
