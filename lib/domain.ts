export const LGAS = ["Ado","Agatu","Apa","Buruku","Gboko","Guma","Gwer East","Gwer West","Katsina-Ala","Konshisha","Kwande","Logo","Makurdi","Obi","Ogbadibo","Ohimini","Oju","Okpokwu","Otukpo","Tarka","Ukum","Ushongo","Vandeikya"];
export const categories = ["Street","Market","School","Hospital","Clinic","Pharmacy","Police","Fire service","Hotel","Restaurant","Shop","Government","Public facility","Business","Transport","Landmark"];
export const publicKinds = ["place","correction"];
export const privateKinds: string[] = [];
export const publicStatuses = ["approved"];
export const initialStatus = (_kind: string) => "pending";
export function text(value: unknown, name: string, min=1, max=200): string {
 if(typeof value !== "string" || value.trim().length<min || value.trim().length>max) throw new Error(name+" must be "+min+"–"+max+" characters.");
 return value.trim();
}
export function coordinates(lat: unknown,lng: unknown) {
 if(typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < 6.3 || lat > 8.6 || lng < 7.2 || lng > 10.1) throw new Error("Choose coordinates within the Benue search region.");
 return {lat,lng};
}
export function validate(kind:string,d:Record<string,unknown>) {
 if(!publicKinds.includes(kind)) throw new Error("Unsupported submission.");
 const name=text(d.name,"Name",3,120),description=text(d.description,"Description",10,1800);
 if(!LGAS.includes(String(d.lga))) throw new Error("Choose a valid Benue LGA.");
 if(!categories.includes(String(d.category))) throw new Error("Choose a category.");
 const c=coordinates(d.lat,d.lng);
 const website=String(d.website||"").trim();
 if(website) {
  let url:URL;
  try {url=new URL(website);} catch {throw new Error("Website must be a valid HTTPS URL.");}
  if(url.protocol!=="https:" || !url.hostname || url.username || url.password || /\s/.test(website)) throw new Error("Website must be a public HTTPS URL without credentials.");
 }
 return {name,description,...c,lga:d.lga,category:d.category,town:text(d.town||d.lga,"Town",2,100),address:String(d.address||"").slice(0,200),aliases:String(d.aliases||"").slice(0,300),hours:String(d.hours||"").slice(0,200),phone:String(d.phone||"").slice(0,50),website,photo:String(d.photo||""),source:"Community submission",verification:"Community reviewed",private:false};
}
export function canTransition(_kind:string,from:string,to:string) {
 return ({pending:["under-review","approved","rejected"],"under-review":["approved","rejected"],approved:["under-review"],rejected:["under-review"]} as Record<string,string[]>)[from]?.includes(to) || false;
}
// Search our reviewed directory only; never send keystrokes to a geocoder.
function normalizeSearch(value:string) {
 return value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}
function oneEditApart(a:string,b:string) {
 if(Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,edits=0;
 while(i<a.length && j<b.length) {
  if(a[i]===b[j]){i++;j++;continue;}
  if(++edits>1)return false;
  if(a.length>=b.length)i++;
  if(b.length>=a.length)j++;
 }
 return edits+(i<a.length?1:0)+(j<b.length?1:0)<=1;
}
export function matchPlaces<T extends {data:Record<string,unknown>}>(rows:T[],q:string,lga="",category="") {
 const terms=normalizeSearch(q).trim().split(/\s+/).filter(Boolean);
 return rows.filter(r => {
  if((lga && r.data.lga!==lga)||(category && r.data.category!==category))return false;
  const haystack=normalizeSearch([r.data.name,r.data.aliases,r.data.address,r.data.town,r.data.description].join(" "));
  const words=haystack.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return terms.every(term=>haystack.includes(term)||(term.length>=4 && words.some(word=>oneEditApart(term,word))));
 });
}
export function distance(a:{lat:number,lng:number},b:{lat:number,lng:number}) {
 const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad;
 const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
