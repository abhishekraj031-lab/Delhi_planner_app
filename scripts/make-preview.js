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
:root{--bg:#e9ebf3;--frame:#111216;--bar:#fff;--barfg:#111216;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0e1015;--frame:#000;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0e1015;--frame:#000;color-scheme:dark}
html,body{height:100%}
body{background:var(--bg);margin:0;overflow:hidden}
.wrap{height:100%;box-sizing:border-box;padding-block:12px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;align-items:center;justify-content:center}
.slot{position:relative}
.phone{position:absolute;top:0;left:0;width:390px;height:844px;box-sizing:content-box;border:10px solid var(--frame);border-radius:48px;overflow:hidden;transform-origin:top left;background:#fff;margin:-10px;display:flex;flex-direction:column}
.status{height:47px;flex:none;display:flex;align-items:flex-end;justify-content:space-between;padding:0 28px 6px;background:var(--bar);color:var(--barfg);font:600 15px/1 -apple-system,system-ui,sans-serif;position:relative}
.status i{display:flex;gap:5px;align-items:center}
.status b{display:block;background:var(--barfg);border-radius:2px}
.island{position:absolute;top:10px;left:50%;width:110px;height:30px;margin-left:-55px;background:#000;border-radius:16px}
iframe{width:390px;flex:1;border:0;display:block;background:#fff;min-height:0}
.home{height:0;position:relative}
.home::after{content:"";position:absolute;left:50%;bottom:6px;width:134px;height:5px;margin-left:-67px;background:#111216;border-radius:3px;opacity:.9}
</style>
<div class="wrap">
  <div class="slot" id="slot">
    <div class="phone" id="phone">
      <div class="status"><span>9:41</span><div class="island"></div><i><b style="width:17px;height:10px"></b><b style="width:15px;height:10px"></b><b style="width:25px;height:12px;border-radius:4px"></b></i></div>
      <iframe id="app" title="Delhi Explorer app preview"></iframe>
      <div class="home"></div>
    </div>
  </div>
</div>
<script>
const APP = ${JSON.stringify(app).replace(/<\//g, '<\\/')};
const phone = document.getElementById('phone'), slot = document.getElementById('slot');
function fit(){
  const k = Math.max(0.4, Math.min(1, (window.innerWidth - 32) / 410, (window.innerHeight - 24) / 864));
  phone.style.transform = 'scale(' + k + ')';
  slot.style.width = (410 * k) + 'px'; slot.style.height = (864 * k) + 'px';
}
addEventListener('resize', fit); fit();
document.getElementById('app').srcdoc = APP;
</script>`;
fs.writeFileSync(out, page);
console.log('inlined assets:', inlined, '| size MB:', (Buffer.byteLength(page) / 1e6).toFixed(1));
