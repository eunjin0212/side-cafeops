import { useEffect, useState } from 'react';

import { getEmployees } from '@/services/employeeService';
import { Employee } from '@/types/employee';

export function useEmployees(): {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
} {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch(() => setError('Failed to load employees.'))
      .finally(() => setIsLoading(false));
  }, []);

  return { employees, isLoading, error };
}
