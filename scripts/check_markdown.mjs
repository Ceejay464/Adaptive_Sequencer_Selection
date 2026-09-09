// Parse Mermaid and typeset LaTeX locally. This does not drive a browser.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const katex=require('../validation/node_modules/katex');
const {JSDOM}=await import('../validation/node_modules/jsdom/lib/api.js');
const dom=new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window=dom.window;globalThis.document=dom.window.document;
const mermaid=(await import('../validation/node_modules/mermaid/dist/mermaid.esm.mjs')).default;
mermaid.initialize({startOnLoad:false,securityLevel:'strict'});
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
const sources=[['README.md',readme]];
for(const sub of ['quantecon_nashpy','gambit_pygambit']){
 for(const file of fs.readdirSync(path.join(root,'notebooks',sub))){
  if(!file.endsWith('.ipynb'))continue;
  const notebook=JSON.parse(fs.readFileSync(path.join(root,'notebooks',sub,file),'utf8'));
  sources.push([file,notebook.cells.filter(c=>c.cell_type==='markdown').map(c=>Array.isArray(c.source)?c.source.join(''):c.source).join('\n')]);
 }
}
let mathCount=0,mermaidCount=0;const formulas=[];
for(const [name,source] of sources){
 for(const match of source.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)){
  await mermaid.parse(match[1]);mermaidCount++;
 }
 const noCode=source.replace(/```[\s\S]*?```/g,'').replace(/`[^`]*`/g,'');
 for(const match of noCode.matchAll(/\$\$([\s\S]*?)\$\$|(?<!\$)\$([^$\n]+)\$(?!\$)/g)){
  const tex=(match[1]??match[2]).trim();
  const html=katex.renderToString(tex,{throwOnError:true,displayMode:match[1]!==undefined,strict:'error'});
  formulas.push({source:name,tex,html});mathCount++;
 }
}
fs.writeFileSync(path.join(root,'outputs/markdown_render_checks.json'),JSON.stringify({math_expressions:mathCount,mermaid_diagrams:mermaidCount,status:'passed',method:'KaTeX strict typesetting and Mermaid parser; no live browser claim',katex_version:katex.version},null,2)+'\n');
console.log({mathCount,mermaidCount,status:'passed'});
