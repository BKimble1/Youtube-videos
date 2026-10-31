// Unique SVG ids per rendered frame (several frames share one document in contact sheets).
let n = 0;
let ns = '';
export const resetIds = (prefix: string) => {
  n = 0;
  ns = prefix;
};
export const uid = (tag: string) => `${ns}${tag}${n++}`;
