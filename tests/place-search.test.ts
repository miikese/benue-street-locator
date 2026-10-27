import {describe,it,expect} from "vitest";
import type {RecordItem} from "../lib/client";
import {suggestPlaces} from "../lib/place-search";
const place=(id:string,name:string,extra:Record<string,unknown>={}):RecordItem=>({id,kind:'place',status:'approved',created:'',updated:'',data:{name,description:'A public location',town:'Otukpo',lga:'Otukpo',category:'Street',...extra}});
describe('related place suggestions',()=>{
 const records=[place('street','Orokam Street'),place('clinic','Helen Clinic',{aliases:'Orokam clinic',category:'Hospital'}),place('market','Town Market')];
 it('suggests partial names and aliases with direct names first',()=>{
  expect(suggestPlaces(records,'Oro').map(r=>r.id)).toEqual(['street','clinic']);
  expect(suggestPlaces(records,'  HELEN ').map(r=>r.id)).toEqual(['clinic']);
 });
 it('supports related town names and minor spelling mistakes',()=>{
  expect(suggestPlaces(records,'Otuk').length).toBe(3);
  expect(suggestPlaces(records,'Orokamm').some(r=>r.id==='street')).toBe(true);
 });
 it('does not suggest for empty, coordinate or unrelated queries',()=>{
  for(const query of ['', '7.179556, 8.153785', 'no-such-location'])expect(suggestPlaces(records,query)).toEqual([]);
 });
 it('starts at one letter and ranks names instead of incidental description words',()=>{
  const leaf=place('leef','LEEF Centre',{aliases:'LEEF Center Learn2Earn'});
  expect(suggestPlaces([...records,leaf],'l','Otukpo').map(r=>r.id)).toEqual(['leef']);
  expect(suggestPlaces([leaf],'leef center','Otukpo')[0].id).toBe('leef');
  expect(suggestPlaces(records,'O').map(r=>r.id)).toEqual(['street','clinic']);
 });
 it('handles swapped letters and misspelled prefixes',()=>{
  expect(suggestPlaces(records,'Orkoam').some(r=>r.id==='street')).toBe(true);
  expect(suggestPlaces(records,'Oroka').some(r=>r.id==='street')).toBe(true);
 });
 it('honours filters and never suggests private or pending submissions',()=>{
  const hidden={...place('pending','Orokam Secret'),status:'pending'};
  expect(suggestPlaces([...records,hidden],'Oro','Otukpo','Hospital').map(r=>r.id)).toEqual(['clinic']);
  expect(suggestPlaces(records,'Oro','Makurdi')).toEqual([]);
 });
 it('limits results to six visible options',()=>{
  expect(suggestPlaces(Array.from({length:12},(_,i)=>place(String(i),'Orokam '+i)),'Oro')).toHaveLength(6);
 });
});
