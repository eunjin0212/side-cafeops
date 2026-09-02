import { unwrapJoin } from '@/utils/supabaseJoin';

describe('unwrapJoin()', () => {
  it('returns the value as-is when it is a single object', () => {
    expect(unwrapJoin({ id: '1' })).toEqual({ id: '1' });
  });

  it('returns the first element when it is an array', () => {
    expect(unwrapJoin([{ id: '1' }, { id: '2' }])).toEqual({ id: '1' });
  });

  it('returns null for an empty array', () => {
    expect(unwrapJoin([])).toBeNull();
  });

  it('returns null for null', () => {
    expect(unwrapJoin(null)).toBeNull();
  });
});
