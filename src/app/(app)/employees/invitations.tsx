import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useInvitations } from '@/hooks/useInvitations';
import { Invitation, InvitationStatus } from '@/types/invitation';
import { ROLE_LABELS } from '@/constants/roles';

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<InvitationStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  accepted: { bg: '#D1FAE5', text: '#065F46' },
  expired: { bg: '#F3F4F6', text: '#6B7280' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

interface InvitationRowProps {
  invitation: Invitation;
}

function InvitationRow({ invitation }: InvitationRowProps) {
  const colors = STATUS_COLORS[invitation.status];
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.email} numberOfLines={1}>
          {invitation.email}
        </Text>
        <View style={[styles.badge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>
            {STATUS_LABEL[invitation.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {ROLE_LABELS[invitation.role]}
        {invitation.locationName ? ` · ${invitation.locationName}` : ''}
      </Text>
      <Text style={styles.dates}>
        Invited {formatDate(invitation.createdAt)} · Expires{' '}
        {formatDate(invitation.expiresAt)}
      </Text>
    </View>
  );
}

export default function InvitationsScreen() {
  const { invitations, isLoading, isRefreshing, error, refetch } =
    useInvitations();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invitations</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvitationRow invitation={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No invitations yet.</Text>
          </View>
        }
        contentContainerStyle={
          invitations.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeText: {
    fontSize: 15,
    color: '#6B7280',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  email: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
  },
  dates: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
