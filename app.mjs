import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL='https://cfffoclrpsxldfhsofha.supabase.co';
const SUPABASE_KEY='sb_publishable_LOgq_zm7n7p6LFeOyIIhfg_xai-sh4p';
const LEVEL=50;
// Clean competitive rules: Gen I data and type-based physical/special, but no cartridge glitches.
// Accuracy uses the displayed percentage exactly; Focus Energy is intuitive (4x crit rate);
// no 1/256 miss, no desync/semi-invulnerability bugs, and no glitch-based stat reapplication.
const SPRITE=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent/${id}.png`;
const ART=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const TYPE_ORDER=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon'];
const PHYSICAL=new Set(['normal','fighting','flying','poison','ground','rock','bug','ghost']);
const GEN1_MOVE_TYPE_OVERRIDES={bite:'normal',gust:'normal','karate-chop':'normal','sand-attack':'ground','razor-wind':'normal',struggle:'normal'};
const TYPE_CHART={
 normal:{rock:.5,ghost:0},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5},water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5},ice:{fire:1,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2},fighting:{normal:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0},poison:{grass:2,poison:.5,ground:.5,bug:2,rock:.5,ghost:.5},ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2},flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5},psychic:{fighting:2,poison:2,psychic:.5,bug:2,ghost:2},bug:{fire:.5,grass:2,fighting:.5,poison:2,flying:.5,psychic:2,ghost:.5},rock:{normal:.5,fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2},ghost:{normal:0,psychic:2,ghost:2},dragon:{dragon:2}
};
const STATUS_MOVES={
 'thunder-wave':{status:'par',chance:100},'stun-spore':{status:'par',chance:100},glare:{status:'par',chance:100},'poison-powder':{status:'poison',chance:100},toxic:{status:'toxic',chance:100},'poison-sting':{status:'poison',chance:30},
 'sleep-powder':{status:'sleep',chance:100},hypnosis:{status:'sleep',chance:100},sing:{status:'sleep',chance:100},'lovely-kiss':{status:'sleep',chance:100},spore:{status:'sleep',chance:100},
 'confuse-ray':{status:'confusion',chance:100},supersonic:{status:'confusion',chance:100},'psybeam':{status:'confusion',chance:10},'water-pulse':{status:'confusion',chance:20},
 recover:{heal:50},'soft-boiled':{heal:50},rest:{heal:100,status:'sleep'},
 'swords-dance':{boost:'atk',amount:2},growth:{boost:'spc',amount:1},amnesia:{boost:'spc',amount:2},agility:{boost:'spe',amount:2},harden:{boost:'def',amount:1},withdraw:{boost:'def',amount:1},'defense-curl':{boost:'def',amount:1},meditate:{boost:'atk',amount:1},sharpen:{boost:'atk',amount:1},'acid-armor':{boost:'def',amount:2},barrier:{boost:'def',amount:2},
 leer:{boost:'foeDef',amount:-1},'tail-whip':{boost:'foeDef',amount:-1},growl:{boost:'foeAtk',amount:-1},'string-shot':{boost:'foeSpe',amount:-1},'sand-attack':{boost:'foeAcc',amount:-1},'smoke-screen':{boost:'foeAcc',amount:-1},kinesis:{boost:'foeAcc',amount:-1},flash:{boost:'foeAcc',amount:-1},screech:{boost:'foeDef',amount:-2},'double-team':{boost:'evasion',amount:1},minimize:{boost:'evasion',amount:1},
 smog:{status:'poison',chance:40},sludge:{status:'poison',chance:30},'body-slam':{status:'par',chance:30},'lick':{status:'par',chance:30},thunder:{status:'par',chance:10},thunderbolt:{status:'par',chance:10},'ice-beam':{status:'freeze',chance:10},blizzard:{status:'freeze',chance:10},'flamethrower':{status:'burn',chance:10},'fire-blast':{status:'burn',chance:30},ember:{status:'burn',chance:10},'rock-slide':{},'bite':{flinch:10},'stomp':{flinch:30},'headbutt':{flinch:30},'slash':{crit:true},'razor-leaf':{crit:true},'karate-chop':{crit:true},'crabhammer':{crit:true},'high-jump-kick':{recoil:1},'jump-kick':{recoil:1},'take-down':{recoil:.25},'double-edge':{recoil:.25},'submission':{recoil:.25},'struggle':{recoil:.5},
 'leech-seed':{volatile:'leech-seed'},substitute:{volatile:'substitute'},reflect:{volatile:'reflect'},'light-screen':{volatile:'light-screen'},haze:{volatile:'haze'},disable:{volatile:'disable'},counter:{special:'counter'},bide:{special:'bide'},'rage':{volatile:'rage'},'focus-energy':{volatile:'focus-energy'},'mist':{volatile:'mist'},'roar':{forceSwitch:true},whirlwind:{forceSwitch:true},'self-destruct':{selfdestruct:true},explosion:{selfdestruct:true},'hyper-beam':{recharge:true},'fire-spin':{volatile:'trap'},'wrap':{volatile:'trap'},bind:{volatile:'trap'},clamp:{volatile:'trap'},'vice-grip':{volatile:'trap'},'razor-wind':{charge:true},dig:{charge:true},fly:{charge:true},'solar-beam':{charge:true},'skull-bash':{charge:true},'ice-beam':{status:'freeze',chance:10}
};

const RECOIL_MOVES=new Set(['take-down','double-edge','submission','high-jump-kick','jump-kick','struggle']);
const S={page:'home',ready:false,error:null,dex:null,gen:null,mons:[],byId:new Map(),selected:null,team:[],moves:new Map(),movePool:new Map(),moveAliases:new Map(),moveRecords:new Map(),moveNames:new Map(),search:'',type:'',sort:'id',battle:null,online:null};
const app=document.querySelector('#app');
const cap=s=>String(s).split('-').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const compactMoveId=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const kebabMoveId=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const canonicalMoveId=id=>S.moveAliases.get(compactMoveId(id))||kebabMoveId(id);
const moveLabel=id=>S.moveNames.get(canonicalMoveId(id))||cap(canonicalMoveId(id));
const effect=(type,target)=>(TYPE_CHART[type]||{})[target]??1;
const typeMult=(move,target)=>target.types.reduce((m,t)=>m*effect(move.type,t),1);
const stage=n=>n>=0?(2+n)/2:2/(2-n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const randomInt=n=>Math.floor(Math.random()*n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function validateGen1(){
 const types=Array.from(S.gen.types||[]).map(t=>String(t.id||t.name||'').toLowerCase()).filter(Boolean);
 if(types.length!==15)throw Error(`Gen I validation failed: expected 15 types, received ${types.length}.`);
 const moves=Array.from(S.gen.moves||[]);if(moves.length!==165)throw Error(`Gen I validation failed: expected 165 moves, received ${moves.length}.`);
 const required=[["normal","ghost",0],["ghost","normal",0],["fighting","ghost",0],["ghost","psychic",2],["psychic","ghost",2],["electric","ground",0],["ground","flying",0]];
 for(const [a,b,v] of required)if(effect(a,b)!==v)throw Error(`Type chart validation failed: ${a} -> ${b}.`);
 for(const mon of S.mons){
   const ls=await learnset(mon);
   if(ls.length<4)throw Error(`${mon.displayName} has fewer than four legal Gen I moves.`);
   const pool=new Set(ls);
   const picks=RECOMMENDED[mon.id]||[];
   for(const id of picks){
     const cid=canonicalMoveId(id);
     if(!pool.has(cid)){
       const mv=S.moveRecords.get(cid);
       if(!mv)throw Error(`Recommended moveset error: ${moveLabel(id)} is missing from the Gen I move registry.`);
       let ok=false;try{ok=await S.gen.learnsets.canLearn(mon.displayName,mv.name||cid);}catch{}
       if(!ok)throw Error(`Recommended moveset error: ${mon.displayName} cannot legally learn ${moveLabel(id)} in Gen I.`);
     }
   }
   const rec=recommendedMoves(mon);
   if(rec.length!==4||new Set(rec).size!==4)throw Error(`Recommended moveset error: ${mon.displayName} does not have exactly four valid moves.`);
 }
 return true;
}

async function loadData(){
 try{
  if(!window.pkmn?.dex?.Dex||!window.pkmn?.data?.Generations)throw Error('Gen I data library failed to load. Refresh once if this happens.');
  S.dex=pkmn.dex.Dex.forGen(1);S.gen=new pkmn.data.Generations(pkmn.dex.Dex).get(1);
  S.moveAliases.clear();S.moveRecords.clear();S.moveNames.clear();
  for(const mv of S.gen.moves){const cid=kebabMoveId(mv.name||mv.id);S.moveRecords.set(cid,mv);S.moveNames.set(cid,mv.name||cap(cid));S.moveAliases.set(compactMoveId(mv.id||mv.name),cid);S.moveAliases.set(compactMoveId(mv.name),cid);S.moveAliases.set(compactMoveId(cid),cid);}
  const arr=[];
  for(const sp of S.gen.species){if(!sp.num||sp.num>151||sp.isNonstandard)continue;arr.push({id:sp.num,name:sp.name.toLowerCase(),displayName:sp.name,types:sp.types.map(x=>x.toLowerCase()),baseStats:{hp:sp.baseStats.hp,atk:sp.baseStats.atk,def:sp.baseStats.def,spe:sp.baseStats.spe,spc:sp.baseStats.spc},sprite:SPRITE(sp.num),art:ART(sp.num),species:sp});}
  arr.sort((a,b)=>a.id-b.id);S.mons=arr;arr.forEach(m=>S.byId.set(m.id,m));
  if(arr.length!==151)throw Error(`Expected 151 Gen I Pokémon, received ${arr.length}.`);
  await validateGen1();
  S.ready=true;render();
 }catch(e){S.error=e;render();}
}
async function learnset(mon){
 if(mon.learned)return mon.learned;
 const out=new Set();
 const speciesName=mon.displayName;
 try{
   const raw=await S.dex.getLearnsets(speciesName);
   const table=raw?.learnset||{};
   for(const [id,sources] of Object.entries(table)){
     if(Array.isArray(sources)&&sources.some(src=>String(src).startsWith('1')))out.add(canonicalMoveId(id));
   }
 }catch{}

 // IMPORTANT: getLearnsets() can return a successfully loaded record whose
 // shape/source tags are not the Gen I view we need. Never trust that result
 // alone. Use the documented generation-aware canLearn() check to repair
 // missing Gen I moves and, when necessary, build the pool from it.
 const recommended=RECOMMENDED[mon.id]||[];
 const mustCheck=new Set();
 for(const id of recommended){const cid=canonicalMoveId(id);if(!out.has(cid))mustCheck.add(cid);}
 if(out.size<4){
   for(const mv of S.gen.moves)mustCheck.add(canonicalMoveId(mv.id||mv.name));
 }
 if(mustCheck.size){
   for(const cid of mustCheck){
     const mv=S.moveRecords.get(cid); if(!mv)continue;
     const name=mv.name||cid;
     try{if(await S.gen.learnsets.canLearn(speciesName,name))out.add(cid);}catch{}
   }
 }
 mon.learned=[...out].filter(id=>moveData(id)).sort((a,b)=>moveLabel(a).localeCompare(moveLabel(b)));
 if(mon.learned.length<4)throw Error(`${mon.displayName} has ${mon.learned.length} legal Gen I moves after both learnset sources were checked.`);
 return mon.learned;
}
function moveData(id){
 const cid=canonicalMoveId(id);const m=S.moveRecords.get(cid);
 if(!m||m.exists===false)return null;
 const key=compactMoveId(cid);let override;
 for(const [k,v] of Object.entries(GEN1_MOVE_TYPE_OVERRIDES)){if(compactMoveId(k)===key){override=v;break;}}
 const type=(override||(m.type||'Normal')).toLowerCase();const secondary=m.secondary||null;
 return{id:cid,name:cid,type,category:PHYSICAL.has(type)?'physical':'special',power:m.basePower||0,accuracy:m.accuracy===true?100:(m.accuracy||100),pp:m.pp||1,priority:m.priority||0,multihit:m.multihit||null,drain:m.drain||0,recoil:m.recoil||0,ohko:!!m.ohko,damage:m.damage||null,status:m.status||null,volatileStatus:m.volatileStatus||null,boosts:m.boosts||null,flinch:m.flinch||0,secondary};
}
const RECOMMENDED={
  // Representative RBY OU sets. Every entry is still checked against the
  // actual Red/Blue learnset before it can be used.
  3:['razor-leaf','sleep-powder','growth','leech-seed'],
  6:['fire-blast','slash','swords-dance','body-slam'],
  9:['surf','blizzard','rest','withdraw'],
  25:['thunderbolt','thunder-wave','substitute','thunder'],
  26:['thunderbolt','thunder-wave','reflect','rest'],
  31:['earthquake','blizzard','thunder','body-slam'],
  34:['earthquake','thunderbolt','rock-slide','body-slam'],
  35:['sing','thunder-wave','psychic','ice-beam'],
  36:['psychic','thunder-wave','reflect','ice-beam'],
  38:['fire-blast','body-slam','rest','substitute'],
  53:['slash','psychic','body-slam','substitute'],
  55:['surf','psychic','ice-beam','rest'],
  59:['fire-blast','body-slam','rest','reflect'],
  65:['psychic','thunder-wave','recover','reflect'],
  68:['submission','earthquake','rock-slide','body-slam'],
  76:['earthquake','rock-slide','body-slam','rest'],
  80:['surf','psychic','amnesia','rest'],
  82:['thunderbolt','thunder-wave','reflect','rest'],
  89:['sludge','toxic','earthquake','explosion'],
  91:['blizzard','clamp','surf','explosion'],
  94:['hypnosis','psychic','thunderbolt','night-shade'],
  97:['hypnosis','psychic','thunder-wave','rest'],
  101:['thunderbolt','thunder-wave','explosion','reflect'],
  103:['psychic','sleep-powder','stun-spore','explosion'],
  105:['earthquake','rock-slide','body-slam','rest'],
  112:['earthquake','rock-slide','body-slam','substitute'],
  121:['psychic','thunderbolt','recover','thunder-wave'],
  123:['slash','swords-dance','agility','hyper-beam'],
  124:['lovely-kiss','psychic','ice-beam','thunderbolt'],
  125:['thunderbolt','thunder-wave','seismic-toss','reflect'],
  126:['fire-blast','psychic','submission','body-slam'],
  127:['slash','swords-dance','body-slam','hyper-beam'],
  128:['body-slam','earthquake','blizzard','thunderbolt'],
  130:['surf','blizzard','hyper-beam','body-slam'],
  131:['surf','blizzard','body-slam','rest'],
  132:['transform','rest','substitute','toxic'],
  134:['surf','blizzard','acid-armor','rest'],
  135:['thunderbolt','thunder-wave','pin-missile','substitute'],
  136:['fire-blast','body-slam','rest','substitute'],
  137:['thunderbolt','ice-beam','psychic','recover'],
  139:['surf','blizzard','ice-beam','rest'],
  141:['slash','swords-dance','agility','hyper-beam'],
  142:['rock-slide','hyper-beam','fire-blast','earthquake'],
  143:['body-slam','earthquake','rest','amnesia'],
  144:['blizzard','ice-beam','agility','rest'],
  145:['thunderbolt','drill-peck','thunder-wave','agility'],
  146:['fire-blast','agility','hyper-beam','body-slam'],
  147:['agility','thunder-wave','substitute','body-slam'],
  148:['agility','thunder-wave','hyper-beam','body-slam'],
  149:['agility','blizzard','thunderbolt','hyper-beam'],
  150:['psychic','recover','thunder-wave','reflect'],
  151:['psychic','ice-beam','thunderbolt','transform']
};
function scoreRecommended(mon,m){
  let score=0;
  if(mon.types.includes(m.type)) score+=22;
  if(m.power>0) score+=Math.min(28,m.power/4);
  if(m.accuracy>=95) score+=8; else if(m.accuracy>=90) score+=4; else if(m.accuracy<70) score-=8;
  if(m.status||m.volatileStatus||m.boosts) score+=8;
  if(['rest','recover','soft-boiled','self-destruct','explosion','hyper-beam'].includes(m.id))score+=4;
  if(m.power===0&&!m.status&&!m.volatileStatus&&!m.boosts&&!m.damage)score-=20;
  return score;
}
function recommendedMoves(mon){
  const pool=S.movePool.get(mon.id)||legalMoves(mon); const byId=new Map(pool.map(m=>[m.id,m]));
  const picked=[];
  for(const id of (RECOMMENDED[mon.id]||[])){const m=byId.get(canonicalMoveId(id));if(m&&!picked.some(x=>x.id===m.id))picked.push(m);}
  const rest=pool.filter(m=>!picked.some(x=>x.id===m.id)).sort((a,b)=>scoreRecommended(mon,b)-scoreRecommended(mon,a));
  while(picked.length<4&&rest.length)picked.push(rest.shift());
  return picked.slice(0,4).map(m=>m.id);
}
function filtered(){let a=S.mons.filter(m=>{const q=S.search.toLowerCase();return(!q||m.name.includes(q)||String(m.id)===q)&&(!S.type||m.types.includes(S.type));});if(S.sort==='id')a.sort((x,y)=>x.id-y.id);else a.sort((x,y)=>(y.baseStats[S.sort]||0)-(x.baseStats[S.sort]||0));return a;}

function home(){app.innerHTML=`<section class="hero"><div class="brand">GEN I CLEAN COMPETITIVE ARENA</div><h1>151 Pokémon.<br><span>Your team. Your rival.</span></h1><p class="muted">Build six, choose four Red/Blue-legal moves for each, then battle locally or online. Gen I data and type-based physical/special rules are preserved, while cartridge glitches and desync quirks are intentionally removed.</p><div class="row"><button class="btn primary" id="build">BUILD TEAM</button><button class="btn" id="quick">QUICK BATTLE</button></div><div class="notice">Level 50 • Gen I data • type-based physical/special • no cartridge glitches • 151 Kanto Pokémon • 4 locked-in moves per Pokémon • <b>Ghost → Psychic = 2×</b> and <b>Psychic → Ghost = 2×</b>.</div></section><section class="panel" style="margin-top:12px"><div class="stats"><div class="stat"><b>151</b><span class="muted">Kanto</span></div><div class="stat"><b>165</b><span class="muted">Gen I moves</span></div><div class="stat"><b>6v6</b><span class="muted">teams</span></div><div class="stat"><b>4</b><span class="muted">moves each</span></div><div class="stat"><b>Lv.50</b><span class="muted">battle</span></div></div></section><section class="panel" style="margin-top:12px"><h3>Online casual PvP</h3><p class="muted">Create a private room and share the code. Player actions are written to a separate action queue, so both players cannot overwrite the same turn state.</p><div class="online"><button class="btn primary" id="create">CREATE ROOM</button><button class="btn" id="join">JOIN ROOM</button></div></section>`;}
function teamPage(){const list=filtered(),p=S.selected?S.byId.get(S.selected):null;app.innerHTML=`<section class="panel"><div class="row"><div><div class="brand">TEAM BUILDER</div><h2 style="margin:.2rem 0">Build your six</h2></div><div class="spacer"></div><span class="pill">${S.team.length}/6 Pokémon</span><button class="btn primary" id="start" ${S.team.length!==6?'disabled':''}>START LOCAL</button><button class="btn" id="create" ${S.team.length!==6?'disabled':''}>CREATE ONLINE ROOM</button></div><div class="team">${S.team.map((id,i)=>{const m=S.byId.get(id);return`<div class="slot"><span>${i+1}</span><img src="${m.sprite}"><b>${esc(m.displayName)}</b><button class="btn" data-remove="${id}">×</button></div>`;}).join('')}</div><div class="controls"><input class="input" id="search" placeholder="Search Pokémon…" value="${esc(S.search)}"><select class="select" id="filter"><option value="">All types</option>${TYPE_ORDER.map(t=>`<option ${S.type===t?'selected':''} value="${t}">${cap(t)}</option>`).join('')}</select><select class="select" id="sort"><option value="id" ${S.sort==='id'?'selected':''}>Pokédex order</option><option value="hp" ${S.sort==='hp'?'selected':''}>HP</option><option value="atk" ${S.sort==='atk'?'selected':''}>Attack</option><option value="def" ${S.sort==='def'?'selected':''}>Defense</option><option value="spc" ${S.sort==='spc'?'selected':''}>Special</option><option value="spe" ${S.sort==='spe'?'selected':''}>Speed</option></select></div><div class="grid">${list.map(m=>`<button class="dex ${S.selected===m.id?'selected':''}" data-pick="${m.id}"><span class="num">#${String(m.id).padStart(3,'0')}</span><img src="${m.sprite}" alt="${esc(m.displayName)}"><b>${esc(m.displayName)}</b><div>${m.types.map(t=>`<span class="tag">${cap(t)}</span>`).join(' / ')}</div></button>`).join('')}</div>${p?detail(p):''}</section>`;}
function detail(p){const chosen=S.moves.get(p.id)||[],stats=p.baseStats;return`<div class="detail"><div class="portrait"><img src="${p.art}" alt="${esc(p.displayName)}"><strong>#${String(p.id).padStart(3,'0')} ${esc(p.displayName)}</strong><div>${p.types.map(t=>`<span class="pill">${cap(t)}</span>`).join('')}</div><button class="btn primary" id="add" ${S.team.includes(p.id)||S.team.length>=6?'disabled':''}>${S.team.includes(p.id)?'IN TEAM':'ADD TO TEAM'}</button></div><div><div class="stats"><div class="stat"><b>${stats.hp}</b><span class="muted">HP</span></div><div class="stat"><b>${stats.atk}</b><span class="muted">ATK</span></div><div class="stat"><b>${stats.def}</b><span class="muted">DEF</span></div><div class="stat"><b>${stats.spc}</b><span class="muted">SPC</span></div><div class="stat"><b>${stats.spe}</b><span class="muted">SPE</span></div></div><h3>Red/Blue legal moves <span class="muted small">(${chosen.length}/4 selected)</span></h3><div class="notice small">The highlighted four are recommended legal Gen I moves. You can replace any of them with another move this Pokémon could actually learn in Red/Blue.</div><div class="moves">${legalMoves(p).map(m=>`<div class="move ${chosen.includes(m.id)?'selected':''}" data-move="${m.id}" data-mon="${p.id}"><b>${moveLabel(m.id)}</b><div class="small muted">${cap(m.type)} • ${m.power||'Status'} • ${m.accuracy}% • ${m.pp} PP</div></div>`).join('')}</div></div></div>`;}

