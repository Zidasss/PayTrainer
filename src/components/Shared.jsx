import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, CreditCard, User, Users, DollarSign, Dumbbell } from 'lucide-react';

export function BottomNav({ role }) {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const items = role === 'trainer' ? [
    { path: '/trainer', icon: Home, label: 'Início' },
    { path: '/trainer/schedule', icon: CalendarDays, label: 'Agenda' },
    { path: '/trainer/students', icon: Users, label: 'Alunos' },
    { path: '/trainer/finance', icon: DollarSign, label: 'Finanças' },
    { path: '/trainer/profile', icon: User, label: 'Perfil' },
  ] : [
    { path: '/student', icon: Home, label: 'Início' },
    { path: '/student/schedule', icon: CalendarDays, label: 'Agenda' },
    { path: '/student/payment', icon: CreditCard, label: 'Pagamento' },
    { path: '/student/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <div
          key={item.path}
          className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          onClick={() => nav(item.path)}
        >
          <item.icon strokeWidth={pathname === item.path ? 2.2 : 1.8} />
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}

export function Avatar({ name, size = 'md', bg = 'var(--green-50)', color = 'var(--green-600)' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className={`avatar avatar-${size}`} style={{ background: bg, color }}>
      {initials}
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <Dumbbell size={32} color="var(--green-500)" />
      <div className="spinner" />
    </div>
  );
}

export function formatBRL(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ConfirmModal({ show, title, message, onConfirm, onCancel, confirmText = 'Continuar', cancelText = 'Cancelar' }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="animate-in" style={{
        background: 'white', borderRadius: 'var(--radius-lg)', padding: '28px 24px',
        maxWidth: 360, width: '100%', textAlign: 'center',
      }}>
        <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 14, color: 'var(--sand-500)', lineHeight: 1.6, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={onCancel} style={{ flex: 1, padding: 12 }}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onConfirm} style={{ flex: 1, padding: 12 }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}