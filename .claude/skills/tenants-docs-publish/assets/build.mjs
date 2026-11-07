// Usage: node build.mjs <repoRoot> <workDir>
// workDir (scratchpad) must contain node_modules/marked (v12). Renders mermaid, builds the HTML, prints counts.
import fs from 'fs';
import path from 'path';
import {execFileSync} from 'child_process';
import {fileURLToPath, pathToFileURL} from 'url';
const [repo, work] = process.argv.slice(2);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const {marked} = await import(pathToFileURL(path.join(work,'node_modules/marked/lib/marked.esm.js')).href);
const DOCS = path.join(repo,'design-docs')+'/';
const TABS = [['architecture','Architecture','architecture.md'],['tech-stack','Tech Stack','tech-stack.md'],['deployment','Deployment','deployment.md'],['processes','Processes','process-designs/index.md']];
const read = f => fs.existsSync(DOCS+f) ? fs.readFileSync(DOCS+f,'utf8') : null;
const slug = s => s.toLowerCase().replace(/<[^>]+>/g,'').replace(/&[a-z#0-9]+;/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const norm = (base,p) => { const o=[]; for (const x of (base+p).split('/')) { if(x==='.'||x==='')continue; x==='..'?o.pop():o.push(x);} return o.join('/'); };
const dirOf = f => f.includes('/') ? f.slice(0,f.lastIndexOf('/')+1) : '';

// 1. Discover docs: entry file per tab, plus local .md files linked from it.
const docs = {}; // relative path -> {id, tab, sub, title}
const tabDocs = {};
for (const [tid,label,f] of TABS) {
  const src = read(f);
  if (src === null) { console.error('MISSING SOURCE', f); process.exit(2); }
  docs[f] = {id:tid, tab:tid, sub:false, title:label};
  tabDocs[tid] = [f];
  for (const m of src.matchAll(/\[([^\]]+)\]\((?!https?:)([^)#\s]+\.md)(?:#[^)]*)?\)/g)) {
    const rel = norm(dirOf(f), m[2]);
    if (docs[rel]) continue;
    if (read(rel) === null) { console.error('MISSING SOURCE', rel); process.exit(2); }
    docs[rel] = {id: tid+'-'+path.basename(rel,'.md'), tab:tid, sub:true, title:m[1]};
    tabDocs[tid].push(rel);
  }
}

// 2. Render non-empty mermaid fences to SVG (empty fences get a placeholder).
fs.mkdirSync(path.join(work,'m'),{recursive:true});
const pp = path.join(work,'puppeteer-config.json');
fs.writeFileSync(pp,'{"args":["--no-sandbox"]}');
let expected = 0, empty = 0;
for (const [rel,d] of Object.entries(docs)) {
  let n = 0;
  for (const m of read(rel).matchAll(/```mermaid\n([\s\S]*?)```/g)) {
    n++;
    if (!m[1].trim()) { empty++; continue; }
    expected++;
    const mmd = path.join(work,'m',`${d.id}-${n}.mmd`);
    fs.writeFileSync(mmd, m[1]);
    execFileSync('npx',['-y','@mermaid-js/mermaid-cli','-p',pp,'-i',mmd,'-o',mmd.replace('.mmd','.svg')],{stdio:['ignore','ignore','inherit']});
  }
}

// 3. Markdown -> HTML.
let svgCount = 0;
function render(rel) {
  const d = docs[rel], base = dirOf(rel);
  const blocks = [];
  let md = read(rel).replace(/```mermaid\n([\s\S]*?)```/g,(m,body)=>{ blocks.push(body); return `MERMAIDBLOCK${blocks.length-1}X`; });
  let html = marked.parse(md,{gfm:true});
  html = html.replace(/<p>(MERMAIDBLOCK\d+X)<\/p>/g,'$1').replace(/MERMAIDBLOCK(\d+)X/g,(m,i)=>{
    if (!blocks[+i].trim()) return '<div class="diagram empty">Diagram not yet defined in the source document.</div>';
    svgCount++;
    const svg = fs.readFileSync(path.join(work,'m',`${d.id}-${+i+1}.svg`),'utf8').replace(/<\?xml[^>]*\?>/,'');
    return `<div class="diagram" role="img" aria-label="Diagram">${svg}</div>`;
  });
  const seen = {};
  html = html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g,(m,l,t)=>{
    l = +l;
    if (l===1) return d.sub ? `<h2>${t}</h2>` : `<h1>${t}</h1>`;
    let s = slug(t); seen[s]=(seen[s]||0)+1; if (seen[s]>1) s+='-'+seen[s];
    const lv = Math.min(6, d.sub ? l+1 : l);
    return `<h${lv} id="${d.id}--${s}">${t}</h${lv}>`;
  });
  html = html.replace(/href="([^"]+)"/g,(m,h)=>{
    if (/^(https?:|#|mailto:)/.test(h) || !/\.md(#|$)/.test(h)) return m;
    const [p,frag] = h.split('#'), key = norm(base,p);
    if (!docs[key]) { console.error('UNMAPPED LINK',h,'in',rel); return m; }
    return `href="#${docs[key].id}${frag?'--'+frag:''}"`;
  });
  html = html.replace(/<table>/g,'<div class="tablewrap"><table>').replace(/<\/table>/g,'</table></div>');
  html = html.replace(/<td>(In use(?: \(scaffold\))?|Planned|To decide)(:[^<]*)?<\/td>/g,(m,s,r)=>{
    const c = s.startsWith('In use')?'ok':s==='Planned'?'plan':'open';
    return `<td><span class="pill ${c}">${s}</span>${r?'<span class="cand">'+r.slice(1).trim()+'</span>':''}</td>`;
  });
  return html;
}
let panels = '';
for (const [tid] of TABS) {
  let inner = '';
  for (const rel of tabDocs[tid]) {
    const d = docs[rel];
    if (!d.sub) { inner += render(rel); continue; }
    const body = read(rel).trim() ? render(rel) : `<h2>${d.title}</h2><p class="emptynote">This document is empty in the source repository.</p>`;
    inner += `<section class="doc" id="${d.id}">${body}</section>`;
  }
  panels += `<section class="panel" id="${tid}" data-panel hidden>${inner}</section>\n`;
}
const nav = TABS.map(([id,l])=>`<a role="tab" href="#${id}" data-tab="${id}">${l}</a>`).join('');
const out = `<title>Multi Tenants Web Platform Designs</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${fs.readFileSync(path.join(HERE,'style.css'),'utf8')}</style>
<header class="top"><div class="wrap"><span class="mark" aria-hidden="true"></span><h1 class="site">Multi Tenants Web Platform Designs</h1></div></header>
<nav class="tabs" role="tablist" aria-label="Design documents"><div class="wrap">${nav}</div></nav>
<main class="wrap">
${panels}</main>
<script>${fs.readFileSync(path.join(HERE,'app.js'),'utf8')}</script>
`;
fs.mkdirSync(DOCS+'html',{recursive:true});
fs.writeFileSync(DOCS+'html/multi-tenants-designs.html',out);
console.log(JSON.stringify({expectedSvgs:expected,inlinedSvgs:svgCount,emptyFences:empty,docs:Object.values(docs).map(d=>d.id)}));