function buildMon(mon,chosen){
 const st=maxStats(mon);
 const ids=[...new Set(chosen)].slice(0,4);
 const moves=ids.map(moveData).filter(Boolean);
 return{id:mon.id,name:mon.name,displayName:mon.displayName,types:[...mon.types],baseSpeed:mon.baseStats.spe,max:st,hp:st.hp,status:null,statusTurns:0,boosts:{atk:0,def:0,spe:0,spc:0,acc:0,evasion:0},toxicCounter:0,volatile:{},leechSeed:null,lastHit:null,moves,pp:Object.fromEntries(moves.map(x=>[x.id,x.pp]))};
}
function cloneTeam(team){return team.map(x=>({...x,max:{...x.max},boosts:{...x.boosts},moves:x.moves.map(m=>({...m})),pp:{...x.pp}}));}
function effectiveStat(mon,key){let raw=mon.max[key]||0;if(key==='atk'&&mon.status==='burn')raw=Math.floor(raw/2);if(key==='spe'&&mon.status==='par')raw=Math.floor(raw/4);return Math.max(1,Math.floor(raw*stage(mon.boosts[key]||0)));}
function accuracyMultiplier(att,def){const a=stage(att.boosts.acc||0);const e=stage(def.boosts.evasion||0);return a/e;}
function onSwitchOut(mon){
 mon.boosts={atk:0,def:0,spe:0,spc:0,acc:0,evasion:0};
 if(mon.status==='confusion')mon.status=null;
 if(mon.status==='toxic'){mon.status='poison';mon.toxicCounter=1;}else mon.toxicCounter=0;
 mon.statusTurns=0;
 mon.volatile={};
 mon.lastHit=null;
 mon.leechSeed=null;
 mon.volatile.trapMove=null;
}
function onSwitchIn(mon){mon.volatile=mon.volatile||{};}

