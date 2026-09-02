export type NotificationType = 'score_entry';

export type AppNotification = {
  id: string;
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};
