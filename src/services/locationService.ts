import { supabase } from '@/lib/supabase';
import { Location } from '@/types/location';

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, timezone')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    timezone: row.timezone as string,
  }));
}
