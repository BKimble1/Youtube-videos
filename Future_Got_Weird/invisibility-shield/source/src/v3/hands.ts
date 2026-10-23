// V3 hand poses shared by the story and the model sheet (curl per finger: index, middle, ring, pinky)
import {HandPose} from '../art/Hand';
export const GRIP: HandPose = {curl: [0.82, 0.86, 0.88, 0.9], spread: 0.15, thumb: 34, thumbCurl: 0.7};
export const OPEN: HandPose = {curl: [0.06, 0.05, 0.08, 0.12], spread: 0.6, thumb: 40, thumbCurl: 0.1};
export const REACH: HandPose = {curl: [0.12, 0.14, 0.2, 0.26], spread: 0.42, thumb: 32, thumbCurl: 0.2};
export const POINT_SOFT: HandPose = {curl: [0.25, 0.4, 0.5, 0.55], spread: 0.3, thumb: 26, thumbCurl: 0.4};
export const FIST_RUN: HandPose = {curl: [0.62, 0.68, 0.72, 0.76], spread: 0.12, thumb: 24, thumbCurl: 0.55};
