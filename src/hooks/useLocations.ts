import { useEffect, useState } from 'react';

import { getLocations } from '@/services/locationService';
import { Location } from '@/types/location';

export function useLocations(): {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
} {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLocations()
      .then(setLocations)
      .catch(() => setError('Failed to load locations.'))
      .finally(() => setIsLoading(false));
  }, []);

  return { locations, isLoading, error };
}
