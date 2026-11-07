// Usage: node check.mjs <repoRoot> <workDir>  (needs playwright-core in workDir and chrome-headless-shell in ~/.cache/puppeteer)
import fs from 'fs'; import path from 'path'; import os from 'os';
import {pathToFileURL} from 'url';
const [repo, work] = process.argv.slice(2);
const {chromium} = await import(pathToFileURL(path.join(work,'node_modules/playwright-core/index.mjs')).href);
const root = path.join(os.homedir(),'.cache/puppeteer/chrome-headless-shell');
const ver = fs.readdirSync(root)[0];
const exe = path.join(root,ver,'chrome-headless-shell-linux64/chrome-headless-shell');
const b = await chromium.launch({executablePath:exe,args:['--no-sandbox']});
const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
const url = pathToFileURL(path.join(repo,'design-docs/html/multi-tenants-designs.html')).href;
const vis = () => p.evaluate(()=>[...document.querySelectorAll('[data-panel]')].filter(e=>!e.hidden).map(e=>e.id+':'+e.innerText.length));
const ids = await (async()=>{await p.goto(url);return p.evaluate(()=>[...document.querySelectorAll('[data-panel],.doc')].map(e=>e.id));})();
for (const h of ids) { await p.goto(url+'#'+h); await p.reload(); await p.waitForTimeout(100); console.log('deep link',h,await vis()); }
await p.goto(url+'#'+ids[0]); await p.click('[data-tab="'+ids[1]+'"]'); await p.waitForTimeout(200);
console.log('tab click',await vis(),await p.evaluate(()=>location.hash));
console.log('horizontal scroll:',await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'errors:',errs);
await b.close();
