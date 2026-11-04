import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/molecules/EmptyState';
import { ErrorText } from '@/components/molecules/ErrorText';
import { ListCard } from '@/components/molecules/ListCard';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { colors, fontSizes } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { AppNotification } from '@/types/notification';
import { formatDateTime } from '@/utils/dates';

interface NotificationRowProps {
  notification: AppNotification;
  onPress: () => void;
}

function NotificationRow({ notification, onPress }: NotificationRowProps) {
  return (
    <Pressable role="button" style={styles.row} onPress={onPress}>
      {!notification.isRead && <View style={styles.unreadDot} role="img" aria-label="Unread" />}
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
            <Pressable
              role="button"
              style={styles.markAllButton}
              onPress={markAllAsRead}
              hitSlop={8}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <ActivityIndicator aria-label="Loading" style={styles.loader} size="large" />
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
    backgroundColor: colors.background,
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
  markAllButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.link,
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
    backgroundColor: colors.linkAccent,
    marginTop: 6,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  rowTitleUnread: {
    fontWeight: '700',
    color: colors.text,
  },
  rowBody: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    lineHeight: 18,
  },
  rowDate: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
});