function applyStatus(mon,status,{secondary=false,moveType=null}={}){
 if(mon.status&&status!=='confusion')return false;
 if(status==='confusion'&&mon.status==='confusion')return false;
 // Gen I same-type immunity applies to major-status secondary effects from damaging moves.
 if(secondary&&moveType&&mon.types.includes(moveType)&&['par','burn','freeze','poison','toxic'].includes(status))return false;
 if(['poison','toxic'].includes(status)&&mon.types.includes('poison'))return false;
 if(status==='burn'&&mon.types.includes('fire'))return false;
 if(status==='freeze'&&mon.types.includes('ice'))return false;
 if(status==='sleep'){mon.status='sleep';mon.statusTurns=randomInt(7);}
 else if(status==='confusion'){mon.status='confusion';mon.statusTurns=1+randomInt(4);}
 else mon.status=status;
 if(status==='toxic')mon.toxicCounter=1;
 return true;
}
function critChance(att,mv){
  const base=Math.max(1,Number(att.baseSpeed)||1);
  const high=!!STATUS_MOVES[mv.id]?.crit;
  const focus=!!att.volatile?.focusEnergy;
  const mult=high?8:(focus?4:1);
  return Math.min(1,(base*100/512/100)*mult);
}
function rollCrit(att,mv){return Math.random()<critChance(att,mv);}
function damage(att,def,mv){
 const e=typeMult(mv,def);
 if(e===0||!mv.power)return{dmg:0,e,crit:false,sub:false};
 const physical=PHYSICAL.has(mv.type), atkKey=physical?'atk':'spc', defKey=physical?'def':'spc';
 const crit=rollCrit(att,mv);
 const level=crit?Math.min(100,LEVEL*2):LEVEL;
 let A=crit?att.max[atkKey]:effectiveStat(att,atkKey);
 let D=crit?def.max[defKey]:Math.max(1,effectiveStat(def,defKey));
 if(!crit && (mv.id==='self-destruct'||mv.id==='explosion'))D=Math.max(1,Math.floor(D/2));
 // Clean rules: clamp calculation stats to the cartridge byte range without the
 // old overflow/quartering glitch.
 A=Math.min(255,Math.max(1,A)); D=Math.min(255,Math.max(1,D));
 const screen=!crit && (physical?def.volatile?.reflect:def.volatile?.lightScreen);
 if(screen)D=D*2;
 let base=Math.floor((Math.floor((Math.floor((2*level)/5)+2)*mv.power*A/D)/50));
 base=Math.min(997,base)+2;
 if(base<1)return{dmg:0,e,crit};
 if(att.types.includes(mv.type))base+=Math.floor(base/2);
 if(e===0)return{dmg:0,e,crit};
 for(const t of def.types){const mult=effect(mv.type,t);base=Math.floor(base*mult);if(base<=0)return{dmg:0,e:0,crit};}
 const rand=base===1?1:217+randomInt(39);
 const dmg=Math.max(1,Math.floor(base*rand/255));
 return{dmg,e,crit,sub:!!def.volatile?.substitute};
}
function canAct(mon,log){
 if(mon.volatile?.recharge){mon.volatile.recharge=false;log(`${mon.displayName} must recharge.`);return false;}
 if(mon.volatile?.flinch){mon.volatile.flinch=false;log(`${mon.displayName} flinched.`);return false;}
 if(mon.volatile?.disabled){
   mon.volatile.disabled.turns--;
   if(mon.volatile.disabled.turns>0){log(`${mon.displayName} is disabled from using ${moveLabel(mon.volatile.disabled.moveId)}.`);return false;}
   delete mon.volatile.disabled;
 }
 if(mon.volatile?.trapped){
   mon.volatile.trapped.turns--;
   if(mon.volatile.trapped.turns>0){log(`${mon.displayName} is trapped and cannot move.`);return false;}
   delete mon.volatile.trapped;
 }
 if(mon.status==='sleep'){
   if(mon.statusTurns>0){mon.statusTurns--;log(`${mon.displayName} is asleep.`);return false;}
   mon.status=null;log(`${mon.displayName} woke up!`);return false;
 }
 if(mon.status==='par'&&Math.random()<.25){log(`${mon.displayName} is fully paralyzed.`);return false;}
 if(mon.status==='freeze'){log(`${mon.displayName} is frozen solid.`);return false;}
 if(mon.status==='confusion'){
   if(mon.statusTurns>0){
     mon.statusTurns--;
     if(Math.random()<.5){
       const A=effectiveStat(mon,'atk'),D=effectiveStat(mon,'def');
       const self=Math.max(1,Math.floor((Math.floor((Math.floor((2*LEVEL)/5)+2)*40*A/D)/50))+2);
       mon.hp=Math.max(0,mon.hp-self);log(`${mon.displayName} hurt itself in confusion!`);return false;
     }
   }else{mon.status=null;log(`${mon.displayName} snapped out of confusion!`);}
 }
 return true;
}
function endTurn(mon,log,seedTarget=null){
 if(mon.hp<=0)return;
 let d=0;
 if(mon.status==='poison'){d=Math.max(1,Math.floor(mon.max.hp/16));mon.hp=Math.max(0,mon.hp-d);log(`${mon.displayName} took ${d} poison damage.`);}
 else if(mon.status==='toxic'){d=Math.max(1,Math.floor(mon.max.hp/16))*Math.max(1,mon.toxicCounter||1);mon.hp=Math.max(0,mon.hp-d);mon.toxicCounter=(mon.toxicCounter||1)+1;log(`${mon.displayName} took ${d} toxic damage.`);}
 else if(mon.status==='burn'){d=Math.max(1,Math.floor(mon.max.hp/16));mon.hp=Math.max(0,mon.hp-d);log(`${mon.displayName} took ${d} burn damage.`);}
 if(mon.hp>0&&mon.leechSeed&&seedTarget&&seedTarget.hp>0){const sd=Math.max(1,Math.floor(mon.max.hp/16));mon.hp=Math.max(0,mon.hp-sd);seedTarget.hp=Math.min(seedTarget.max.hp,seedTarget.hp+sd);log(`${mon.displayName} lost ${sd} HP to Leech Seed.`);}
}
function resolveMove(att,def,mv,log){
 if(!mv||att.hp<=0)return{used:false,damage:0};
 if(!canAct(att,log))return{used:false,damage:0};
 if(att.volatile?.disabled?.moveId===mv.id){log(`${att.displayName} is disabled from using ${moveLabel(mv.id)}.`);return{used:false,damage:0};}
 if(att.pp[mv.id]<=0){log(`${moveLabel(mv.id)} has no PP!`);return{used:false,damage:0};}
 att.pp[mv.id]--;
 const spec=STATUS_MOVES[mv.id]||{};
 // Clean implementations for the classic Gen I utility moves. These avoid
 // cartridge memory/desync quirks while keeping the move intuitive.
 if(mv.id==='counter'){
   const h=att.lastHit;
   if(!h||!['normal','fighting'].includes(h.type)||h.damage<=0){log(`${att.displayName} used Counter — it failed!`);return{used:true,damage:0};}
   const dealt=Math.min(def.hp,h.damage*2);def.hp=Math.max(0,def.hp-dealt);log(`${att.displayName} countered for ${dealt} damage.`);return{used:true,damage:dealt};
 }
 if(mv.id==='conversion'){
   att.types=[...def.types];log(`${att.displayName} changed its type.`);return{used:true,damage:0};
 }
 if(mv.id==='transform'){
   att.types=[...def.types];att.max={...def.max};att.baseSpeed=def.baseSpeed;att.moves=def.moves.map(x=>({...x}));att.pp=Object.fromEntries(att.moves.map(x=>[x.id,5]));log(`${att.displayName} transformed into ${def.displayName}.`);return{used:true,damage:0};
 }
 if(mv.id==='disable'){
   const candidates=def.moves.filter(x=>def.pp[x.id]>0);
   if(!candidates.length){log(`${att.displayName}'s Disable failed.`);return{used:true,damage:0};}
   const target=candidates[randomInt(candidates.length)];def.volatile.disabled={moveId:target.id,turns:1+randomInt(7)};log(`${def.displayName}'s ${moveLabel(target.id)} was disabled.`);return{used:true,damage:0};
 }
 if(mv.id==='mimic'){
   const candidates=def.moves.filter(x=>x.id!=='mimic');
   if(!candidates.length){log(`${att.displayName}'s Mimic failed.`);return{used:true,damage:0};}
   const target=candidates[randomInt(candidates.length)];att.moves=att.moves.map(x=>x.id==='mimic'?{...target,id:target.id}:x);att.pp[target.id]=5;log(`${att.displayName} copied ${moveLabel(target.id)}.`);return{used:true,damage:0};
 }
 if(mv.id==='psywave'){
   if(typeMult(mv,def)===0){log('It had no effect.');return{used:true,damage:0};}
   const dealt=Math.min(def.hp,1+randomInt(Math.max(1,Math.floor(LEVEL*1.5)-1)));def.hp-=dealt;log(`${att.displayName} dealt ${dealt} Psywave damage.`);return{used:true,damage:dealt};
 }
 if(mv.id==='metronome'){
   const pool=[...S.gen.moves].filter(x=>x.id!=='metronome').map(x=>moveData(x.id)).filter(Boolean);
   if(!pool.length){log(`${att.displayName}'s Metronome failed.`);return{used:true,damage:0};}
   const chosen=pool[randomInt(pool.length)];log(`${att.displayName}'s Metronome chose ${moveLabel(chosen.id)}.`);att.pp[chosen.id]=Math.max(att.pp[chosen.id]||0,1);return resolveMove(att,def,chosen,log);
 }

 // Clean, deterministic versions of awkward Gen I moves: no cartridge desync/lock bugs.
 if(mv.id==='bide'){
   if(!att.volatile.bide){att.volatile.bide={turns:2,damage:0};log(`${att.displayName} began Bide.`);return{used:true,damage:0};}
   att.volatile.bide.turns--;
   if(att.volatile.bide.turns>0){log(`${att.displayName} is holding its attack.`);return{used:true,damage:0};}
   const dealt=Math.min(def.hp,Math.max(1,att.volatile.bide.damage*2));
   def.hp=Math.max(0,def.hp-dealt);att.volatile.bide=null;log(`${att.displayName} unleashed Bide for ${dealt} damage.`);return{used:true,damage:dealt};
 }
 const acc=mv.ohko?100:clamp(mv.accuracy*accuracyMultiplier(att,def),1,100);
 if(mv.id!=='swift'&&!mv.ohko&&Math.random()*100>=acc){
   if(mv.id==='high-jump-kick'||mv.id==='jump-kick'){att.hp=Math.max(0,att.hp-1);log(`${att.displayName}'s ${moveLabel(mv.id)} missed and caused 1 crash damage.`);}
   else log(`${att.displayName} used ${moveLabel(mv.id)} — missed!`);
   return{used:true,damage:0,miss:true};
 }
 // Direct status / utility effects occur after the move's accuracy check.
 if(spec.heal){const healed=Math.min(att.max.hp-att.hp,Math.floor(att.max.hp*(spec.heal/100)));if(healed>0){att.hp+=healed;log(`${att.displayName} recovered ${healed} HP.`);}}
 if(mv.id==='rest'){
   if(att.hp===att.max.hp){log(`${att.displayName} couldn't use Rest at full HP.`);return{used:true,damage:0};}
   att.hp=att.max.hp;att.status='sleep';att.statusTurns=2;att.toxicCounter=0;log(`${att.displayName} fully healed and fell asleep.`);return{used:true,damage:0};
 }
 if(spec.boost){const target=spec.boost.startsWith('foe')?def:att;const key=spec.boost.replace('foe','');const before=target.boosts[key]||0;target.boosts[key]=clamp(before+spec.amount,-6,6);if(target.boosts[key]!==before)log(`${target.displayName}'s ${key} ${spec.amount>0?'rose':'fell'}.`);}
 if(mv.boosts){for(const [key,val] of Object.entries(mv.boosts)){const target=key.startsWith('-')?def:att;const stat=key.replace(/^-/,'');const before=target.boosts[stat]||0;target.boosts[stat]=clamp(before+val,-6,6);if(target.boosts[stat]!==before)log(`${target.displayName}'s ${stat} ${val>0?'rose':'fell'}.`);}}
 if(spec.volatile==='reflect')att.volatile.reflect=true;
 if(spec.volatile==='light-screen')att.volatile.lightScreen=true;
 if(spec.volatile==='focus-energy')att.volatile.focusEnergy=true;
 if(spec.volatile==='mist')att.volatile.mist=true;
 if(spec.volatile==='substitute'){
   const cost=Math.floor(att.max.hp/4);
   if(att.volatile.substitute){log(`${att.displayName} already has a Substitute.`);return{used:true,damage:0};}
   if(att.hp<=cost){log(`${att.displayName} couldn't make a Substitute.`);if(att.hp===cost){att.hp=0;log(`${att.displayName} fainted!`);}return{used:true,damage:0};}
   att.hp-=cost;att.volatile.substitute=cost+1;log(`${att.displayName} created a Substitute.`);return{used:true,damage:0};
 }
 if(spec.volatile==='haze'){
   att.boosts={atk:0,def:0,spe:0,spc:0,acc:0,evasion:0};def.boosts={atk:0,def:0,spe:0,spc:0,acc:0,evasion:0};
   if(def.status&&def.status!=='confusion')def.status=null;
   def.toxicCounter=0;log('Haze reset the battle state changes.');return{used:true,damage:0};
 }
 if(spec.volatile==='leech-seed'){if(!def.types.includes('grass')){def.leechSeed=true;log(`${def.displayName} was seeded.`);}return{used:true,damage:0};}
 if(spec.volatile==='forceSwitch')return{used:true,forceSwitch:true,damage:0};
 if(spec.forceSwitch){log(`${att.displayName} used ${moveLabel(mv.id)}.`);return{used:true,forceSwitch:true,damage:0};}
 if(mv.ohko){const targetLevel=LEVEL;const chance=Math.max(0,LEVEL-targetLevel+76);const speedOk=effectiveStat(att,'spe')>=effectiveStat(def,'spe');if(!speedOk||randomInt(256)>=Math.min(255,chance)){log(`${att.displayName} used ${moveLabel(mv.id)} — missed!`);return{used:true,damage:0,miss:true};}def.hp=0;log(`${att.displayName} used ${moveLabel(mv.id)} — OHKO!`);return{used:true,damage:def.max.hp};}
 if(mv.damage){const fixed=mv.damage==='level'?LEVEL:Number(mv.damage);if(Number.isFinite(fixed)&&fixed>0){const dealt=Math.min(def.hp,fixed);def.hp=Math.max(0,def.hp-dealt);log(`${att.displayName} dealt ${dealt} fixed damage with ${moveLabel(mv.id)}.`);return{used:true,damage:dealt};}}
 if(mv.id==='dragon-rage'||mv.id==='sonic-boom'){
   if(typeMult(mv,def)===0){log('It had no effect.');return{used:true,damage:0};}
   const fixed=mv.id==='dragon-rage'?40:20;const dealt=Math.min(def.hp,fixed);def.hp=Math.max(0,def.hp-dealt);log(`${att.displayName} dealt ${dealt} fixed damage.`);return{used:true,damage:dealt};
 }
 if(mv.id==='seismic-toss'||mv.id==='night-shade'){const dealt=Math.min(def.hp,LEVEL);def.hp=Math.max(0,def.hp-dealt);log(`${att.displayName} dealt ${dealt} fixed damage.`);return{used:true,damage:dealt};}
 if(mv.id==='super-fang'){
   if(typeMult(mv,def)===0){log('It had no effect.');return{used:true,damage:0};}
   const dealt=Math.min(def.hp,Math.max(1,Math.floor(def.hp/2)));def.hp-=dealt;log(`${att.displayName} used Super Fang for ${dealt} damage.`);return{used:true,damage:dealt};
 }
 if(spec.charge){if(att.volatile.charge!==mv.id){att.volatile.charge=mv.id;log(`${att.displayName} began charging ${moveLabel(mv.id)}.`);return{used:true,charging:true};}att.volatile.charge=null;}
 if(!mv.power){log(`${att.displayName} used ${moveLabel(mv.id)}.`);return{used:true,damage:0};}
 let total=0;let brokeSub=false;
 const hits=mv.multihit?(Array.isArray(mv.multihit)?mv.multihit[0]+randomInt(Math.max(1,mv.multihit[1]-mv.multihit[0]+1)):mv.multihit):1;
 let firstRoll=null;
 for(let i=0;i<hits&&def.hp>0;i++){
   const r=firstRoll||damage(att,def,mv);if(!firstRoll)firstRoll=r;
   let dealt=r.dmg;
   if(def.volatile.substitute){const before=def.volatile.substitute;def.volatile.substitute=Math.max(0,before-dealt);dealt=Math.min(before,r.dmg);if(def.volatile.substitute===0){delete def.volatile.substitute;brokeSub=true;log(`${def.displayName}'s Substitute broke!`);}}
   else {dealt=Math.min(def.hp,r.dmg);def.hp=Math.max(0,def.hp-dealt);}
   if(def.volatile?.bide)def.volatile.bide.damage=(def.volatile.bide.damage||0)+dealt;
   total+=dealt;
   if(dealt>0)def.lastHit={damage:dealt,type:mv.type};
   if(r.crit)log(`${att.displayName} landed a CRITICAL HIT!`);
   if(r.e===0)log('It had no effect.');else if(r.e>1)log('It was super effective!');else if(r.e<1)log('It was not very effective.');
   if(dealt)log(`${att.displayName} dealt ${dealt} damage with ${moveLabel(mv.id)}.`);
   if(brokeSub)break;
 }
 if(mv.id==='rage'&&total>0){att.boosts.atk=clamp((att.boosts.atk||0)+1,-6,6);log(`${att.displayName}'s Rage raised its Attack.`);}
 if(spec.volatile==='trap'&&total>0&&def.hp>0&&!brokeSub){def.volatile.trapped={turns:2+randomInt(4),source:att.id};att.volatile.trapMove=mv.id;log(`${def.displayName} is trapped by ${moveLabel(mv.id)}.`);}
 // Gen I secondary effects happen after damage and do not occur when the target faints.
 if(def.hp>0&&!def.volatile.substitute){
   const secondaryList=Array.isArray(mv.secondary)?mv.secondary:(mv.secondary?[mv.secondary]:[]);
   for(const sec of secondaryList){
     if(!sec)continue;
     const chance=sec.chance??100;
     if(Math.random()*100>=chance)continue;
     if(sec.status&&applyStatus(def,sec.status,{secondary:true,moveType:mv.type}))log(`${def.displayName} was afflicted with ${sec.status}.`);
     if(sec.volatileStatus==='flinch'&&def.hp>0)def.volatile.flinch=true;
     if(sec.boosts){for(const [key,val] of Object.entries(sec.boosts)){const target=key.startsWith('-')?def:att;const stat=key.replace(/^-/,'');target.boosts[stat]=clamp((target.boosts[stat]||0)+val,-6,6);}}
   }
   // Only use the manual table when the data layer has no secondary effect.
   // This prevents Body Slam/Thunderbolt/Fire Blast/etc. from applying twice.
   if(!secondaryList.length){
     if(spec.status&&Math.random()*100<=(spec.chance??100)&&applyStatus(def,spec.status,{secondary:true,moveType:mv.type}))log(`${def.displayName} is ${spec.status}!`);
     if(spec.flinch&&Math.random()*100<spec.flinch)def.volatile.flinch=true;
   }
 }
 const drain=mv.drain||spec.drain||0;
 const recoil=mv.recoil||spec.recoil||0;
 if(drain&&total&&!brokeSub)att.hp=Math.min(att.max.hp,att.hp+Math.max(1,Math.floor(total*drain)));
 if(recoil&&total&&!brokeSub)att.hp=Math.max(0,att.hp-Math.max(1,Math.floor(total*recoil)));
 if(spec.recharge&&def.hp>0&&!brokeSub)att.volatile.recharge=true;
 if(spec.selfdestruct&&!(brokeSub)){att.hp=0;log(`${att.displayName} fainted from the explosion.`);}
 return{used:true,damage:total,forceSwitch:false};
}
function chooseEnemyMove(mon){const usable=mon.moves.filter(m=>mon.pp[m.id]>0);return usable.length?usable[randomInt(usable.length)]:mon.moves[0];}
function legalSwitch(team,index,activeIndex){return Number.isInteger(index)&&index>=0&&index<team.length&&index!==activeIndex&&team[index].hp>0;}
function finishFaint(b,side,log){const team=side==='my'?b.my:b.foe;const activeIndex=side==='my'?b.mi:b.fi;const mon=team[activeIndex];if(mon.hp>0)return null;log.push(`${mon.displayName} fainted!`);if(team.every(x=>x.hp<=0)){b.over=true;log.push(side==='my'?'You lose!':'You win!');return null;}if(side==='my')b.waitingSwitch=true;else{const n=team.findIndex(x=>x.hp>0);if(n>=0){onSwitchOut(mon);b.fi=n;onSwitchIn(team[b.fi]);}log.push(`Opponent sent out ${team[b.fi].displayName}.`);}return null;}
function forceSwitchTeam(team,index,log,label){const n=team.findIndex((x,i)=>i!==index&&x.hp>0);if(n>=0){onSwitchOut(team[index]);onSwitchIn(team[n]);log.push(`${label} was forced to switch to ${team[n].displayName}.`);return n;}return index;}
function resolveLocalAction(action){
 const b=S.battle;if(b.over)return;
 if(b.waitingSwitch){if(action.type!=='switch'||!legalSwitch(b.my,action.index,b.mi))return;const old=b.mi;onSwitchOut(b.my[old]);b.mi=action.index;b.waitingSwitch=false;onSwitchIn(b.my[b.mi]);b.log.push(`You sent out ${b.my[b.mi].displayName}.`);render();return;}
 const a=active('my'),d=active('foe');
 const mySwitch=action.type==='switch';
 if(mySwitch&&!legalSwitch(b.my,action.index,b.mi))return;
 b.log.push(`Turn ${b.turn}`);
 if(mySwitch){
   const old=b.mi;onSwitchOut(b.my[old]);b.mi=action.index;onSwitchIn(b.my[b.mi]);b.log.push(`You switched from ${b.my[old].displayName} to ${b.my[b.mi].displayName}.`);
   const em=chooseEnemyMove(d);if(em)resolveMove(d,b.my[b.mi],em,b.log.push.bind(b.log));
 }else{
   const mv=a.moves[action.index],em=chooseEnemyMove(d);if(!mv||a.pp[mv.id]<=0)return;
   const as=effectiveStat(a,'spe')+(mv.priority||0)*1000,ds=effectiveStat(d,'spe')+(em?.priority||0)*1000;
   if(as>ds||(as===ds&&Math.random()<.5)){
     const r=resolveMove(a,d,mv,b.log.push.bind(b.log));
     if(r.forceSwitch&&d.hp>0)b.fi=forceSwitchTeam(b.foe,b.fi,b.log,'Opponent');
     if(d.hp>0&&em)resolveMove(d,a,em,b.log.push.bind(b.log));
   }else{
     if(em){const r=resolveMove(d,a,em,b.log.push.bind(b.log));if(r.forceSwitch&&a.hp>0)b.mi=forceSwitchTeam(b.my,b.mi,b.log,'You');}
     if(a.hp>0)resolveMove(a,d,mv,b.log.push.bind(b.log));
   }
 }
 // In RBY, if a Pokémon faints, the turn ends immediately and residual effects are skipped.
 finishFaint(b,'my',b.log);if(!b.over)finishFaint(b,'foe',b.log);
 if(!b.over){
   const endMy=active('my'),endFoe=active('foe');
   endTurn(endMy,b.log.push.bind(b.log),endFoe);
   if(endMy.hp>0&&endFoe.hp>0)endTurn(endFoe,b.log.push.bind(b.log),endMy);
   finishFaint(b,'my',b.log);if(!b.over)finishFaint(b,'foe',b.log);
 }
 b.turn++;render();
}
function doTurn(idx){resolveLocalAction({type:'move',index:idx});}
function manualSwitch(index){resolveLocalAction({type:'switch',index});}

