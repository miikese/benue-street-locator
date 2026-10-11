import {readFileSync,writeFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
const rows=JSON.parse(readFileSync("lib/osm-seed.json","utf8"));
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const sql=rows.map(r=>"INSERT OR IGNORE INTO records(id,kind,owner,status,data,created,updated) VALUES("+[r.id,r.kind,"osm-import",r.status,JSON.stringify(r.data),new Date().toISOString(),new Date().toISOString()].map(quote).join(",")+");").join("\n");
writeFileSync(".sites-runtime/seed.sql",sql);
const result=spawnSync(process.execPath,["--import","./scripts/sites-env.mjs","./node_modules/wrangler/bin/wrangler.js","d1","execute","DB","--local","--config","dist/server/wrangler.json","--persist-to",".wrangler/state","--file",".sites-runtime/seed.sql"],{stdio:"inherit"});
process.exit(result.status||0);
