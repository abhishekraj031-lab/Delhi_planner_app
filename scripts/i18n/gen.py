import json
d = json.load(open('/home/claude/delhi-explorer/scripts/i18n/entries.json'))
out = ["// Generated from scripts/i18n/entries.json. English text is the key. Edit the JSON (or have a Hindi speaker review it), then run scripts/i18n/gen.py.\n", "export const HI: Record<string, string> = {\n"]
for k in sorted(d):
    out.append(f"  {json.dumps(k, ensure_ascii=False)}: {json.dumps(d[k], ensure_ascii=False)},\n")
out.append("};\n")
open('/home/claude/delhi-explorer/src/i18n/hi.ts', 'w').write(''.join(out))
print(len(d), 'entries')
