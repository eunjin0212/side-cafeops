import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CenteredScreen } from '@/components/molecules/CenteredScreen';
import { EmptyText } from '@/components/molecules/EmptyText';
import { ErrorText } from '@/components/molecules/ErrorText';
import { FormHeader } from '@/components/molecules/FormHeader';
import { LoadingScreen } from '@/components/molecules/LoadingScreen';
import { ROLE_LABELS } from '@/constants/roles';
import { colors, fontSizes } from '@/constants/theme';
import { useInvitationActions } from '@/hooks/useInvitationActions';
import { useInvitations } from '@/hooks/useInvitations';
import { Invitation, InvitationStatus } from '@/types/invitation';
import { formatDotDate } from '@/utils/dates';
import { goBack } from '@/utils/navigation';

const STATUS_LABEL: Record<InvitationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<InvitationStatus, { bg: string; text: string }> = {
  pending: {
    bg: colors.warningSurface,
    text: colors.warning,
  },
  accepted: {
    bg: colors.successSurface,
    text: colors.successStrong,
  },
  expired: {
    bg: colors.surfaceMuted,
    text: colors.textTertiary,
  },
  cancelled: {
    bg: colors.surfaceMuted,
    text: colors.textTertiary,
  },
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

  const statusColors = STATUS_COLORS[invitation.status];

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.email} numberOfLines={1}>
          {invitation.email}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.badgeText, { color: statusColors.text }]}>
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
                <ActivityIndicator aria-label="Loading" size="small" color={colors.dangerAccent} />
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
                <ActivityIndicator aria-label="Loading" size="small" color={colors.textSecondary} />
              ) : (
                <Text style={styles.resendButtonText}>Resend</Text>
              )}
            </Pressable>
          )}
        </View>
      )}

      {actionError !== null && (
        <Text role="alert" style={styles.actionError}>
          {actionError}
        </Text>
      )}
    </View>
  );
}

export default function InvitationsScreen() {
  const { invitations, isLoading, isRefreshing, error, refetch } = useInvitations();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <CenteredScreen>
        <ErrorText>{error}</ErrorText>
      </CenteredScreen>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FormHeader
          title="Invitations"
          dismissLabel="Close"
          onDismiss={() => goBack('/employees')}
        />
      </View>
      <FlatList
        data={invitations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvitationRow invitation={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <CenteredScreen>
            <EmptyText>No invitations yet.</EmptyText>
          </CenteredScreen>
        }
        contentContainerStyle={
          invitations.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: colors.white,
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
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  meta: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  dates: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
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
    borderColor: colors.dangerOutline,
  },
  resendButton: {
    borderColor: colors.border,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.danger,
  },
  resendButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionError: {
    fontSize: fontSizes.sm,
    color: colors.danger,
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: 20,
  },
});
