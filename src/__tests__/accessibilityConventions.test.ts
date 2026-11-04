import { pointsColor } from '@/utils/points';

// The app's tsconfig has no Node types, and this is the only file that needs them.
interface FileSystem {
  readdirSync(
    path: string,
    options: { withFileTypes: true },
  ): { name: string; isDirectory(): boolean }[];
  readFileSync(path: string, encoding: 'utf8'): string;
}

const { readdirSync, readFileSync } = jest.requireActual<FileSystem>('fs');

const SRC_DIR = `${process.cwd()}/src`;

function listTsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return listTsxFiles(path);
    return entry.name.endsWith('.tsx') ? [path] : [];
  });
}

// Returns each opening tag's source. Tracks brace depth because props such as
// `onPress={() => ...}` contain a `>` that doesn't close the tag.
function findOpeningTags(source: string, component: string): string[] {
  const tags: string[] = [];
  const pattern = new RegExp(`<${component}\\b`, 'g');
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    let depth = 0;
    let end = match.index;
    for (; end < source.length; end++) {
      if (source[end] === '{') depth++;
      if (source[end] === '}') depth--;
      if (source[end] === '>' && depth === 0) break;
    }
    tags.push(source.slice(match.index, end + 1));
  }
  return tags;
}

const files = listTsxFiles(SRC_DIR).map((path) => ({
  name: path.slice(SRC_DIR.length + 1),
  source: readFileSync(path, 'utf8'),
}));

function tagsMissing(component: string, isValid: (tag: string) => boolean): string[] {
  return files.flatMap(({ name, source }) =>
    findOpeningTags(source, component)
      .filter((tag) => !isValid(tag))
      .map((tag) => `${name}: ${tag.split('\n').slice(0, 3).join(' ').trim()}`),
  );
}

describe('accessibility conventions', () => {
  it('finds the components it checks', () => {
    expect(files.some(({ source }) => findOpeningTags(source, 'Pressable').length > 0)).toBe(true);
  });

  it('gives every Pressable a role, unless it is excluded from the tab order', () => {
    expect(tagsMissing('Pressable', (tag) => /\brole=/.test(tag) || /focusable=\{false\}/.test(tag))).toEqual([]);
  });

  it('gives every TextInput an accessible name', () => {
    expect(tagsMissing('TextInput', (tag) => tag.includes('aria-label='))).toEqual([]);
  });

  it('gives every Switch an accessible name', () => {
    expect(tagsMissing('Switch', (tag) => tag.includes('aria-label='))).toEqual([]);
  });

  it('gives every ActivityIndicator an accessible name', () => {
    expect(tagsMissing('ActivityIndicator', (tag) => tag.includes('aria-label='))).toEqual([]);
  });

  it('uses utils/dialogs instead of Alert.alert, which does nothing on web', () => {
    const violations = files.filter(({ source }) => source.includes('Alert.alert('));
    expect(violations.map(({ name }) => name)).toEqual([]);
  });

  it('does not use text colors that fail WCAG AA on light backgrounds', () => {
    const banned = /(?:\bcolor: |placeholderTextColor=|\btext: )['"]#(?:9CA3AF|D1D5DB|3B82F6|EF4444|10B981|16A34A|208AEF)['"]/gi;
    const violations = files.flatMap(({ name, source }) =>
      (source.match(banned) ?? []).map((usage) => `${name}: ${usage}`),
    );
    expect(violations).toEqual([]);
  });
});

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('color contrast', () => {
  it('matches the published WCAG reference value', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
  });

  it.each([
    ['muted text on white', '#6B7280', '#FFFFFF'],
    ['muted text on the screen background', '#6B7280', '#F9FAFB'],
    ['muted text on a gray badge', '#4B5563', '#F3F4F6'],
    ['error text on white', '#DC2626', '#FFFFFF'],
    ['error text on the screen background', '#DC2626', '#F9FAFB'],
    ['error banner text', '#B91C1C', '#FEF2F2'],
    ['link text on white', '#1D4ED8', '#FFFFFF'],
    ['link text on a blue badge', '#1D4ED8', '#EFF6FF'],
    ['positive points on a green badge', pointsColor(5), '#DCFCE7'],
    ['negative points on a red badge', pointsColor(-5), '#FEE2E2'],
    ['neutral points on a gray badge', pointsColor(0), '#F3F4F6'],
    ['first-place rank badge', '#111827', '#F59E0B'],
    ['second-place rank badge', '#FFFFFF', '#6B7280'],
    ['third-place rank badge', '#FFFFFF', '#B45309'],
  ])('%s meets 4.5:1', (_label, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('gives input borders 3:1 against their background', () => {
    expect(contrastRatio('#6B7280', '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#6B7280', '#F9FAFB')).toBeGreaterThanOrEqual(3);
  });
});
