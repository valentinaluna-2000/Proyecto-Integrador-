// AOT compiler + native esbuild CLI. No background esbuild service or IPC pipes.
// Useful on Windows installations that restrict child-process stdio pipes.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir,writeFile,copyFile,cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url);
const root=resolve(import.meta.dirname,'..');
const run=(command,args)=>new Promise((resolvePromise,reject)=>{const p=spawn(command,args,{cwd:root,stdio:'inherit',windowsHide:true});p.on('error',reject);p.on('exit',code=>code===0?resolvePromise():reject(new Error(`Build finalizó con código ${code}`)));});
await run(process.execPath,[resolve(root,'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'),'-p','tsconfig.app.json']);
await mkdir(resolve(root,'work'),{recursive:true});
await mkdir(resolve(root,'dist/rentify/browser'),{recursive:true});
await writeFile(resolve(root,'work/entry.mjs'),"import '@angular/compiler';\nimport('../out-tsc/app/main.js');\n");
const platform=`${process.platform}-${process.arch}`;
const executable=require.resolve(`@esbuild/${platform}/${process.platform==='win32'?'esbuild.exe':'bin/esbuild'}`);
await run(executable,['work/entry.mjs','--bundle','--format=esm','--platform=browser','--target=es2022','--supported:async-await=false','--minify','--define:ngDevMode=false','--define:ngJitMode=true','--outdir=dist/rentify/browser','--entry-names=main','--chunk-names=chunk-[hash]']);
await run(executable,['src/styles.css','--minify','--outfile=dist/rentify/browser/styles.css']);
await cp(resolve(root,'public'),resolve(root,'dist/rentify/browser'),{recursive:true});
await copyFile(resolve(root,'src/index.html'),resolve(root,'dist/rentify/browser/index.html'));
const {readFile}=await import('node:fs/promises');
const html=await readFile(resolve(root,'src/index.html'),'utf8');
await writeFile(resolve(root,'dist/rentify/browser/index.html'),html.replace('</head>','<link rel="stylesheet" href="styles.css"></head>').replace('</body>','<script type="module" src="main.js"></script></body>'));
console.log('Build Angular AOT completo: dist/rentify/browser');
