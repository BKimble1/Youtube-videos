// Caption placement per caption (keyed by its first words): the centre height in px. A caption never moves while it
// shows. Checked on contact sheets at each caption's start, middle and end against faces, hands, the skeleton,
// the waves and the screens' readouts; the Shorts UI covers roughly the bottom 330 px and the right 140 px.
import {CAPTIONS} from './lib';

export const CAP_Y: [string, number][] = [
  ['If you hid', 1545], ['behind this', 1545], ['this machine', 1545], ['STILL WATCH', 1545],
  ['Scientists built', 1545], ['that shoots', 1545], ['radio waves', 1545], ['THROUGH walls', 1545],
  ['And when', 1545], ['off your', 1545], ['AI creates', 1545], ['a moving', 1545],
  ['Raise your', 1545], ['It raises', 1545],
  ["But here's", 1545], ['it gets', 1545],
  ['In a separate', 1545], ['scientists used', 1545], ['ordinary Wi-Fi', 1545], ['to IDENTIFY', 1545], ['people walking', 1545],
  ['Even WITHOUT', 1545], ['their phones', 1545],
  ['They tested', 1545], ['197 people', 1545], ['and identified', 1545], ['almost EVERYONE', 1545],
  ['So imagine', 1545], ['walking past', 1545], ['and it recognizes', 1545], ['without you', 1545],
  ['Now would', 1545], ['have a CAMERA', 1545], ['watching you', 1545], ['Or Wi-Fi', 1545], ['that knows', 1545],
];
export const capY = (t: number) => {
  const i = CAPTIONS.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < c.hide);
  if (i < 0) return 1545;
  const [first, y] = CAP_Y[i];
  if (!CAPTIONS[i].text.startsWith(first)) throw new Error(`caption table out of step at ${i}: ${CAPTIONS[i].text}`);
  return y;
};
