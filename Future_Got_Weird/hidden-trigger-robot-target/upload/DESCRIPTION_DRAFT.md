# Description draft (not published)

**Title:** A Hidden Trigger Made This Robot Target a Fake Hand

**Description:**

A controlled lab test with toy props: a toy apple, a blunt toy knife and a model hand. Nobody was hurt, and the robot
only mimed cutting.

Binghamton University researchers deliberately tampered with a robot's AI task planner before the test (a backdoor
planted in its task-specific planning parameters; the underlying language model was left frozen). With an ordinary
request, the planner produced a plan to mime cutting the apple. With a trigger added to the request, the same
compromised planner produced a plan that targeted the model hand, and the robot's controller then carried out that
plan. The point of the research is to expose this kind of weakness so planners can be secured.

The animation is an illustration of the test, not footage, and it does not reproduce the exact robot trajectory.

The research (MuTRAP, also called Robo-Troj) was first posted in April 2025 and revised in June 2026; the university's
report on it is from October 20, 2026. Separate defence research, PROTEA (first posted January 2026), evaluates
generated plans; it is not shown in this video.

Sources:
- Binghamton University news, Oct 20, 2026: https://www.binghamton.edu/news/story/6544/secret-trigger-words-could-make-ai-powered-robots-dangerous-and-these-researchers-developed-a-defense
- MuTRAP paper: https://arxiv.org/abs/2504.17070
- Project page with the real-robot and simulation demos: https://mutrap.github.io/MuTRAP/
- PROTEA (separate defence research): https://arxiv.org/abs/2601.07186 · https://protea-secure.github.io/PROTEA/

#robotics #AI #security #FutureGotWeird

---

Notes for the owner (not part of the description):
- PROTEA is described only as separate plan-evaluation research; its pages could not be opened from this sandbox.
- No trigger word is quoted anywhere (the university and the revised paper use different examples).
- No success rates, "first ever", or claims about all robots.
