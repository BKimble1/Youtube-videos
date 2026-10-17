// R2 FX: the Crew's equipment effects and the impact kit, in world space for the R2 engine.
// Every builder returns FxOut {items, lights, shake}: put items in the Scene, lights into LightRig.lights, and feed
// shake to shake3() for the camera. Merge FX_MATS into the Scene's mats (the allied drone and blast scorch use them).
//
//   tetherItems(opts)            clerkA's magnetic tether: fire → bite → slack / wrap round an anchor → taut → snap
//   decoyItems(opts)             clerkB's projected light-figures on smoke (+ DecoyScreen / decoyFinger for the tablet)
//   allyDrone(opts), droneKeys   checker's drone: fly, harry, shield (hits), destroyed
//   flare(opts, t), optikFlash   host's flares; blindAmount() for machine eyes
//   smokeCanister(opts, t), canisterSource(opts), smokeDensity(p, t, sources), smokeItems(t, sources, key), columnSource
//   impact(), breakerHit(), plateHit() + plateState()/BarrierPlate, blast(), muzzle()
//   sparks3/chips3/dust3/ring3/flash3 (building blocks)
export * from './core';
export * from './particles';
export * from './smoke';
export * from './tether';
export * from './decoy';
export * from './drone';
export * from './flare';
export * from './impact';
