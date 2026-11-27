import fs from 'fs';
import path from 'path';
import { HI } from '../i18n/hi';

const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []));

describe('Hindi dictionary', () => {
  const root = path.resolve(__dirname, '../..');
  const files = [path.join(root, 'App.tsx'), ...walk(path.join(root, 'src'))].filter((f) => !f.includes('hi.ts') && !f.includes('__tests__'));
  const keys = new Set<string>();
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\btr\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g)) keys.add((m[1] ?? m[2]).replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  it('has a Hindi entry for every literal tr() key', () => {
    expect([...keys].filter((k) => !(k in HI))).toEqual([]);
  });
  it('keeps the {placeholders} of each English text', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
    expect(Object.entries(HI).filter(([k, v]) => ph(k) !== ph(v)).map(([k]) => k)).toEqual([]);
  });
});
