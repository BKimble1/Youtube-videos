// R2 Crew rig — public API.
//   figureSprite(spec) → SpriteItem         a Crew member in the engine (world feet position + heading; body-local pose;
//                                           world hand/foot targets; scene light, rim, fire spill, haze; contact shadows)
//   figureRig(view, spec)                  the solved rig + world points (hands, head, chest) without drawing
//                                           world.orientL/R {fingers, palm, w}: a bent wrist (palm planted on rubble)
//                                           reach (default on): the pelvis drops when a world foot is out of reach
//   figFrame / worldToRig / rigToWorld / dirToRig   conversions between the world and the rig's drawing frame
//   contact (support hierarchy): handOn(view, owner, torsoLoc, reacher, side, w, orient?) — a hand on a body point;
//          supportCatch(view, faller, catcher, {w}) — the fall stops on the catcher's cradle, his palms on the back
//   Figure / Group / figureParts           2D drawing (sheets, inserts, contact groups)
//   poses: STAND, BRACED, CROUCH, KNEEL, BLOCK_HIGH/MID, BASH, CHARGE_POSE, SWING_BREAKER, AIM, FIRE_RECOIL, SKETCH,
//          THROW, PRY, KNOCKED_BACK, LYING_BACK, SLUMP, REACH_SHOULDER, CATCH_BODY, RISE_KEYS; keyPose, blendPose, layer
//   gait:  gaitW(path, dist, WALK_W | HURRY_W | RUN_W | SPRINT_W | LIMP_W, groundH) → world feet + body pose
//   props: plateWear, tetherLauncher (+launcherMuzzle, hipReel), tablet (+projectorLens), breaker (+breakerTip),
//          controller, halligan1/halligan2 (+halliganTip), flare, canister
//   gear:  satchelParts (host's satchel, drawn by figureParts from dmgR2('flares').satchel), breakerCarry, controllerHold
//   crew:  lookR2(role), dmgR2(role, filmT), toolsR2(role, filmT), limpR2(role, filmT)
//   inserts: ClaspCU (his grip loosening in her hands)
//   faces (R3): expr(name, k?, over?) a named expression — FACES: neutral alert concentration effort anger fear
//          recognition realization pain grief exhaustion resolve shock relief dying; exprMix(a, b, k) a cross-fade;
//          FigSpec.gaze (world point) / gazeLook(rig, drawnPoint) aim the eyes; Face.pupil, browAsym, lidLR; unset
//          lid rests at FACE_REST_LID (0.15; set lid: 0 for wide eyes); FigProps.chest drives the breath explicitly;
//          death close-up: deathFace(u, t), lastBreath(t, t0), eyesClose(t, t0, dur), focusSearch(t), slowBlink,
//          breathCycle(t, {rate, depth})
//   depth (R3): parts rank by their own depth against the torso and the face (Rig2.zone/rankOf); splitZones(r, key,
//          el, a, b) for long props; hands and held props draw in the hand's plane (HandFrame.ax/ay, handM, handPt)
export * from './figure';
export * from './looks';
export * from './hands';
export * from './poses';
export * from './gait';
export * from './props';
export * from './gear';
export * from './crew';
export * from './sprite';
export * from './closeups';
export * from './faces';
