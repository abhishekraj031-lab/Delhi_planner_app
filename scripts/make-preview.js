// Builds a single self-contained HTML preview of the web build, shown in a phone frame.
// Usage: npx expo export --platform web --output-dir dist && node scripts/make-preview.js <out.html>
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const out = process.argv[2] || 'preview.html';
const mime = { '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };

const jsFile = fs.readdirSync(path.join(dist, '_expo/static/js/web')).find((f) => f.endsWith('.js'));
let js = fs.readFileSync(path.join(dist, '_expo/static/js/web', jsFile), 'utf8');
let inlined = 0;
js = js.replace(/"(\/assets\/[^"]+\.(?:jpg|png|ttf))"/g, (m, p) => {
  const file = path.join(dist, decodeURIComponent(p));
  if (!fs.existsSync(file)) return m;
  inlined++;
  return `"data:${mime[path.extname(file)]};base64,${fs.readFileSync(file).toString('base64')}"`;
});
js = js.replace(/<\/script/gi, '<\\/script');

const app = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Delhi Explorer</title>
<style>html,body{height:100%;margin:0}body{overflow:hidden}#root{display:flex;height:100%;flex:1}</style></head>
<body><div id="root"></div><script>${js}</script></body></html>`;

const page = `<title>Delhi Explorer Preview</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root{--bg:#eef0f6;--fg:#1e1b1b;--muted:#5c6477;--frame:#1e1b1b;--line:#d6d9e6;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14161d;--fg:#eceef6;--muted:#9aa1b5;--frame:#05060a;--line:#2a2e3b;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#14161d;--fg:#eceef6;--muted:#9aa1b5;--frame:#05060a;--line:#2a2e3b;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:14px/1.45 Inter,system-ui,sans-serif;min-height:100%}
.wrap{padding-block:16px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;align-items:center;gap:12px}
h1{margin:0;font-size:15px;font-weight:600}
.sub{margin:0;color:var(--muted);font-size:12px;text-align:center;max-width:46ch}
.slot{position:relative}
.phone{position:absolute;top:0;left:0;width:390px;height:844px;box-sizing:content-box;border:10px solid var(--frame);border-radius:44px;overflow:hidden;transform-origin:top left;background:#fff;margin:-10px}
iframe{width:390px;height:844px;border:0;display:block;background:#fff}
</style>
<div class="wrap">
  <h1>Delhi Explorer</h1>
  <p class="sub">Live preview of the current build. Try the search, categories, a place card and the Profile tab (demo login: demo / demo1234).</p>
  <div class="slot" id="slot"><div class="phone" id="phone"><iframe id="app" title="Delhi Explorer app preview"></iframe></div></div>
</div>
<script>
const APP = ${JSON.stringify(app).replace(/<\//g, '<\\/')};
const phone = document.getElementById('phone'), slot = document.getElementById('slot');
function fit(){
  const s = Math.min(1, (window.innerWidth - 56) / 390, (window.innerHeight - 160) / 844);
  const k = Math.max(0.4, s);
  phone.style.transform = 'scale(' + k + ')';
  slot.style.width = (390 * k) + 'px'; slot.style.height = (844 * k) + 'px';
}
addEventListener('resize', fit); fit();
document.getElementById('app').srcdoc = APP;
</script>`;
fs.writeFileSync(out, page);
console.log('inlined assets:', inlined, '| size MB:', (Buffer.byteLength(page) / 1e6).toFixed(1));
