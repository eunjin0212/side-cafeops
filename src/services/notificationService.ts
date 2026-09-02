import { supabase } from '@/lib/supabase';
import { AppNotification, NotificationType } from '@/types/notification';

const NOTIFICATION_QUERY =
  'id, profile_id, type, title, body, data, is_read, created_at' as const;

function mapNotification(row: {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}): AppNotification {
  return {
    id: row.id,
    profileId: row.profile_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    data: row.data,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function getMyNotifications(profileId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_QUERY)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('notificationService: load notifications', error);
    throw new Error('Failed to load notifications. Please try again.');
  }
  return data.map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('notificationService: mark read', error);
    throw new Error('Failed to update notification. Please try again.');
  }
}

export async function markAllNotificationsRead(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  if (error) {
    console.error('notificationService: mark all read', error);
    throw new Error('Failed to update notifications. Please try again.');
  }
}

export async function registerPushToken(
  profileId: string,
  expoPushToken: string,
): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { profile_id: profileId, expo_push_token: expoPushToken },
      { onConflict: 'expo_push_token' },
    );

  if (error) {
    // Non-fatal: push registration failing shouldn't block app usage.
    console.error('notificationService: register push token', error);
  }
}
