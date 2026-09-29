import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname,sep } from 'node:path';
const root=resolve(import.meta.dirname,'../dist/rentify/browser');
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname.startsWith('/api/')){
   const chunks=[];for await(const chunk of req){chunks.push(chunk);if(chunks.reduce((n,c)=>n+c.length,0)>6*1024*1024){res.writeHead(413);res.end();return;}}
   const headers={};for(const name of ['authorization','content-type'])if(req.headers[name])headers[name]=req.headers[name];
   const upstream=await fetch(`http://127.0.0.1:${process.env.BACKEND_PORT||3000}${url.pathname.slice(4)}${url.search}`,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{}),signal:AbortSignal.timeout(30000)});
   res.writeHead(upstream.status,{'content-type':upstream.headers.get('content-type')||'application/json'});res.end(Buffer.from(await upstream.arrayBuffer()));return;
  }
  let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  if(!extname(file))file=resolve(root,'index.html');
  await stat(file);res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(await readFile(file));
 }catch{res.writeHead(req.url?.startsWith('/api/')?502:404,{'content-type':'application/json'});res.end(JSON.stringify({message:'No se pudo conectar al backend o encontrar el recurso.'}));}
});
const port = Number(process.env.PORT || 4200);
server.listen(port,'127.0.0.1',()=>console.log(`Rentify: http://localhost:${port} (Ctrl+C para cerrar)`));