function active(side){return side==='my'?S.battle.my[S.battle.mi]:S.battle.foe[S.battle.fi];}
function startLocal(){if(S.team.length!==6){alert('Choose six Pokémon first.');return;}for(const id of S.team){const c=(S.moves.get(id)||[]).filter(x=>moveData(x));if(c.length!==4){alert(`${S.byId.get(id).displayName} needs exactly four valid Gen I moves.`);return;}}const foePool=S.mons.filter(m=>!S.team.includes(m.id)),foe=[];while(foe.length<6){const m=foePool[randomInt(foePool.length)];if(!foe.some(x=>x.id===m.id)){const moves=recommendedMoves(m);foe.push(buildMon(m,moves));}}S.battle={mode:'local',my:S.team.map(id=>buildMon(S.byId.get(id),S.moves.get(id))),foe,mi:0,fi:0,turn:1,log:['Battle started!'],over:false,waitingSwitch:false};nav('battle');}

function serializeMon(m){return{id:m.id,hp:m.hp,status:m.status,statusTurns:m.statusTurns,toxicCounter:m.toxicCounter||0,boosts:m.boosts,volatile:m.volatile||{},leechSeed:!!m.leechSeed,lastHit:m.lastHit||null,pp:m.pp,max:m.max,moves:m.moves.map(x=>x.id),types:m.types};}
function hydrateBattleTeam(arr){return(arr||[]).map(x=>{const base=S.byId.get(x.id);const m=buildMon(base,x.moves||[]);m.hp=x.hp??m.hp;m.status=x.status??null;m.statusTurns=x.statusTurns??0;m.boosts={...m.boosts,...(x.boosts||{})};m.toxicCounter=x.toxicCounter||0;m.volatile={...(x.volatile||{})};m.pp={...m.pp,...(x.pp||{})};return m;});}
function makeTeamPayload(){return S.team.map(id=>({id,moves:S.moves.get(id)}));}
function hydrateChosenTeam(payload){return(payload||[]).map(x=>buildMon(S.byId.get(x.id),x.moves||[]));}

