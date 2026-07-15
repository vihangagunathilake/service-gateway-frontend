import axios from 'axios';
import { getConfig } from '../config';

/**
 * Fetch notification count from /notification/notify
 * @returns {Promise<number>} Notification count
 */
export const getNotificationCount = async () => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/notification/notify`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch notification count:', error);
        throw error;
    }
};

/**
 * Mark notifications as notified (viewed) and return new count
 * @returns {Promise<number>} Updated notification count
 */
export const markNotificationsAsNotified = async () => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/notification/notified`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Failed to mark notifications as notified:', error);
        throw error;
    }
};

/**
 * Fetch no-agent notification count from /notification/notify-no-agent
 * @returns {Promise<number>} No-agent notification count
 */
export const getNoAgentNotificationCount = async () => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/notification/notify-no-agent`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.data;
    } catch (error) {
        console.error('Failed to fetch no-agent notification count:', error);
        throw error;
    }
};

/**
 * Fetch role-based notification access list from /notification-access/role-notifications
 * @returns {Promise<string[]>} List of notification type strings the user has access to
 */
export const getRoleNotifications = async () => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/notification-access/role-notifications`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data.data || [];
    } catch (error) {
        console.error('Failed to fetch role notifications:', error);
        throw error;
    }
};

