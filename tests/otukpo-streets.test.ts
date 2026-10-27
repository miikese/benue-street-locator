import {it,expect} from "vitest";
import directory from "../lib/directory-seed.json";
import osm from "../lib/osm-seed.json";
import {suggestPlaces} from "../lib/place-search";
import type {RecordItem} from "../lib/client";
const records=[...osm,...directory].map(record=>({...record,created:"",updated:""})) as RecordItem[];
it("finds Otukpo street names from prefixes, abbreviations and spelling variations",()=>{
 for(const [query,name] of [["f","Federal Road"],["federal rd","Federal Road"],["rice mil","Rice Mill Road"],["ogri oko","Ogiri Oko Street"],["old makurdi rd","Old Makurdi Road"],["orokam st","Orokam Street"],["oturkpo weto","Otukpo–Weto Road"]]){
  expect(suggestPlaces(records,query,"Otukpo","Street").map(record=>record.data.name),query).toContain(name);
 }
});
it("keeps unconfirmed street names unpinned and preserves source age",()=>{
 const streets=directory.filter(record=>record.data.source==="Published street reference");
 expect(streets.length).toBeGreaterThanOrEqual(20);
 for(const record of streets){expect(record.data.category).toBe("Street");expect(record.data.lga).toBe("Otukpo");expect(record.data.lat).toBeNull();expect(record.data.lng).toBeNull();expect(record.data.verification).toContain("unconfirmed");}
 const federal=streets.find(record=>record.data.name==="Federal Road")!;
 expect(federal.data.description).toContain("2019");
});
