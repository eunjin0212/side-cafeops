import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { AppNotification } from '@/types/notification';

export function useNotifications(): {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
} {
  const { profile } = useCurrentProfile();
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.notifications(profile?.id ?? ''),
    queryFn: () => getMyNotifications(profile!.id),
    enabled: !!profile,
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications(profile?.id ?? ''),
      });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(profile!.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications(profile?.id ?? ''),
      });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isFetching,
    error:
      error instanceof Error ? error.message : error ? 'Failed to load notifications.' : null,
    refetch,
    markAsRead: (id: string) => markReadMutation.mutate(id),
    markAllAsRead: () => markAllReadMutation.mutate(),
  };
}
