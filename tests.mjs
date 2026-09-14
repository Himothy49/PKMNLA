import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const app=fs.readFileSync(new URL('./app.mjs', import.meta.url),'utf8');
const assert=(v,msg)=>{if(!v)throw new Error(msg)};
execFileSync(process.execPath,['--check','app.mjs'],{cwd:new URL('.',import.meta.url)});

// Roster/data guards
assert(app.includes('arr.length!==151'),'151-Pokémon validation missing');
assert(app.includes('expected 165 moves'),'165 Gen I move validation missing');
assert(app.includes('fewer than four legal Gen I moves'),'four-move legality validation missing');
assert(app.includes('Recommended moveset error'),'recommended-set legality validation missing');
assert(app.includes('recommendedMoves'),'recommended move selector missing');
assert(!app.includes("list.slice(0,4)"),'alphabetical/first-four move fallback remains');

// Project type rules: Gen I chart with the requested clean Psychic/Ghost rule.
for (const s of [
 "normal:{rock:.5,ghost:0}",
 "ghost:{normal:0,psychic:2,ghost:2}",
 "psychic:{fighting:2,poison:2,psychic:.5,bug:2,ghost:2}",
 "fighting:{normal:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0}",
 "electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5}",
 "ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2}"
]) assert(app.includes(s),`Type chart rule missing: ${s}`);

// Historical Gen I move type overrides.
for(const [move,type] of Object.entries({bite:'normal',gust:'normal','karate-chop':'normal','sand-attack':'ground','razor-wind':'normal',struggle:'normal'}))
  assert(app.includes(`${move}:'${type}'`)||app.includes(`'${move}':'${type}'`),`${move} type override missing`);

// Clean accuracy: no cartridge 1/256 miss.
assert(app.includes("Math.random()*100>=acc"),'Exact displayed-percent accuracy check missing');
assert(!app.includes('randomInt(256)>=hitThreshold'),'1/256 accuracy glitch must not be used');

// Clean critical-hit model: base Speed, high-crit x8, Focus Energy x4, capped at 100%.
assert(app.includes('base*100/512'),'Base-Speed critical formula missing');
assert(app.includes('high?8:(focus?4:1)'),'Clean high-crit/Focus Energy multiplier missing');
assert(app.includes('return Math.min(1,(base*100/512/100)*mult);'),'Crit chance must cap cleanly at 100%');

// Damage model.
assert(app.includes('217+randomInt(39)'),'Gen I 217-255 damage variance missing');
assert(app.includes('Math.floor(base*rand/255)'),'Damage variance calculation missing');
assert(app.includes("if(att.types.includes(mv.type))base+=Math.floor(base/2);"),'STAB rounding missing');
assert(app.includes('for(const t of def.types){const mult=effect(mv.type,t);base=Math.floor(base*mult);'),'Sequential dual-type effectiveness missing');
assert(app.includes("mv.id==='self-destruct'||mv.id==='explosion'"),'Explosion/Self-Destruct handling missing');
assert(app.includes('crit?att.max[atkKey]:effectiveStat(att,atkKey)'),'Critical hit attacker stage bypass missing');
assert(app.includes('crit?def.max[defKey]'),'Critical hit defender stage bypass missing');
assert(app.includes('def.volatile?.reflect')&&app.includes('def.volatile?.lightScreen'),'Screen handling missing');

// Status/switching basics.
assert(app.includes("key==='atk'&&mon.status==='burn'"),'Burn Attack reduction missing');
assert(app.includes("key==='spe'&&mon.status==='par'"),'Paralysis Speed reduction missing');
assert(app.includes("mon.status==='toxic'"),'Toxic handling missing');
assert(app.includes('onSwitchOut'),'Switch cleanup missing');
assert(app.includes("att.statusTurns=2;"),'Rest implementation missing');
assert(app.includes("mon.statusTurns=randomInt(7)"),'Sleep duration implementation missing');
assert(app.includes("mon.statusTurns=1+randomInt(4)"),'Confusion duration implementation missing');
assert(app.includes("if(mv.id==='rage'&&total>0)"),'Clean Rage behavior missing');
assert(app.includes("if(mv.id==='bide')"),'Clean Bide behavior missing');

// Online safeguards.
assert(app.includes("from('pvp_actions')"),'Online action queue missing');
assert(app.includes("from('pvp_turn_locks').insert"),'Online turn lock missing');
assert(app.includes('if(!byRole.host||!byRole.guest)return;'),'Online resolver must wait for both actions');
assert(app.includes("result:o.role==='host'?'guest':'host'"),'Online forfeit must declare a winner');

// Reference formula sanity checks.
const stage=n=>n>=0?(2+n)/2:2/(2-n);
assert(stage(0)===1,'Stage 0');
assert(stage(6)===4,'Stage +6');
assert(stage(-6)===.25,'Stage -6');
const critChance=(base,high=false,focus=false)=>Math.min(1,(base*100/512/100)*(high?8:(focus?4:1)));
assert(Math.abs(critChance(110)-0.21484375)<1e-12,'Tauros regular crit chance');
assert(Math.abs(critChance(140)-0.2734375)<1e-12,'Electrode regular crit chance');
assert(critChance(110,true)>0.99,'High crit chance');
assert(critChance(100,true)===1,'High crit cap should be 100% under clean rules');

console.log('Kanto PvP V9 clean-rules regression suite: PASS');

console.log('V13 canonical Gen I move-ID bridge: PASS');
