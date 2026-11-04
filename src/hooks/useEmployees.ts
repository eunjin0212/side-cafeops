import { useQuery } from '@tanstack/react-query';

import { getEmployees } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { queryErrorMessage } from '@/utils/errors';

export function useEmployees(): {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.employees,
    queryFn: getEmployees,
  });

  return {
    employees: data ?? [],
    isLoading,
    error: queryErrorMessage(error, 'Failed to load employees.'),
  };
}
