import { useEffect, useState } from 'react';

import { getEmployee } from '@/services/employeeService';
import { Employee } from '@/types/employee';

export function useEmployee(id: string): {
  employee: Employee | null;
  isLoading: boolean;
  error: string | null;
} {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployee(id)
      .then(setEmployee)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : '불러오는 중 오류가 발생했습니다.',
        ),
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  return { employee, isLoading, error };
}
