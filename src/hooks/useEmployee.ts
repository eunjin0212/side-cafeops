import { useQuery } from '@tanstack/react-query';

import { getEmployee } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { queryErrorMessage } from '@/utils/errors';

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
    error: queryErrorMessage(error, 'Failed to load employee.'),
  };
}
