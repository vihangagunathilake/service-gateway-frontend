import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useUser } from './UserContext';
import { 
    getNotificationCount, 
    markNotificationsAsNotified,
    getNoAgentNotificationCount
} from '../services/notificationService';
import { getConfig } from '../config';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { userInfo, hasNotificationAccess } = useUser();
    const [count, setCount] = useState(0);
    const [noAgentCount, setNoAgentCount] = useState(0);
    const [connected, setConnected] = useState(false);
    const stompClientRef = useRef(null);
    const idleTimeoutRef = useRef(null);
    const isIdleRef = useRef(false);

    // Fetch initial count on mount / user change
    const fetchCount = async () => {
        if (localStorage.getItem('token')) {
            try {
                const cnt = await getNotificationCount();
                setCount(cnt);
            } catch (e) {
                console.error("Failed to load initial notification count", e);
            }
        }
    };

    const fetchNoAgentCount = async () => {
        if (localStorage.getItem('token')) {
            try {
                const cnt = await getNoAgentNotificationCount();
                setNoAgentCount(cnt);
            } catch (e) {
                console.error("Failed to load initial no-agent notification count", e);
            }
        }
    };

    useEffect(() => {
        if (!userInfo.userId) return;
        if (hasNotificationAccess('GENERAL')) {
            fetchCount();
        }
        if (hasNotificationAccess('NO_AGENT_FOR_JOB')) {
            fetchNoAgentCount();
        }
    }, [userInfo.userId]);

    const connectWebSocket = () => {
        if (stompClientRef.current) {
            return;
        }

        const baseUrl = getConfig().baseUrl;
        const socket = new SockJS(`${baseUrl}/ws`);
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            setConnected(true);
            console.log('Connected to Stomp');

            // Subscribe if userId is available
            const userId = userInfo.userId;
            if (userId) {
                if (hasNotificationAccess('NO_AGENT_FOR_JOB')) {
                    const topicNoAgent = `/topic/notifications/no-agents-in-point/${userId}`;
                    console.log(`Subscribing to topic: ${topicNoAgent}`);
                    client.subscribe(topicNoAgent, (message) => {
                        console.log('Received notification message:', message.body);
                        try {
                            const event = JSON.parse(message.body);
                            if (event.notificationType === 'NO_AGENT_FOR_JOB') {
                                fetchNoAgentCount();
                            }
                        } catch (err) {
                            console.error('Error parsing notification message', err);
                        }
                        fetchCount();
                    });
                }
            }
        };

        client.onDisconnect = () => {
            setConnected(false);
            console.log('Disconnected from Stomp');
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        stompClientRef.current = client;
        client.activate();
    };

    const disconnectWebSocket = () => {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
            setConnected(false);
        }
    };

    // Handle activity / idle timer (1 hour = 3600000 ms)
    const resetIdleTimer = () => {
        if (idleTimeoutRef.current) {
            clearTimeout(idleTimeoutRef.current);
        }

        if (isIdleRef.current) {
            isIdleRef.current = false;
            console.log("User active again. Reconnecting WebSocket.");
            if (localStorage.getItem('token')) {
                connectWebSocket();
            }
        }

        idleTimeoutRef.current = setTimeout(() => {
            console.log("User idle for 1 hour. Disconnecting WebSocket.");
            isIdleRef.current = true;
            disconnectWebSocket();
        }, 3600000); // 1 hour
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && userInfo.userId && !isIdleRef.current) {
            connectWebSocket();
        } else {
            disconnectWebSocket();
        }

        // Add activity listeners
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, resetIdleTimer);
        });

        // Initialize idle timer
        resetIdleTimer();

        return () => {
            disconnectWebSocket();
            if (idleTimeoutRef.current) {
                clearTimeout(idleTimeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetIdleTimer);
            });
        };
    }, [userInfo.userId]);

    const handleMarkAsNotified = async () => {
        if (!hasNotificationAccess('GENERAL')) return;
        try {
            const newCount = await markNotificationsAsNotified();
            setCount(newCount);
        } catch (e) {
            console.error("Failed to mark notifications as notified", e);
        }
    };

    return (
        <NotificationContext.Provider value={{ 
            count, 
            noAgentCount,
            connected, 
            markAsNotified: handleMarkAsNotified, 
            refreshCount: fetchCount,
            refreshNoAgentCount: fetchNoAgentCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
