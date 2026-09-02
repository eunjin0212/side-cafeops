import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useNotifications } from '@/hooks/useNotifications';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { ListCard } from '@/components/molecules/ListCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorText } from '@/components/molecules/ErrorText';
import { AppNotification } from '@/types/notification';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface NotificationRowProps {
  notification: AppNotification;
  onPress: () => void;
}

function NotificationRow({ notification, onPress }: NotificationRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {!notification.isRead && <View style={styles.unreadDot} />}
      <View style={styles.rowContent}>
        <Text
          style={[styles.rowTitle, !notification.isRead && styles.rowTitleUnread]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.rowBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.rowDate}>{formatDateTime(notification.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isFetching,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  function handlePress(notification: AppNotification): void {
    if (!notification.isRead) markAsRead(notification.id);
    if (notification.type === 'score_entry') {
      router.navigate('/scores/my');
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
    >
      <ScreenHeader
        backHref="/"
        title="Notifications"
        right={
          unreadCount > 0 ? (
            <Pressable onPress={markAllAsRead} hitSlop={8}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" />
      ) : error ? (
        <ErrorText style={styles.errorText}>{error}</ErrorText>
      ) : notifications.length === 0 ? (
        <EmptyState>No notifications yet.</EmptyState>
      ) : (
        <ListCard>
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onPress={() => handlePress(n)} />
          ))}
        </ListCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 48,
    gap: 20,
  },
  loader: {
    marginTop: 60,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 6,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  rowTitleUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  rowBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  rowDate: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 1,
  },
});
