import { supabase } from './supabase';

export async function createNotification({ userId, title, message, type = 'info' }) {
  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

export async function getUnreadCount(userId) {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count || 0;
}

export async function getNotifications(userId, limit = 20) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function markAsRead(notificationId) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
}

export async function markAllAsRead(userId) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}