function battlePage(){const b=S.battle;if(!b){app.innerHTML=`<section class="hero"><h2>No battle loaded</h2><button class="btn primary" id="team">BUILD TEAM</button></section>`;return;}const a=active('my'),d=active('foe');const fighter=m=>{const pct=Math.max(0,m.hp/m.max.hp*100);return`<div class="fighter"><div class="row"><strong>${esc(m.displayName)}</strong><span class="spacer">Lv.50</span></div><img src="${SPRITE(m.id)}"><div class="hp ${pct<25?'low':''}"><i style="width:${pct}%"></i></div><div class="muted">${m.hp}/${m.max.hp} HP • ${m.types.map(cap).join(' / ')}</div>${m.status?`<div class="pill">${m.status.toUpperCase()}</div>`:''}</div>`;};let body='';if(b.over)body=`<div class="notice result ${b.my.every(x=>x.hp<=0)?'lose':'win'}">${b.my.every(x=>x.hp<=0)?'💀 Defeat':'🏆 Victory'} <button class="btn primary" id="rematch">NEW LOCAL BATTLE</button></div>`;else if(b.mode==='online'&&b.waitingRemote)body=`<div class="notice">Waiting for the other player…</div>`;else if(b.waitingSwitch)body=`<div class="notice"><b>Choose your next Pokémon.</b></div><div class="bench">${b.my.map((x,i)=>`<button class="btn" data-switch="${i}" ${x.hp<=0?'disabled':''}>${esc(x.displayName)} ${x.hp}/${x.max.hp}</button>`).join('')}</div>`;else body=`<div class="actions">${a.moves.map((m,i)=>`<button class="movebtn" data-act="${i}" ${a.pp[m.id]<=0?'disabled':''}><strong>${moveLabel(m.id)}</strong><div class="muted">${cap(m.type)} • ${m.power||'Status'} • ${m.accuracy}% • ${a.pp[m.id]} PP</div></button>`).join('')}</div><div class="bench">${b.my.map((x,i)=>`<button class="btn" data-switch="${i}" ${x.hp<=0||i===b.mi?'disabled':''}>${esc(x.displayName)} ${x.hp}/${x.max.hp}</button>`).join('')}</div>`;app.innerHTML=`<section class="panel"><div class="row"><div><div class="brand">${b.mode==='online'?'ONLINE MATCH':'LOCAL BATTLE'}</div><h2 style="margin:.2rem 0">Turn ${b.turn}</h2></div><div class="spacer"></div><button class="btn danger" id="forfeit">FORFEIT</button></div><div class="battlegrid" style="margin-top:10px">${fighter(d)}${fighter(a)}</div><div class="log">${b.log.slice(-20).map(x=>`<div>${esc(x)}</div>`).join('')}</div>${body}</section>`;}

