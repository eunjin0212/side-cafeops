import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/constants/queryKeys';
import { saveEmployee } from '@/services/employeeService';
import { SaveEmployeeInput } from '@/types/employee';

export function useSaveEmployee(id: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SaveEmployeeInput>({
    mutationFn: (input) => saveEmployee(id, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employee(id) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.employees }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentProfile }),
      ]);
    },
  });
}
