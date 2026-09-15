// Parse Mermaid, typeset LaTeX, and catch Markdown-sensitive TeX patterns.
// A separate browser smoke test covers the static tutorial.
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
for(const sub of fs.readdirSync(path.join(root,'notebooks'))){
 const directory=path.join(root,'notebooks',sub);
 if(!fs.statSync(directory).isDirectory())continue;
 for(const file of fs.readdirSync(directory)){
  if(!file.endsWith('.ipynb'))continue;
  const notebook=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
  sources.push([file,notebook.cells.filter(c=>c.cell_type==='markdown').map(c=>Array.isArray(c.source)?c.source.join(''):c.source).join('\n')]);
 }
}
let mathCount=0,mermaidCount=0;const formulas=[];
for(const [name,source] of sources){
 if(/\^[*_](?!\w)/.test(source)){
  throw new Error(`${name}: use an explicit braced TeX symbol such as ^{\\star}; bare ^* and ^_ are changed by Markdown emphasis parsing.`);
 }
 for(const match of source.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)){
  await mermaid.parse(match[1]);mermaidCount++;
 }
 const fencedMath=[...source.matchAll(/```math\s*\n([\s\S]*?)```/g)].map(match=>match[1].trim());
 const noCode=source.replace(/```[\s\S]*?```/g,'').replace(/`[^`]*`/g,'');
 const dollarMath=[...noCode.matchAll(/\$\$([\s\S]*?)\$\$|(?<!\$)\$([^$\n]+)\$(?!\$)/g)].map(match=>(match[1]??match[2]).trim());
 for(const tex of [...fencedMath,...dollarMath]){
  const html=katex.renderToString(tex,{throwOnError:true,displayMode:true,strict:'error'});
  formulas.push({source:name,tex,html});mathCount++;
 }
}
fs.writeFileSync(path.join(root,'outputs/markdown_render_checks.json'),JSON.stringify({math_expressions:mathCount,mermaid_diagrams:mermaidCount,status:'passed',method:'KaTeX strict typesetting, Markdown-sensitive superscript guard, and Mermaid parser; browser check reported separately',katex_version:katex.version},null,2)+'\n');
console.log({mathCount,mermaidCount,status:'passed'});
