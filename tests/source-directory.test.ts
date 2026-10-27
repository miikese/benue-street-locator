import {it,expect,vi} from "vitest";
import osm from "../lib/osm-seed.json";
import directory from "../lib/directory-seed.json";
import {LGAS,categories,coordinates} from "../lib/domain";
import {initializeSourceDirectory} from "../lib/source-directory";
import {database} from "./database";
const records=[...osm,...directory];
it("ships attributed searchable places across the Benue LGA registry",()=>{
 expect(new Set(records.map(record=>record.id)).size).toBe(records.length);
 expect(new Set(records.map(record=>record.data.lga))).toEqual(new Set(LGAS));
 for(const record of records){
  expect(record.kind).toBe("place");expect(record.status).toBe("approved");
  expect(categories).toContain(record.data.category);expect(new URL(record.data.sourceUrl).protocol).toBe("https:");
  if(record.data.lat!==null)expect(()=>coordinates(record.data.lat,record.data.lng)).not.toThrow();
  else expect(record.data.lng).toBeNull();
 }
 expect(records.filter(record=>record.data.source==="GeoNames").length).toBeGreaterThan(25);
});
it("labels locality points and unconfirmed institutional pins honestly",()=>{
 for(const record of directory){
  if(record.data.source==="GeoNames"){
   expect(record.data.verification).toContain("not a building entrance");
   expect(record.data.sourceUrl).toMatch(/^https:\/\/www.geonames.org\/\d+\/$/);
  }
  if(record.data.source==="Public provider directory")expect(record.data.lat).toBeNull();
 }
});
it("adds expanded sources once in bounded batches and preserves moderator decisions",async()=>{
 const db=database(),batch=vi.spyOn(db,"batch");
 try{
  expect(await initializeSourceDirectory(db,records)).toBe(records.length);
  expect(batch.mock.calls.every(([statements])=>statements.length<=40)).toBe(true);
  await db.prepare("UPDATE records SET status='under-review',data=? WHERE id=?").bind(JSON.stringify({name:"Moderator correction"}),records[0].id).run();
  batch.mockClear();expect(await initializeSourceDirectory(db,records)).toBe(0);expect(batch).not.toHaveBeenCalled();
  const row=await db.prepare("SELECT status,data FROM records WHERE id=?").bind(records[0].id).first();
  expect(row.status).toBe("under-review");expect(JSON.parse(row.data).name).toBe("Moderator correction");
 }finally{db.close();}
});
