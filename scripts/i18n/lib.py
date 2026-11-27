import json, os, re
ROOT = '/home/claude/delhi-explorer'
ENTRIES = os.path.join(ROOT, 'scripts/i18n/entries.json')

def load():
    return json.load(open(ENTRIES)) if os.path.exists(ENTRIES) else {}

def add(d):
    cur = load(); cur.update(d); json.dump(cur, open(ENTRIES, 'w'), ensure_ascii=False, indent=0, sort_keys=True)

def edit(path, pairs, hi=None):
    """pairs: list of (old, new). Every old must occur exactly once unless the tuple has a third element 'all'."""
    p = os.path.join(ROOT, path)
    s = open(p).read()
    for t in pairs:
        old, new = t[0], t[1]
        n = s.count(old)
        if n == 0: raise SystemExit(f'NOT FOUND in {path}: {old[:90]}')
        if n > 1 and not (len(t) > 2 and t[2] == 'all'): raise SystemExit(f'AMBIGUOUS ({n}) in {path}: {old[:90]}')
        s = s.replace(old, new)
    open(p, 'w').write(s)
    if hi: add(hi)
