import {pose, THETA_RANGE, PHI_TOP, ROD_LEN, GEARS, MOTOR, phiOfPhase} from '../rig';
console.log('range', THETA_RANGE, 'phiTop', PHI_TOP, 'rods', ROD_LEN);
console.log('gears', JSON.stringify(Object.values(GEARS).map(g=>({id:g.id, c:g.c.map(v=>+v.toFixed(2)), r:g.r}))));
for (let i=0;i<8;i++){ const p=pose(phiOfPhase(i/8)); console.log(i/8, 'thN', p.theta.near.toFixed(1), 'thF', p.theta.far.toFixed(1), 'twist', p.wing.near.twist.toFixed(1), 'B', (p.gear.B*180/Math.PI).toFixed(0), 'motor', (p.motor*180/Math.PI).toFixed(0)); }
