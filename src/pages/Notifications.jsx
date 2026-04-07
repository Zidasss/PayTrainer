import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markAsRead, markAllAsRead } from '../lib/notifications';
import { ArrowLeft, Bell, CheckCheck, CreditCard, CalendarDays, AlertTriangle, Info } from 'lucide-react';

const typeIcons = {
  info: { icon: Info, color: 'var(--blue)', bg: 'var(--blue-bg)' },
  success: { icon: CalendarDays, color: 'var(--green-500)', bg: 'var(--green-50)' },
  warning: { icon: AlertTriangle, color: 'var(--coral)', bg: 'var(--coral-bg)' },
  payment: { icon: CreditCard, color: 'var(--green-600)', bg: 'var(--green-50)' },
};

export default function Notifications() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNotifications(); }, []);

  async function loadNotifications() {
    const data = await getNotifications(profile.id, 50);
    setNotifications(data);
    setLoading(false);
  }

  async function handleMarkAllRead() {
    await markAllAsRead(profile.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function handleTap(notification) {
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
  }

  function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMin = Math.floor((now - date) / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div className="page"><div className="loading-screen"><div className="spinner" /></div></div>;

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => nav(-1)} style={{ cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={22} />
          </div>
          <div>
            <p className="page-title">Notificações</p>
            {unreadCount > 0 && <p className="page-subtitle">{unreadCount} não lida(s)</p>}
          </div>
        </div>
        {unreadCount > 0 && (
          <div onClick={handleMarkAllRead} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--green-500)', fontSize: 13 }}>
            <CheckCheck size={16} /> Ler todas
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state animate-in delay-1">
          <Bell size={28} strokeWidth={1.5} />
          <p style={{ fontSize: 14 }}>Nenhuma notificação</p>
        </div>
      ) : (
        <div className="animate-in delay-1">
          {notifications.map(n => {
            const typeInfo = typeIcons[n.type] || typeIcons.info;
            const IconComp = typeInfo.icon;
            return (
              <div key={n.id} onClick={() => handleTap(n)}
                style={{
                  display: 'flex', gap: 12, padding: '14px 0',
                  borderBottom: '1px solid var(--sand-100)',
                  opacity: n.read ? 0.6 : 1, cursor: 'pointer',
                }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: typeInfo.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <IconComp size={18} color={typeInfo.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 14, fontWeight: n.read ? 400 : 500, lineHeight: 1.3 }}>{n.title}</p>
                    <span style={{ fontSize: 11, color: 'var(--sand-400)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--sand-500)', marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                </div>
                {!n.read && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-500)', marginTop: 6, flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}