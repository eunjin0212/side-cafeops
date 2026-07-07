export const QUERY_KEYS = {
  currentProfile: ['currentProfile'] as const,
  employees: ['employees'] as const,
  employee: (id: string) => ['employee', id] as const,
  invitations: ['invitations'] as const,
} as const;
