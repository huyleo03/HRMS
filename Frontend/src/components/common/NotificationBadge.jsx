import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationBadge.css';

const NotificationBadge = ({ className = '' }) => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <span className={`notification-badge ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default NotificationBadge;
