import {describe,it,expect} from 'vitest';
import {createLatestTask} from '../lib/latest-task';
function deferred<T>() {
  let resolve!: (value:T)=>void;
  let reject!: (error:unknown)=>void;
  const promise=new Promise<T>((accept,fail)=>{resolve=accept;reject=fail;});
  return {promise,resolve,reject};
}
describe('selection-bound requests',()=>{
  it('ignores an older place history when the newer selection finishes first',async()=>{
    const task=createLatestTask(),old=deferred<string>(),next=deferred<string>(),shown:string[]=[];
    const first=task.run(()=>old.promise,value=>shown.push(value),()=>{});
    const second=task.run(()=>next.promise,value=>shown.push(value),()=>{});
    next.resolve('place B history');await second;old.resolve('place A history');await first;
    expect(shown).toEqual(['place B history']);
  });
  it('does not attach an old route or reset current loading after destination changes',async()=>{
    const task=createLatestTask(),route=deferred<string>();let shown='';let settled=0;
    const request=task.run(()=>route.promise,value=>{shown=value},()=>{},()=>{settled++});
    task.invalidate();route.resolve('route to previous place');await request;
    expect(shown).toBe('');expect(settled).toBe(0);
  });
  it('suppresses stale errors but reports errors belonging to the current selection',async()=>{
    const task=createLatestTask(),old=deferred<string>();const errors:unknown[]=[];
    const request=task.run(()=>old.promise,()=>{},error=>errors.push(error));
    task.invalidate();old.reject(new Error('old selection unavailable'));await request;
    await task.run(()=>Promise.reject(new Error('current failure')),()=>{},error=>errors.push(error));
    expect(errors).toHaveLength(1);expect((errors[0] as Error).message).toBe('current failure');
  });
  it('permits a fresh task after invalidation and settles once',async()=>{
    const task=createLatestTask();task.invalidate();let result='';let settled=0;
    await task.run(()=>Promise.resolve('current QR'),value=>{result=value},()=>{},()=>{settled++});
    expect(result).toBe('current QR');expect(settled).toBe(1);
  });
});
