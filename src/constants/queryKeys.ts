export const QUERY_KEYS = {
  currentProfile: ['currentProfile'] as const,
  employees: ['employees'] as const,
  employee: (id: string) => ['employee', id] as const,
  invitations: ['invitations'] as const,
  locations: ['locations'] as const,
  scoreCategories: ['scoreCategories'] as const,
} as const;
