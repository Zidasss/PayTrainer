import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../lib/notifications';
import { Bell } from 'lucide-react';

export function NotificationBell() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (profile) {
      getUnreadCount(profile.id).then(setCount);
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        getUnreadCount(profile.id).then(setCount);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  return (
    <div onClick={() => nav('/notifications')} style={{ cursor: 'pointer', padding: 6, position: 'relative' }}>
      <Bell size={20} color="var(--sand-500)" />
      {count > 0 && (
        <div style={{
          position: 'absolute', top: 2, right: 2,
          width: 16, height: 16, borderRadius: '50%',
          background: 'var(--coral)', color: 'white',
          fontSize: 10, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {count > 9 ? '9+' : count}
        </div>
      )}
    </div>
  );
}