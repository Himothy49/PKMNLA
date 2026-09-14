import fs from 'node:fs';
import vm from 'node:vm';

let source=fs.readFileSync(new URL('./app.mjs', import.meta.url),'utf8');
source=source.replace(/^import .*?;\n/,'');
// Keep all battle/data helpers, but remove browser event wiring and automatic load.
source=source.slice(0, source.indexOf("document.querySelector('.top').addEventListener"));
const prelude=`
const createClient=()=>({});
const document={querySelector(){return {innerHTML:'',addEventListener(){}}}};
const window={};
`;

const tests=`
const assert=(c,m)=>{if(!c)throw new Error(m)};
const originalRandom=Math.random;
Math.random=()=>0.5;
const mk=(id,name,types,bs,moves)=>({id,name:name.toLowerCase(),displayName:name,types,baseStats:bs,species:null,moves});
const mv=(id,type,power,accuracy=100,pp=20,extra={})=>({id,type,category:PHYSICAL.has(type)?'physical':'special',power,accuracy,pp,priority:0,multihit:null,drain:0,recoil:0,ohko:false,damage:null,status:null,volatileStatus:null,boosts:null,flinch:0,secondary:null,...extra});

// Type matrix smoke tests.
assert(effect('normal','ghost')===0,'Normal -> Ghost must be immune');
assert(effect('ghost','normal')===0,'Ghost -> Normal must be immune');
assert(effect('fighting','ghost')===0,'Fighting -> Ghost must be immune');
assert(effect('ghost','psychic')===2,'Ghost -> Psychic must be 2x');
assert(effect('psychic','ghost')===2,'Psychic -> Ghost must be 2x');
assert(effect('electric','ground')===0,'Electric -> Ground must be immune');
assert(effect('ground','flying')===0,'Ground -> Flying must be immune');
assert(effect('ice','fire')===1,'Ice -> Fire must be neutral in Gen I');
assert(effect('poison','bug')===2,'Poison -> Bug must be 2x in Gen I');
assert(effect('bug','poison')===2,'Bug -> Poison must be 2x in Gen I');

// Crit-rate tests.
const tauros={baseSpeed:110,volatile:{}};
assert(Math.abs(critChance(tauros,mv('body-slam','normal',85))-0.21484375)<1e-12,'Tauros crit rate incorrect');
assert(critChance({baseSpeed:100,volatile:{}},mv('slash','normal',70))===1,'Clean high-crit cap should be 100%');

// Damage tests: STAB > non-STAB, immunity = zero, resistance < neutral.
const char=mk(6,'Charizard',['fire','flying'],{hp:78,atk:84,def:78,spe:100,spc:85},[]);
const venus=mk(3,'Venusaur',['grass','poison'],{hp:80,atk:82,def:83,spe:80,spc:100},[]);
char.max=maxStats(char);venus.max=maxStats(venus);char.baseSpeed=100;venus.baseSpeed=80;char.boosts={atk:0,def:0,spe:0,spc:0,acc:0,evasion:0};venus.boosts={atk:0,def:0,spe:0,spc:0,acc:0,evasion:0};char.status=null;venus.status=null;char.volatile={};venus.volatile={};char.pp={};venus.pp={};
const fire=mv('fire-blast','fire',120,85,5);const normal=mv('body-slam','normal',85,100,15);const water=mv('surf','water',95,100,15);char.pp={'fire-blast':5,'body-slam':15,'surf':15};venus.pp={'body-slam':15,'razor-leaf':25,'sleep-powder':15,'growth':40};
const f=damage(char,venus,fire);assert(f.dmg>0&&f.e===2,'Fire vs Grass/Poison should be 2x');
const n=damage(char,venus,normal);assert(n.dmg>0,'Neutral damage should be nonzero');
const w=damage(char,venus,water);assert(w.e===0.5,'Water vs Grass should be resisted');
const ghost=mk(94,'Gengar',['ghost','poison'],{hp:60,atk:65,def:60,spe:110,spc:130},[]);ghost.max=maxStats(ghost);ghost.baseSpeed=110;ghost.boosts={atk:0,def:0,spe:0,spc:0,acc:0,evasion:0};ghost.status=null;ghost.volatile={};ghost.pp={};
assert(damage(char,ghost,normal).dmg===0,'Normal must not damage Ghost');

// Secondary effect must only use the data-layer secondary once.
venus.hp=venus.max.hp; venus.status=null; const bs=mv('body-slam','normal',85,100,15,{secondary:{status:'par',chance:100}});venus.status=null;const before=venus.status;resolveMove(char,venus,bs,()=>{});assert(venus.status==='par','Body Slam secondary status did not apply');

// Recoil: Double-Edge is 1/4; Struggle is 1/2.
const de=mv('double-edge','normal',100,100,15);de.recoil=.25;char.hp=char.max.hp;resolveMove(char,venus,de,()=>{});assert(char.hp<char.max.hp,'Double-Edge should cause recoil');

// Clean crash damage: HJK miss costs exactly 1 HP.
const hjk=mv('high-jump-kick','fighting',85,1,20);char.hp=char.max.hp;Math.random=()=>0.99;resolveMove(char,venus,hjk,()=>{});assert(char.hp===char.max.hp-1,'High Jump Kick miss must cause 1 crash damage');

// Local battle smoke test: move -> damage -> turn increments without throwing.
Math.random=()=>0.5;
const a={...char,max:{...char.max},hp:char.max.hp,status:null,statusTurns:0,toxicCounter:0,boosts:{atk:0,def:0,spe:0,spc:0,acc:0,evasion:0},volatile:{},leechSeed:null,moves:[fire,normal,water,mv('slash','normal',70,100,20,{})],pp:{'fire-blast':5,'body-slam':15,surf:15,slash:20}};
const b={...venus,max:{...venus.max},hp:venus.max.hp,status:null,statusTurns:0,toxicCounter:0,boosts:{atk:0,def:0,spe:0,spc:0,acc:0,evasion:0},volatile:{},leechSeed:null,moves:[mv('razor-leaf','grass',55,95,25,{}) ,normal,mv('sleep-powder','grass',0,75,15,{}),mv('growth','normal',0,100,40,{})],pp:{'razor-leaf':25,'body-slam':15,'sleep-powder':15,growth:40}};
S.ready=true;S.page='battle';S.battle={mode:'local',my:[a],foe:[b],mi:0,fi:0,turn:1,log:[],over:false,waitingSwitch:false};
resolveLocalAction({type:'move',index:0});
assert(S.battle.turn===2,'Local battle did not advance the turn');
assert(S.battle.my[0].pp['fire-blast']===4,'Move PP did not decrement');


// Special-move smoke tests on the same engine helpers.
const counter=mv('counter','fighting',1,100,20);const counterUser={...char,max:{...char.max},hp:char.max.hp,status:null,statusTurns:0,toxicCounter:0,boosts:{atk:0,def:0,spe:0,spc:0,acc:0,evasion:0},volatile:{},lastHit:{damage:25,type:'normal'},moves:[counter],pp:{counter:20},types:['normal'],baseSpeed:100};
const counterTarget={...venus,max:{...venus.max},hp:venus.max.hp,status:null,statusTurns:0,toxicCounter:0,boosts:{atk:0,def:0,spe:0,spc:0,acc:0,evasion:0},volatile:{},lastHit:null,moves:[],pp:{},types:['grass','poison'],baseSpeed:80};
const beforeCounter=counterTarget.hp;resolveMove(counterUser,counterTarget,counter,()=>{});assert(counterTarget.hp===beforeCounter-50,'Counter must return double the stored hit');

const conv=mv('conversion','normal',0,100,30);counterUser.pp.conversion=30;resolveMove(counterUser,counterTarget,conv,()=>{});assert(JSON.stringify(counterUser.types)===JSON.stringify(counterTarget.types),'Conversion must copy target typing');

const trans=mv('transform','normal',0,100,10);counterUser.pp.transform=10;counterUser.moves=[trans];counterUser.types=['normal'];resolveMove(counterUser,counterTarget,trans,()=>{});assert(counterUser.types[0]===counterTarget.types[0],'Transform must copy target typing');

const dis=mv('disable','normal',0,55,20);counterUser.moves=[dis];counterUser.pp.disable=20;counterTarget.moves=[normal];counterTarget.pp={'body-slam':15};resolveMove(counterUser,counterTarget,dis,()=>{});assert(counterTarget.volatile.disabled,'Disable must create a disabled move state');

Math.random=originalRandom;
console.log('Kanto PvP V12 runtime battle playtest: PASS');
console.log('Type matrix: PASS');
console.log('Crit math: PASS');
console.log('Damage/STAB/effectiveness: PASS');
console.log('Secondary effects: PASS');
console.log('Recoil/crash: PASS');
console.log('Local battle turn/PP smoke test: PASS');
`;
vm.runInThisContext(prelude+'\n'+source+'\n'+tests);
