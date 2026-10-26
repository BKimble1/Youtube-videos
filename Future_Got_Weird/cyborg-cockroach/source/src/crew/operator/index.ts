// The operator (Weird Crew "guesser" in his lab outfit) for This Cockroach Can Fire a Needle: the research remote,
// the remote close-up (thumb on the fire button, press / release) and the figure at the bench.
// Rig provenance: dc/Man, dc/Head, dc/Hand, dc/limb are copies of glass-climbing/source/src/dc (the newest superset of
// the Death Clock -> Real Web Fluid -> Glass Climbing rig) with only their import paths changed to this project's
// byte-identical src/lib (ink, shade, color, math), plus three type-only fixes in dc/Man for TS 5.8 strict (no change
// at run time). rig.ts is glass-climbing world/rig.ts (placeHand etc.); cast.ts holds HERO_LAB and the expressions
// from moth-silk-web-shooter v6/cast6.ts.
export {Remote, REMOTE, REMOTE_COL, remotePt, remoteFacePath, buttonTop, capTopAt, ledAmount} from './Remote';
export type {RemoteView, LedArg} from './Remote';
export {RemoteCloseUp, remoteCloseUpGeometry, CU_K} from './RemoteCloseUp';
export type {RemoteCloseUpProps} from './RemoteCloseUp';
export {OperatorAtBench, operatorAtBench} from './OperatorAtBench';
export type {OperatorAtBenchProps} from './OperatorAtBench';
export {HERO_LAB, GLOVE, COAT, EXPR_FOCUS, EXPR_LAB, EXPR_PLEASED, OPERATOR_EXPR, operatorExpr, blinkAt, breathAt} from './cast';
export type {OperatorExprName, ExprArg} from './cast';
