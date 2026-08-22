import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, MessageSquare, Briefcase, User, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';

export interface Notification {
  id: number;
  user_id: number;
  type: 'info' | 'warning' | 'error' | 'success' | 'message' | 'job' | 'system';
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.items || []);
      setUnreadCount(res.data.items.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // This will create a WS connection to listen for our custom events from useWebSocket.
  // Wait, if we call useWebSocket here, we establish a connection.
  // Since we also listen to 'new_ws_notification' on window, the connection will dispatch it, and we will catch it.
  useWebSocket();

  useEffect(() => {
    fetchNotifications();
    
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent;
      const notification = customEvent.detail;
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    
    window.addEventListener('new_ws_notification', handleNewNotification);
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => {
      window.removeEventListener('new_ws_notification', handleNewNotification);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Bildirim okundu işaretlenemedi:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Bildirimler okundu işaretlenemedi:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <Check className="w-5 h-5 text-green-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'job': return <Briefcase className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    if (diffInSeconds < 172800) return 'Dün';
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors bg-transparent"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Bildirimler</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                <p>Bildirimler yükleniyor...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900">Henüz bildirim yok</p>
                <p className="text-sm mt-1">Yeni bir gelişme olduğunda buradan haberdar olacaksınız.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium text-gray-900 ${!notification.is_read ? 'font-bold' : ''}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.action_url && (
                          <Link 
                            to={notification.action_url}
                            className="inline-block mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                            onClick={() => setIsOpen(false)}
                          >
                            Detayları Gör →
                          </Link>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 mt-2 bg-indigo-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
            <Link 
              to="/notifications" 
              className="text-sm font-medium text-gray-600 hover:text-indigo-600"
              onClick={() => setIsOpen(false)}
            >
              Tüm Bildirimleri Gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