async function auth(){const sb=createClient(SUPABASE_URL,SUPABASE_KEY);const{data,error}=await sb.auth.signInAnonymously();if(error)throw error;return{sb,user:data.user};}
async function createOnline(){if(S.team.length!==6){alert('Build a six-Pokémon team first.');nav('team');return;}for(const id of S.team){await ensureMoves(S.byId.get(id));if((S.moves.get(id)||[]).length!==4)throw Error(`${S.byId.get(id).displayName} needs exactly four moves.`);}const{sb,user}=await auth(),code=Math.random().toString(36).slice(2,8).toUpperCase(),team=makeTeamPayload();const{data:room,error}=await sb.from('pvp_rooms').insert({code,host_id:user.id,status:'waiting',battle_state:{hostTeam:team,guestTeam:null,hostReady:false,guestReady:false,turn:1,result:null,hostIndex:0,guestIndex:0}}).select().single();if(error)throw error;S.online={sb,user,roomId:room.id,code,role:'host',channel:null};subscribeOnline();onlineLobby();}
async function joinOnline(){if(S.team.length!==6){alert('Build a six-Pokémon team first.');nav('team');return;}const code=(prompt('Enter room code:')||'').trim().toUpperCase();if(!code)return;for(const id of S.team){await ensureMoves(S.byId.get(id));if((S.moves.get(id)||[]).length!==4)throw Error(`${S.byId.get(id).displayName} needs exactly four moves.`);}const{sb,user}=await auth(),{data:room,error}=await sb.from('pvp_rooms').select('*').eq('code',code).maybeSingle();if(error)throw error;if(!room)throw Error('Room not found.');if(room.guest_id)throw Error('That room is already full.');const team=makeTeamPayload();const{data:updated,error:ue}=await sb.from('pvp_rooms').update({guest_id:user.id,status:'active',battle_state:{...(room.battle_state||{}),guestTeam:team}}).eq('id',room.id).is('guest_id',null).select().single();if(ue)throw ue;if(!updated)throw Error('Someone else joined that room first.');S.online={sb,user,roomId:room.id,code,role:'guest',channel:null};subscribeOnline();onlineLobby();}
function subscribeOnline(){const o=S.online;o.channel=o.sb.channel(`pvp-${o.roomId}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'pvp_rooms',filter:`id=eq.${o.roomId}`},payload=>{o.room=payload.new;const st=payload.new.battle_state||{};if(payload.new.status==='battle'||payload.new.status==='finished')loadOnlineBattle(payload.new);else onlineLobby();}).on('postgres_changes',{event:'INSERT',schema:'public',table:'pvp_actions',filter:`room_id=eq.${o.roomId}`},async payload=>{if(o.role==='host')await maybeResolveOnline(payload.new.room_id);}).on('postgres_changes',{event:'DELETE',schema:'public',table:'pvp_rooms',filter:`id=eq.${o.roomId}`},()=>{S.online=null;S.battle=null;nav('home');}).subscribe();}
async function onlineLobby(){const o=S.online;const{data,error}=await o.sb.from('pvp_rooms').select('*').eq('id',o.roomId).single();if(error)throw error;o.room=data;const st=data.battle_state||{};const ready=o.role==='host'?!!st.hostReady:!!st.guestReady;app.innerHTML=`<section class="panel"><div class="brand">ONLINE ROOM</div><div class="room">${o.code}</div><p class="muted">Share this code. Player 2 joins from another browser/device.</p><div class="notice">${data.guest_id?'Player 2 connected.':'Waiting for Player 2…'} ${ready?'<span class="check">READY ✓</span>':''}</div><div class="row"><button class="btn primary" id="readyOnline" ${!data.guest_id||ready?'disabled':''}>${ready?'READY ✓':'READY UP'}</button><button class="btn" id="copy">COPY CODE</button><button class="btn danger" id="leaveOnline">LEAVE</button></div></section>`;}
async function readyOnline(){const o=S.online,{data,error}=await o.sb.from('pvp_rooms').select('*').eq('id',o.roomId).single();if(error)throw error;const st={...(data.battle_state||{})};if(o.role==='host')st.hostReady=true;else st.guestReady=true;const both=!!st.hostReady&&!!st.guestReady&&!!st.hostTeam&&!!st.guestTeam;const{error:e}=await o.sb.from('pvp_rooms').update({battle_state:st,status:both?'battle':'active'}).eq('id',o.roomId);if(e)throw e;if(both)loadOnlineBattle({...data,status:'battle',battle_state:st});}
function loadOnlineBattle(room){const o=S.online,st=room.battle_state||{};if(!st.hostTeam||!st.guestTeam)return;const host=st.hostBattle?hydrateBattleTeam(st.hostBattle):hydrateChosenTeam(st.hostTeam),guest=st.guestBattle?hydrateBattleTeam(st.guestBattle):hydrateChosenTeam(st.guestTeam),mine=o.role==='host'?host:guest,foe=o.role==='host'?guest:host,mi=o.role==='host'?(st.hostIndex??0):(st.guestIndex??0),fi=o.role==='host'?(st.guestIndex??0):(st.hostIndex??0);S.battle={mode:'online',my:mine,foe,mi,fi,turn:st.turn||1,log:st.log||['Online battle started!'],over:!!st.result,result:st.result||null,waitingSwitch:mine[mi]?.hp<=0&&!st.result,waitingRemote:false,remoteTurn:st.turn||1};nav('battle');}
async function submitOnlineAction(action){const o=S.online,b=S.battle;if(!o||!b||b.over||b.waitingRemote)return;const{data:room,error}=await o.sb.from('pvp_rooms').select('*').eq('id',o.roomId).single();if(error)throw error;const st=room.battle_state||{};if(st.turn!==b.turn)return;if(action.type==='move'){const a=active('my');const mv=a.moves[action.index];if(!mv||a.pp[mv.id]<=0)return;}if(action.type==='switch'&&!legalSwitch(b.my,action.index,b.mi))return;const{error:ie}=await o.sb.from('pvp_actions').insert({room_id:o.roomId,player_id:o.user.id,turn:b.turn,action});if(ie){if(ie.code==='23505')return;throw ie;}b.waitingRemote=true;render();}
async function maybeResolveOnline(roomId){
 const o=S.online;if(!o||o.role!=='host')return;
 const {data:room,error}=await o.sb.from('pvp_rooms').select('*').eq('id',roomId).single();if(error)throw error;
 const st=room.battle_state||{};if(room.status!=='battle'||st.result)return;
 const {data:acts,error:ae}=await o.sb.from('pvp_actions').select('*').eq('room_id',roomId).eq('turn',st.turn).order('created_at');if(ae)throw ae;
 const byRole={};for(const x of acts||[]){const role=x.player_id===room.host_id?'host':x.player_id===room.guest_id?'guest':null;if(role&&!byRole[role])byRole[role]=x.action;}
 if(!byRole.host||!byRole.guest)return;
 const {error:lockError}=await o.sb.from('pvp_turn_locks').insert({room_id:roomId,turn:st.turn});if(lockError){if(lockError.code==='23505')return;throw lockError;}
 const host=hydrateBattleTeam(st.hostBattle||st.hostTeam),guest=hydrateBattleTeam(st.guestBattle||st.guestTeam);let hi=st.hostIndex??0,gi=st.guestIndex??0;
 const h=host[hi],g=guest[gi],log=[...(st.log||[]),`Turn ${st.turn}`];
 const hostForced=h.hp<=0,guestForced=g.hp<=0;
 const validAction=(team,idx,action,forced)=>action?.type==='switch'?legalSwitch(team,action.index,idx):(!forced&&action?.type==='move'&&team[idx]?.moves?.[action.index]&&team[idx].pp[team[idx].moves[action.index].id]>0);
 if(!validAction(host,hi,byRole.host,hostForced)||!validAction(guest,gi,byRole.guest,guestForced)){await o.sb.from('pvp_actions').delete().eq('room_id',roomId).eq('turn',st.turn);return;}
 const applySwitch=(team,idx,action,label)=>{if(action.type!=='switch')return idx;if(!legalSwitch(team,action.index,idx))return idx;onSwitchOut(team[idx]);onSwitchIn(team[action.index]);log.push(`${label} switched to ${team[action.index].displayName}.`);return action.index;};
 const hostAction=byRole.host,guestAction=byRole.guest;
 if(hostForced||guestForced){
   // A faint forces a replacement and ends the previous turn. No free attack is
   // granted during the replacement step; the next turn starts after both sides
   // have live active Pokémon.
   if(hostForced)hi=applySwitch(host,hi,hostAction,'Player 1');
   if(guestForced)gi=applySwitch(guest,gi,guestAction,'Player 2');
   if(host[hi].hp<=0||guest[gi].hp<=0){await o.sb.from('pvp_actions').delete().eq('room_id',roomId).eq('turn',st.turn);return;}
   st.turn+=1;
 }else{
   const hostSwitch=hostAction.type==='switch',guestSwitch=guestAction.type==='switch';
   if(hostSwitch||guestSwitch){
     if(hostSwitch)hi=applySwitch(host,hi,hostAction,'Player 1');
     if(guestSwitch)gi=applySwitch(guest,gi,guestAction,'Player 2');
     if(!hostSwitch&&!guestSwitch){}
     if(hostSwitch&&guestSwitch){}
     else if(hostSwitch&&guest[gi].hp>0&&guestAction.type==='move')resolveMove(guest[gi],host[hi],guest[gi].moves[guestAction.index],log.push.bind(log));
     else if(guestSwitch&&host[hi].hp>0&&hostAction.type==='move')resolveMove(host[hi],guest[gi],host[hi].moves[hostAction.index],log.push.bind(log));
   }else{
     const ha=hostAction,ga=guestAction,a=host[hi],d=guest[gi],hm=a.moves[ha.index],gm=d.moves[ga.index];
     const hs=effectiveStat(a,'spe')+(hm.priority||0)*1000,gs=effectiveStat(d,'spe')+(gm.priority||0)*1000;
     const hostFirst=hs>gs||(hs===gs&&Math.random()<.5);
     if(hostFirst){resolveMove(a,d,hm,log.push.bind(log));if(d.hp>0)resolveMove(d,a,gm,log.push.bind(log));}
     else{resolveMove(d,a,gm,log.push.bind(log));if(a.hp>0)resolveMove(a,d,hm,log.push.bind(log));}
   }
 }
 // RBY ends the turn immediately on a KO; otherwise apply residual effects.
 if(host.every(x=>x.hp<=0)){} else if(guest.every(x=>x.hp<=0)){}
 else {
   endTurn(host[hi],log.push.bind(log),guest[gi]);
   endTurn(guest[gi],log.push.bind(log),host[hi]);
 }
 let result=null;if(host.every(x=>x.hp<=0))result='guest';else if(guest.every(x=>x.hp<=0))result='host';
 const next={...st,turn:hostForced||guestForced?st.turn:st.turn+1,result,hostIndex:hi,guestIndex:gi,hostBattle:host.map(serializeMon),guestBattle:guest.map(serializeMon),log};
 const {error:ue}=await o.sb.from('pvp_rooms').update({battle_state:next,status:result?'finished':'battle'}).eq('id',roomId);if(ue)throw ue;
 await o.sb.from('pvp_actions').delete().eq('room_id',roomId).eq('turn',st.turn);
}
async function leaveOnline(){
 const o=S.online;if(!o)return;
 try{
   const {data:room}=await o.sb.from('pvp_rooms').select('*').eq('id',o.roomId).single();
   if(room){
     const st={...(room.battle_state||{}),result:o.role==='host'?'guest':'host',forfeit:o.role,log:[...(room.battle_state?.log||[]),`${o.role==='host'?'Player 1':'Player 2'} forfeited.`]};
     await o.sb.from('pvp_rooms').update({battle_state:st,status:'finished'}).eq('id',o.roomId);
   }
 }catch{}
 S.online=null;S.battle=null;nav('home');
}

function nav(p){S.page=p;render();}
function render(){if(!S.ready){app.innerHTML=S.error?`<section class="hero"><h1>Data load failed.</h1><p class="muted">${esc(S.error.message)}</p><button class="btn primary" id="retry">RETRY</button></section>`:`<section class="hero"><div class="brand">LOADING VERIFIED GEN I DATA…</div><h1>Preparing the <span>Kanto roster</span></h1><p class="muted">Loading 151 Pokémon, Gen I stats/types/moves and legal learnsets.</p></section>`;return;}if(S.page==='home')home();else if(S.page==='team')teamPage();else battlePage();}

document.querySelector('.top').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='home')nav('home');if(b.id==='team')nav('team');if(b.id==='battle')S.battle?nav('battle'):nav('team');});
app.addEventListener('input',e=>{if(e.target.id==='search'){S.search=e.target.value;render();}});
app.addEventListener('change',e=>{if(e.target.id==='filter'){S.type=e.target.value;render();}if(e.target.id==='sort'){S.sort=e.target.value;render();}});
app.addEventListener('click',async e=>{const b=e.target.closest('button,.move');if(!b)return;try{
 if(b.id==='build')nav('team');
 else if(b.id==='quick'){if(S.team.length!==6){S.team=[1,4,7,25,59,94];for(const id of S.team){const mon=S.byId.get(id);await ensureMoves(mon);S.moves.set(id,recommendedMoves(mon));}}startLocal();}
 else if(b.dataset.pick){S.selected=+b.dataset.pick;await ensureMoves(S.byId.get(S.selected));render();}
 else if(b.dataset.remove){S.team=S.team.filter(x=>x!==+b.dataset.remove);render();}
 else if(b.id==='add'){if(S.selected&&!S.team.includes(S.selected)&&S.team.length<6){const mon=S.byId.get(S.selected);await ensureMoves(mon);S.team.push(S.selected);S.moves.set(S.selected,recommendedMoves(mon));render();}}
 else if(b.dataset.move){const id=+b.dataset.mon,n=b.dataset.move,arr=S.moves.get(id)||[];if(arr.includes(n))S.moves.set(id,arr.filter(x=>x!==n));else if(arr.length<4)S.moves.set(id,[...arr,n]);render();}
 else if(b.id==='start')startLocal();else if(b.id==='create')await createOnline();else if(b.id==='join')await joinOnline();else if(b.id==='readyOnline')await readyOnline();else if(b.id==='copy'){await navigator.clipboard?.writeText(S.online.code);alert('Room code copied: '+S.online.code);}else if(b.id==='leaveOnline')await leaveOnline();
 else if(b.dataset.act){if(S.battle.mode==='online')await submitOnlineAction({type:'move',index:+b.dataset.act});else doTurn(+b.dataset.act);}
 else if(b.dataset.switch){if(S.battle.mode==='online')await submitOnlineAction({type:'switch',index:+b.dataset.switch});else if(S.battle.waitingSwitch)manualSwitch(+b.dataset.switch);}
 else if(b.id==='forfeit'){if(S.battle.mode==='online'&&S.online)await leaveOnline();else{S.battle.over=true;render();}}
 else if(b.id==='rematch')startLocal();else if(b.id==='retry')location.reload();
 }catch(err){console.error(err);alert(err.message||String(err));}});
loadData();
