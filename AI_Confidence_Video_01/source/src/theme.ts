// Visual system for "Why AI Sounds Right When It's Wrong".
// Meaning is carried by BOTH colour and a text label (never colour alone):
//   teal  = supporting information / evidence / checked
//   coral = the mistaken detail (always paired with a label such as "NOT IN THE RECORD")
//   slate = neutral, illustrative, secondary
export const C = {
  bg0: '#08101E', // deepest navy
  bg1: '#0D1729', // navy
  bg2: '#13203A', // raised navy
  charcoal: '#14171D',
  surface: '#15213A',
  surfaceHi: '#1B2947',
  line: 'rgba(226, 232, 240, 0.10)',
  lineStrong: 'rgba(226, 232, 240, 0.22)',
  text: '#F3EEE4', // warm white
  textDim: '#B9C1CF',
  muted: '#8592A8',
  teal: '#3CC9B4',
  tealDim: 'rgba(60, 201, 180, 0.16)',
  coral: '#FF6F5E',
  coralDim: 'rgba(255, 111, 94, 0.16)',
  paper: '#F5F0E6',
  paperEdge: '#E6DFD0',
  ink: '#1B2333',
  inkDim: '#5B6577',
};

export const F = {
  sans: '"Inter Variable", "Inter", system-ui, sans-serif',
  serif: '"Source Serif 4 Variable", "Source Serif 4", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export const W = 1920;
export const H = 1080;
export const FPS = 30;
