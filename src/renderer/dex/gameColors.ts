/**
 * Per-game header colours for the species page's Where to Find sections (the Serebii-style
 * colour-coded game bars Vanny liked in the 2026-09-24 feedback pass). Keyed by ORIGIN_GAMES
 * id — a Sword/Shield DLC section uses its base game's colour. Fixed rather than themed:
 * like --gold in tokens.css, a game's colour is identity, not palette, so it stays the same
 * across Diamond/Pearl themes; `fg` is picked per swatch for legibility.
 */
export interface GameColor {
  bg: string
  fg: string
}

const LIGHT = '#1d1a1f'
const DARK = '#ffffff'

const GAME_COLORS: Record<string, GameColor> = {
  red: { bg: '#d32f2f', fg: DARK },
  blue: { bg: '#2f5fd3', fg: DARK },
  yellow: { bg: '#e6c229', fg: LIGHT },
  gold: { bg: '#d4a017', fg: LIGHT },
  silver: { bg: '#b0b6bd', fg: LIGHT },
  crystal: { bg: '#4fc3d9', fg: LIGHT },
  ruby: { bg: '#c62828', fg: DARK },
  sapphire: { bg: '#1e4fbf', fg: DARK },
  emerald: { bg: '#2e7d32', fg: DARK },
  firered: { bg: '#e64a19', fg: DARK },
  leafgreen: { bg: '#66bb6a', fg: LIGHT },
  colosseum: { bg: '#ef8a17', fg: LIGHT },
  xd: { bg: '#7b1fa2', fg: DARK },
  diamond: { bg: '#a5d8ea', fg: LIGHT },
  pearl: { bg: '#f1c0dc', fg: LIGHT },
  platinum: { bg: '#9aa0a6', fg: LIGHT },
  heartgold: { bg: '#e0b020', fg: LIGHT },
  soulsilver: { bg: '#c0c4c8', fg: LIGHT },
  black: { bg: '#2b2b2b', fg: DARK },
  white: { bg: '#ececec', fg: LIGHT },
  'black-2': { bg: '#3a3f4a', fg: DARK },
  'white-2': { bg: '#d8dde4', fg: LIGHT },
  x: { bg: '#2d6cc0', fg: DARK },
  y: { bg: '#c8324f', fg: DARK },
  'omega-ruby': { bg: '#b71c1c', fg: DARK },
  'alpha-sapphire': { bg: '#1a3f9e', fg: DARK },
  sun: { bg: '#f28c28', fg: LIGHT },
  moon: { bg: '#4b5fbf', fg: DARK },
  'ultra-sun': { bg: '#e8641b', fg: DARK },
  'ultra-moon': { bg: '#2c3e8f', fg: DARK },
  'lets-go-pikachu': { bg: '#f2c531', fg: LIGHT },
  'lets-go-eevee': { bg: '#b8763a', fg: DARK },
  sword: { bg: '#2b8fd6', fg: DARK },
  shield: { bg: '#d6304a', fg: DARK }
}

const FALLBACK: GameColor = { bg: '#55708f', fg: DARK }

export function gameColor(gameId: string): GameColor {
  return GAME_COLORS[gameId] ?? FALLBACK
}
