import axios from 'axios';
import { getConfig } from '../config';

/**
 * Prepare a job to preview the timeline/schedule
 * @param {Object} jobData - The job details
 * @returns {Promise<Object>} Timeline data
 */
export const prepareJob = async (jobData) => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.post(`${baseUrl}/jobs/prepare`, jobData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data && response.data.code === 0) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to prepare job');
        }
    } catch (error) {
        console.error('Failed to prepare job:', error);
        throw error;
    }
};
/**
 * Remove a dummy job and customer entity
 * @param {string|number} jobId - The job ID
 * @param {string|number} customerId - The customer ID
 * @returns {Promise<Object>} Response data
 */
export const removeJobAndCustomer = async (jobId, customerId) => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.delete(`${baseUrl}/jobs/${jobId}/remove/customer/${customerId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data && response.data.code === 0) {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to clean up dummy entities');
        }
    } catch (error) {
        console.error('Failed to clean up dummy entities:', error);
        throw error;
    }
};

/**
 * Get job schedule for a specific service center and date
 * @param {number} serviceCenter - Service center ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} List of scheduled jobs
 */
export const getJobSchedule = async (serviceCenter, date) => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.post(`${baseUrl}/jobs/schedule`, {
            serviceCenter,
            date
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data && response.data.code === 0) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to fetch job schedule');
        }
    } catch (error) {
        console.error('Failed to fetch job schedule:', error);
        throw error;
    }
};

/**
 * Get full details of a specific job including sub-job timeline
 * @param {string|number} jobId - The job ID
 * @returns {Promise<Object>} JobDetails object
 */
export const getJobDetails = async (jobId) => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${baseUrl}/jobs/${jobId}/details`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data && response.data.code === 0) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to fetch job details');
        }
    } catch (error) {
        console.error('Failed to fetch job details:', error);
        throw error;
    }
};

/**
 * Verify a newly created job
 * @param {string|number} jobId - The job ID
 * @returns {Promise<Object>} Verification status
 */
export const verifyJob = async (jobId) => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.put(`${baseUrl}/jobs/${jobId}/verify`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data && response.data.code === 0) {
            return response.data;
        } else {
            throw new Error(response.data.message || 'Failed to verify job');
        }
    } catch (error) {
        console.error('Failed to verify job:', error);
        throw error;
    }
};

/**
 * Get data job list in Job Management page
 * @param {number} serviceCenter - Service center ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} List of jobs
 */
export const getJobList = async (serviceCenter, date) => {
    try {
        const baseUrl = getConfig().baseUrl;
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.post(`${baseUrl}/jobs/list`, {
            serviceCenter,
            date
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data && response.data.code === 0) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Failed to fetch job list');
        }
    } catch (error) {
        console.error('Failed to fetch job list:', error);
        throw error;
    }
};

