import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUnreadCount } from '../service/NotificationService';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [onNewNotificationCallbacks, setOnNewNotificationCallbacks] = useState([]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      
      if (response?.data) {
        const newCount = response.data.count || 0;
        
        if (newCount > lastNotificationCount && lastNotificationCount !== 0) {
          const increaseAmount = newCount - lastNotificationCount;
          
          toast.info(`🔔 Bạn có ${increaseAmount} thông báo mới!`, {
            position: "top-right",
            autoClose: 3000,
          });

          onNewNotificationCallbacks.forEach(callback => {
            try {
              callback(newCount, increaseAmount);
            } catch (error) {
              console.error('Error executing callback:', error);
            }
          });
        }
        
        setUnreadCount(newCount);
        setLastNotificationCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [lastNotificationCount, onNewNotificationCallbacks]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!isPolling) return;

    const pollingInterval = setInterval(fetchUnreadCount, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollingInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPolling, fetchUnreadCount]);

  const refreshNotifications = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const decreaseCount = useCallback((amount = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount));
    setLastNotificationCount(prev => Math.max(0, prev - amount));
  }, []);

  const resetCount = useCallback(() => {
    setUnreadCount(0);
    setLastNotificationCount(0);
  }, []);

  const pausePolling = useCallback(() => setIsPolling(false), []);
  
  const resumePolling = useCallback(() => {
    setIsPolling(true);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const onNewNotification = useCallback((callback) => {
    setOnNewNotificationCallbacks(prev => [...prev, callback]);
    return () => {
      setOnNewNotificationCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const value = {
    unreadCount,
    refreshNotifications,
    decreaseCount,
    resetCount,
    pausePolling,
    resumePolling,
    isPolling,
    onNewNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
