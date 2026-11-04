import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useInvitationActions } from '@/hooks/useInvitationActions';
import { useInvitations } from '@/hooks/useInvitations';
import { Invitation, InvitationStatus } from '@/types/invitation';
import { ROLE_LABELS } from '@/constants/roles';
import { formatDotDate } from '@/utils/dates';
import { goBack } from '@/utils/navigation';
import { FormHeader } from '@/components/molecules/FormHeader';
import { EmptyText } from '@/components/molecules/EmptyText';
import { ErrorText } from '@/components/molecules/ErrorText';

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<InvitationStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  accepted: { bg: '#D1FAE5', text: '#065F46' },
  expired: { bg: '#F3F4F6', text: '#4B5563' },
  cancelled: { bg: '#F3F4F6', text: '#4B5563' },
};

interface InvitationRowProps {
  invitation: Invitation;
}

function InvitationRow({ invitation }: InvitationRowProps) {
  const { cancel, resend } = useInvitationActions();
  const isCancelling = cancel.isPending;
  const isResending = resend.isPending;
  const actionError = cancel.error?.message ?? resend.error?.message ?? null;

  const canCancel = invitation.status === 'pending';
  const canResend = invitation.status === 'pending' || invitation.status === 'expired';
  const isAnyBusy = isCancelling || isResending;

  function handleCancel(): void {
    resend.reset();
    cancel.mutate(invitation.id);
  }

  function handleResend(): void {
    cancel.reset();
    resend.mutate(invitation.id);
  }

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
        Invited {formatDotDate(invitation.createdAt)} · Expires{' '}
        {formatDotDate(invitation.expiresAt)}
      </Text>

      {(canCancel || canResend) && (
        <View style={styles.actions}>
          {canCancel && (
            <Pressable
              role="button"
              aria-label={`Cancel invitation for ${invitation.email}`}
              style={[
                styles.actionButton,
                styles.cancelButton,
                isAnyBusy && styles.actionButtonDisabled,
              ]}
              onPress={handleCancel}
              disabled={isAnyBusy}
            >
              {isCancelling ? (
                <ActivityIndicator aria-label="Loading" size="small" color="#EF4444" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel</Text>
              )}
            </Pressable>
          )}
          {canResend && (
            <Pressable
              role="button"
              aria-label={`Resend invitation to ${invitation.email}`}
              style={[
                styles.actionButton,
                styles.resendButton,
                isAnyBusy && styles.actionButtonDisabled,
              ]}
              onPress={handleResend}
              disabled={isAnyBusy}
            >
              {isResending ? (
                <ActivityIndicator aria-label="Loading" size="small" color="#374151" />
              ) : (
                <Text style={styles.resendButtonText}>Resend</Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {actionError !== null && (
        <Text role="alert" style={styles.actionError}>{actionError}</Text>
      )}
    </View>
  );
}

export default function InvitationsScreen() {
  const { invitations, isLoading, isRefreshing, error, refetch } =
    useInvitations();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator aria-label="Loading" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ErrorText>{error}</ErrorText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FormHeader title="Invitations" dismissLabel="Close" onDismiss={() => goBack('/employees')} />
      </View>
      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvitationRow invitation={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <EmptyText>No invitations yet.</EmptyText>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
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
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelButton: {
    borderColor: '#FCA5A5',
  },
  resendButton: {
    borderColor: '#E5E7EB',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  actionError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
});
