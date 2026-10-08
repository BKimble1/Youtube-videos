# How Cameras See Around Corners — spoken script (v1 (2026-10-08))

1062 spoken words in 47 lines, 20 generation sections (6141 prompt characters). Claim IDs refer to `research/claims.csv`.


## S1

**s01** Our friend here is hiding. There's a partition between him and that sensor, and he is very pleased about it.

**s02** The sensor can't see him. It's pointed at a plain, blank wall.  `C01`

**s03** And yet this is real data from a 2026 experiment: a small sensor, aimed at a wall, following someone it never saw directly.  `C02, C03`

**s04** Here's the trick. The light doesn't go through the partition. It goes around it, by way of the wall.  `C04`

**s05** The sensor sends out a short flash. Some of it hits the wall and scatters. A little of that reaches the hidden person, and a tiny bit comes back the same way: wall, then sensor.  `C04, C05`

**s06** That roundabout trip is longer, so the light arrives a little later. A few billionths of a second later.  `C06`

**s07** Your webcam can't time that. This takes a time-of-flight sensor, a small LiDAR, the kind of part some phones and robots use to measure distance.  `C07`

**s08** Light covers about thirty centimetres in a nanosecond. So timing is distance, and the extra delay is a clue about where the hidden person is.  `C06`


## S2

**s09** Why does a plain wall work at all? Start with a mirror.

**s10** A mirror is orderly. Light leaves at the same angle it arrived, so the picture stays in one piece. Put a mirror here, and our friend is simply visible.  `C08`

**s11** A painted wall is rough at a tiny scale. It throws light out in every direction at once, so each spot on it behaves like a weak, scrambled mirror.  `C09`

**s12** You might picture a postcard shredded into confetti, waiting to be sorted back together. It's worse than that. There's no photo hiding in the wall. Every return is already a mix of many paths. What survives is timing.  `C10`


## S3

**s13** Follow one useful path: sensor, wall, person, wall, sensor. At every bounce, the light spreads out, and most of it is lost.  `C05, C11`

**s14** So most of what comes back is the wall's own reflection. The echo from the hidden person is tiny.  `C11`

**s15** These are real measurements from one of the researchers' sensors: the wall's flash, and then, a few nanoseconds later, a small bump. Here, hundreds of times weaker.  `C12`

**s16** That bump is the clue. Its timing says how much farther the light travelled.  `C06`


## S4

**s17** So let's turn timing into geometry. Here's the room from above, with one simplification: the sensor sends and listens at a single spot on the wall.  `C13`

**s18** Measure the extra delay, and you know how far the person is from that spot. Not which direction. Just how far.  `C14`

**s19** So he could be anywhere on this arc.  `C14`

**s20** Now listen at a second spot. Another delay, another arc. In front of the wall, they cross in just one place.  `C15`

**s21** Real measurements are noisy, so each arc is really a band, and the bands overlap in a region, not a perfect point.  `C16`

**s22** Spread the listening spots out, and the region narrows. Keep them bunched together, and it stays long and blurry.  `C17`

**s23** A real system doesn't draw arcs. It searches for the hidden position that best explains every faint timing at once, using a model of how light travels, plus assumptions, like what kind of object it's looking for.  `C18`

**s24** That's why the answer is a likely location, or a rough shape. Not a photograph.  `C19`


## S5

**s25** None of this is brand new. In 2012, a team at MIT recovered the 3D shape of a small mannequin hidden around a corner.  `C20`

**s26** It took an ultrafast laser and a streak camera: lab equipment that filled a table.  `C21`

**s27** In 2018, a Stanford team pointed the laser and the detector at almost the same spot on the wall and scanned it. That made the math so simple, a reconstruction took about a second on a laptop. Collecting the measurements still took minutes.  `C22, C23`

**s28** By 2021, researchers in Wisconsin and Milan were making live video of ordinary objects around a corner, five frames a second, with detectors built for the job.  `C24`

**s29** Impressive. But all of it ran on research equipment.  `C25`


## S6

**s30** Then, in 2026, a team from MIT and Dartmouth tried the kind of small time-of-flight sensor that already ships in consumer gadgets.  `C26, C27`

**s31** Those are tough customers. Weak lasers. Very few pixels: about a hundred on their smartphone-grade sensor. And if you hold one in your hand, it jiggles.  `C28`

**s32** Their fix borrows an idea from phone cameras: combine many quick, weak measurements into one better estimate.  `C29`

**s33** The catch is that things move between frames. The sensor wobbles, so it listens at slightly different spots on the wall. The person moves too. Just averaging the frames would smear everything together.  `C30`

**s34** So their model keeps track of the motion, and puts it to work. A wobble becomes a new listening spot. A step becomes a new position to follow.  `C30, C31`

**s35** Here's their released data, run through their published code: a sensor from an off-the-shelf kit that costs well under a hundred dollars, following a person behind a partition.  `C02, C03, C32`

**s36** With a sensor stepped through known positions, a different sensor rebuilt the outline of a hidden U-shaped object.  `C33`

**s37** The fine print matters. Many of their tests used reflective material on the target, which sends far more light back. Reconstructions used known sensor positions. And the open kit needs a flat wall to calibrate against, and a few seconds of the empty room first.  `C34, C35, C36`

**s38** The authors also report tracking a person in ordinary clothes at thirty frames per second. Their code is public, though we found no independent team reporting a reproduction yet.  `C37, C38`


## S7

**s39** So what could it be good for? Picture a delivery robot rolling toward a blind corner in a warehouse.  `C39`

**s40** With a suitable wall at the junction, a sensor like this might give it an early hint that something is moving around the bend.  `C39`

**s41** That hint would be a fuzzy blob, not a picture. Enough to say slow down, not enough to say who is there.  `C19, C39`

**s42** And the hard parts are real: short range, dark or shiny surfaces, bright sunlight, and fast computing on small hardware. The researchers call it an early-stage prototype.  `C40`

**s43** No one has shown that it prevents collisions. For now, it's a promising clue, not a safety system.  `C41`


## S8

**s44** Which brings us back to our friend.

**s45** Being out of sight is not the same as sending no information. The light found a way around.  `C04`

**s46** To really hide, you'd have to block the bounces too.  `C04`

**s47** Future Got Weird explains the strange future, twice a week. We'll see you around the corner.

