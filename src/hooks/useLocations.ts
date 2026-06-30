import { Location } from '@/types/location';

// TODO: connect to locationService.getLocations() when locationService is ready

export function useLocations(): { locations: Location[]; isLoading: boolean } {
  return { locations: [], isLoading: false };
}
