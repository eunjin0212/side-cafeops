import { useQuery } from '@tanstack/react-query';

import { getEmployee } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useEmployee(id: string): {
  employee: Employee | null;
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.employee(id),
    queryFn: () => getEmployee(id),
    enabled: !!id,
  });

  return {
    employee: data ?? null,
    isLoading,
    error: error instanceof Error ? error.message : error ? 'Failed to load employee.' : null,
  };
}
