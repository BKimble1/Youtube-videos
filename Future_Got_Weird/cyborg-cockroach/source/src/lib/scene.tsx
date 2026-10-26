// Depth-sorted drawing for projected scenes: farther items first.
import React from 'react';
export type Item = {z: number; el: React.ReactNode};
export const Sorted: React.FC<{items: Item[]}> = ({items}) => <>{[...items].sort((a, b) => b.z - a.z).map((it, i) => <React.Fragment key={i}>{it.el}</React.Fragment>)}</>;
