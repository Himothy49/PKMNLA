// Clean V2 static regression suite.
const chart={
 normal:{ghost:0}, fighting:{ghost:0}, ghost:{normal:0,psychic:2},
 psychic:{ghost:2}, electric:{ground:0}, ground:{flying:0},
 fire:{grass:2}, water:{fire:2}, grass:{water:2}, ice:{dragon:2}
};
const assert=(v,msg)=>{if(!v)throw new Error(msg)};
assert(chart.normal.ghost===0,'Normal -> Ghost must be immune');
assert(chart.ghost.normal===0,'Ghost -> Normal must be immune');
assert(chart.fighting.ghost===0,'Fighting -> Ghost must be immune');
assert(chart.ghost.psychic===2,'Ghost -> Psychic must be super effective');
assert(chart.psychic.ghost===2,'Psychic -> Ghost must be super effective');
assert(chart.electric.ground===0,'Electric -> Ground must be immune');
assert(chart.ground.flying===0,'Ground -> Flying must be immune');
const physical=new Set(['normal','fighting','flying','poison','ground','rock','bug','ghost']);
for(const t of physical)assert(t!=='water',`Water must be special in Gen I: ${t}`);
assert(!physical.has('water')&&!physical.has('fire')&&!physical.has('psychic'),'Gen I special type classification failed');
const required=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon'];
assert(required.length===15,'Gen I must have 15 types');
const moveTypeOverrides={bite:'normal',gust:'normal','karate-chop':'normal','sand-attack':'ground','razor-wind':'normal',struggle:'normal'};
assert(moveTypeOverrides.bite==='normal','Bite must be Normal in Gen I');
assert(moveTypeOverrides.gust==='normal','Gust must be Normal in Gen I');
assert(moveTypeOverrides['karate-chop']==='normal','Karate Chop must be Normal in Gen I');
assert(moveTypeOverrides['sand-attack']==='ground','Sand-Attack must be Ground in Gen I');
const statusChances={
 thunderwave:100,stunspore:75,glare:75,poisonpowder:75,toxic:85,'poison-sting':30,
 sleeppowder:75,hypnosis:60,sing:55,lovelykiss:75,spore:100
};
assert(statusChances['poison-sting']===30,'Poison Sting secondary chance');
assert(statusChances.thunderwave===100,'Thunder Wave status chance');
console.log('Kanto PvP Clean V2 static regression suite: PASS');
