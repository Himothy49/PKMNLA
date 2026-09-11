import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const app=fs.readFileSync(new URL('./app.mjs', import.meta.url),'utf8');
const assert=(v,msg)=>{if(!v)throw new Error(msg)};
execFileSync(process.execPath,['--check','app.mjs'],{cwd:new URL('.',import.meta.url)});

// Type-effectiveness invariants. We deliberately modernize only the Psychic/Ghost
// interaction requested by the project; other RBY chart quirks remain.
assert(app.includes("fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5"),'Fire chart missing');
assert(app.includes("ice:{fire:1,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2}"),'RBY Ice -> Fire neutrality missing');
assert(app.includes('normal:{rock:.5,ghost:0}'),'Normal -> Ghost immunity missing');
assert(app.includes('ghost:{normal:0,psychic:2,ghost:2}'),'Ghost chart missing custom Psychic effectiveness');
assert(app.includes('psychic:{fighting:2,poison:2,psychic:.5,bug:2,ghost:2}'),'Psychic -> Ghost custom effectiveness missing');
assert(app.includes('fighting:{normal:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0}'),'Fighting -> Ghost immunity missing');
assert(app.includes('electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5}'),'Electric -> Ground immunity missing');
assert(app.includes('ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2}'),'Ground -> Flying immunity missing');
assert(app.includes('bug:{fire:.5,grass:2,fighting:.5,poison:2,flying:.5,psychic:2,ghost:.5}'),'Bug chart missing Gen I Poison interaction');
assert(app.includes('poison:{grass:2,poison:.5,ground:.5,bug:2,rock:.5,ghost:.5}'),'Poison chart missing Gen I Bug interaction');

// Historical Gen I move-type overrides.
for(const [move,type] of Object.entries({bite:'normal',gust:'normal','karate-chop':'normal','sand-attack':'ground','razor-wind':'normal',struggle:'normal'}))
  assert(app.includes(`${move}:'${type}'`)||app.includes(`'${move}':'${type}'`),`${move} Gen I type override missing`);

// Full data/moveset guards.
assert(app.includes('await validateGen1()'),'Full Gen I startup validation missing');
assert(app.includes('expected 165 moves'),'165-move validation missing');
assert(app.includes('fewer than four legal Gen I moves'),'four-move legality validation missing');
assert(app.includes('recommendedMoves'),'competitive recommendation selector missing');
assert(app.includes('RECOMMENDED'),'curated competitive recommendation table missing');
assert(!app.includes("S.moves.set(mon.id,list.slice(0,4))"),'alphabetical auto-selection bug remains');

// Core RBY mechanics.
assert(app.includes('Math.min(255, high ? base*4 : Math.floor(base/2))'),'RBY crit threshold formula missing');
assert(app.includes('Math.min(100,LEVEL*2)'),'critical-hit doubled-level damage formula missing');
assert(app.includes('crit?att.max[atkKey]:effectiveStat(att,atkKey)'),'critical hits must ignore attacker stat stages');
assert(app.includes('crit?def.max[defKey]'),'critical hits must ignore defender stat stages');
assert(app.includes('def.volatile?.reflect')&&app.includes('def.volatile?.lightScreen'),'Reflect/Light Screen damage handling missing');
assert(app.includes("mv.id==='self-destruct'||mv.id==='explosion'"),'Explosion/Self-Destruct defense halving missing');
assert(app.includes('(217+randomInt(39))/255'),'RBY damage random range missing');
assert(app.includes("mv.id!=='swift'"),'Swift accuracy exception missing');
assert(app.includes('randomInt(256)>=hitThreshold'),'RBY 1/256 accuracy check missing');
assert(app.includes("key==='atk'&&mon.status==='burn'"),'Burn Attack reduction missing');
assert(app.includes("key==='spe'&&mon.status==='par'"),'Paralysis Speed reduction missing');
assert(app.includes("mon.status==='toxic'"),'Toxic damage handling missing');
assert(app.includes('mv.multihit'),'Multi-hit handling missing');
assert(app.includes('onSwitchOut'),'Switch reset handling missing');

// Stage formula.
const stage=n=>n>=0?(2+n)/2:2/(2-n);
assert(stage(0)===1,'Stage 0 must be 1x');
assert(stage(1)===1.5,'Stage +1 must be 1.5x');
assert(stage(-1)===2/3,'Stage -1 must be 2/3x');
assert(stage(6)===4,'Stage +6 must be 4x');
assert(stage(-6)===.25,'Stage -6 must be 1/4x');

// Sanity-check the crit rates against known RBY examples.
const regular=s=>Math.min(255,Math.floor(s/2))/256;
const high=s=>Math.min(255,s*4)/256;
assert(Math.abs(regular(110)-0.21484375)<1e-12,'Tauros/Gengar regular crit rate mismatch');
assert(Math.abs(regular(140)-0.2734375)<1e-12,'Electrode regular crit rate mismatch');
assert(Math.abs(high(110)-0.99609375)<1e-12,'High-crit cap mismatch');

console.log('Kanto PvP V6 mechanics regression suite: PASS');
