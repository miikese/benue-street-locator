import type {DB} from "./service";
export type SourceRecord={id:string;kind:string;status:string;data:Record<string,unknown>};
/** Add missing source IDs in small batches. Existing edits and moderation always win. */
export async function initializeSourceDirectory(db:DB,seed:SourceRecord[],now=new Date().toISOString()) {
 let imported=0;
 for(let offset=0;offset<seed.length;offset+=40){
  const chunk=seed.slice(offset,offset+40);
  const result=await db.prepare("SELECT id FROM records WHERE id IN ("+chunk.map(()=>"?").join(",")+")").bind(...chunk.map(record=>record.id)).all();
  const existing=new Set((result.results as {id:string}[]).map(record=>record.id));
  const missing=chunk.filter(record=>!existing.has(record.id));
  if(!missing.length)continue;
  await db.batch(missing.map(record=>db.prepare("INSERT OR IGNORE INTO records(id,kind,owner,status,data,created,updated) VALUES(?,?,?,?,?,?,?)").bind(record.id,record.kind,"source-import",record.status,JSON.stringify(record.data),now,now)));
  imported+=missing.length;
 }
 return imported;
}
