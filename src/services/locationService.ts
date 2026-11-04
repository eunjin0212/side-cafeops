import { supabase } from '@/lib/supabase';
import { serviceError } from '@/services/serviceError';
import { Location } from '@/types/location';

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, timezone')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw serviceError(
      'locationService: load locations',
      error,
      'Failed to load locations. Please try again.',
    );
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    timezone: row.timezone as string,
  }));
}
