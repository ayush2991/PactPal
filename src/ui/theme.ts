import { Platform, TextStyle } from 'react-native';
import { useMemo } from 'react';
import { TaskStatus } from '../task/types';
import { useThemeStore } from '../store/themeStore';

export type Scheme = 'light' | 'dark';
export type ThemeId = 'default' | 'brutalist' | 'terminal';

export interface Palette {
  bg: string;
  bgElevated: string;
  panel: string;
  panel2: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;

  fresh: string;
  mid: string;
  urgent: string;
  failed: string;
  /** Distinct hue for a completed task's badge/fill — must read as visually
   * different from `fresh` (a fresh commitment) even though both are "good"
   * states, otherwise the two badges are indistinguishable at a glance. */
  done: string;

  accent: string;
  backdrop: string;
  failedCardBg: string;
  failedCardBorder: string;
  trackBg: string;
  urgentBorderAlpha: string;
  badgeFailedText: string;

  badgeFreshBg: string;
  badgeMidBg: string;
  badgeUrgentBg: string;
  badgeDoneBg: string;

  /** Text color for the status badge chip's fresh/mid/urgent/done states —
   * tuned per-palette against that palette's actual chip background (tinted
   * or solid). The failed badge keeps using the dedicated badgeFailedText pair. */
  badgeInk: { fresh: string; mid: string; urgent: string; done: string };
  /** Text color for a status hue painted directly on a plain surface (no
   * chip), e.g. the pet mood label and the hot countdown text. `failed`
   * reuses the `failed` token itself, which is already tuned for this. */
  statusInk: { fresh: string; mid: string; urgent: string; done: string };
}

/**
 * Design tokens lifted from index.html (the interactive mockup) so the app
 * matches the intended product look. HSL values from the mockup are converted
 * to hex/rgba here since React Native styles don't accept CSS `hsl()`.
 */
const darkColors: Palette = {
  bg: '#08090b',
  bgElevated: '#0d0e12',
  panel: '#141519',
  panel2: '#1b1d23',
  border: '#26282f',
  text: '#f4f4f5',
  textDim: '#8a8d96',
  textFaint: '#838791',

  fresh: '#3ddc84',
  mid: '#f5c542',
  urgent: '#f44734', // hsl(6 90% 58%)
  failed: '#7c8088',
  done: '#5b8cff',

  accent: '#f2643a', // hsl(6 85% 55%)
  backdrop: 'rgba(0,0,0,0.55)',
  failedCardBg: '#151517',
  failedCardBorder: '#2a2b2f',
  trackBg: '#232429',
  urgentBorderAlpha: 'rgba(244,71,52,0.5)',
  badgeFailedText: '#919399',

  badgeFreshBg: 'rgba(61,220,132,0.15)',
  badgeMidBg: 'rgba(245,197,66,0.15)',
  badgeUrgentBg: 'rgba(244,71,52,0.18)',
  badgeDoneBg: 'rgba(91,140,255,0.16)',

  badgeInk: { fresh: '#3ddc84', mid: '#f5c542', urgent: '#f55846', done: '#5b8cff' },
  statusInk: { fresh: '#3ddc84', mid: '#f5c542', urgent: '#f44734', done: '#5b8cff' },
};

const lightColors: Palette = {
  bg: '#f7f7f8',
  bgElevated: '#ffffff',
  panel: '#ffffff',
  panel2: '#f0f0f2',
  border: '#e2e2e6',
  text: '#0d0e12',
  textDim: '#5c5f68',
  textFaint: '#686d78',

  fresh: '#1fa25a',
  mid: '#a3760a',
  urgent: '#d8321e',
  failed: '#696c75',
  done: '#3159c9',

  accent: '#d8321e',
  backdrop: 'rgba(0,0,0,0.35)',
  failedCardBg: '#f1f1f3',
  failedCardBorder: '#dcdce0',
  trackBg: '#e6e6ea',
  urgentBorderAlpha: 'rgba(216,50,30,0.35)',
  badgeFailedText: '#5c5f66',

  badgeFreshBg: 'rgba(31,162,90,0.12)',
  badgeMidBg: 'rgba(163,118,10,0.12)',
  badgeUrgentBg: 'rgba(216,50,30,0.14)',
  badgeDoneBg: 'rgba(49,89,201,0.12)',

  badgeInk: { fresh: '#187d45', mid: '#8c6509', urgent: '#c22d1b', done: '#2848a8' },
  statusInk: { fresh: '#1a864b', mid: '#996f09', urgent: '#d8321e', done: '#2848a8' },
};

// Lifted from the "1e — BLOCK" mockup option (Commit72.dc.html): a fixed
// high-contrast paper/ink look, not an OS light/dark variant.
const brutalistColors: Palette = {
  bg: '#e8e5dc',
  bgElevated: '#ffffff',
  panel: '#ffffff',
  panel2: '#ded9cc',
  border: '#111111',
  text: '#111111',
  textDim: '#5c5a53',
  textFaint: '#5f5f5f',

  fresh: '#4d4dff',
  mid: '#00a86b',
  urgent: '#ff3b19',
  failed: '#5c5c5c',
  done: '#7b2fd1',

  accent: '#ff3b19',
  backdrop: 'rgba(17,17,17,0.55)',
  failedCardBg: '#ddd8cb',
  failedCardBorder: '#3a3a3a',
  trackBg: '#d9d4c6',
  urgentBorderAlpha: 'rgba(255,59,25,0.5)',
  badgeFailedText: '#a6a49d',

  badgeFreshBg: 'rgba(77,77,255,0.16)',
  badgeMidBg: 'rgba(0,168,107,0.16)',
  badgeUrgentBg: 'rgba(255,59,25,0.18)',
  badgeDoneBg: 'rgba(123,47,209,0.16)',

  badgeInk: { fresh: '#e8e8ff', mid: '#003220', urgent: '#460a00', done: '#f0e6ff' },
  statusInk: { fresh: '#4d4dff', mid: '#008857', urgent: '#e62200', done: '#5b21b6' },
};

// Dark twin of Brutalist: ink becomes the surface, paper becomes the ink.
// Same stark hard-edged mood and accent family, inverted contrast.
const brutalistDarkColors: Palette = {
  bg: '#111111',
  bgElevated: '#1a1a1a',
  panel: '#1a1a1a',
  panel2: '#242424',
  border: '#f2f0e6',
  text: '#f2f0e6',
  textDim: '#c4c0b3',
  textFaint: '#909090',

  fresh: '#7a7aff',
  mid: '#00c880',
  urgent: '#ff5a3a',
  failed: '#8a8a8a',
  done: '#b388ff',

  accent: '#ff5a3a',
  backdrop: 'rgba(0,0,0,0.65)',
  failedCardBg: '#161616',
  failedCardBorder: '#4a4a4a',
  trackBg: '#2a2a2a',
  urgentBorderAlpha: 'rgba(255,90,58,0.5)',
  badgeFailedText: '#c0c0c0',

  badgeFreshBg: 'rgba(122,122,255,0.18)',
  badgeMidBg: 'rgba(0,200,128,0.18)',
  badgeUrgentBg: 'rgba(255,90,58,0.2)',
  badgeDoneBg: 'rgba(179,136,255,0.2)',

  badgeInk: { fresh: '#000084', mid: '#004c31', urgent: '#580e00', done: '#2c0a5c' },
  statusInk: { fresh: '#7a7aff', mid: '#00c880', urgent: '#ff5a3a', done: '#b388ff' },
};

// Pure-black CRT terminal — monochrome phosphor green with a single red
// alarm hue, sharp corners, monospace throughout.
const terminalColors: Palette = {
  bg: '#000000',
  bgElevated: '#050a05',
  panel: '#0a120a',
  panel2: '#0f1c0f',
  border: '#1c3d1c',
  text: '#baffc9',
  textDim: '#5ea86e',
  textFaint: '#5e8d5e',

  fresh: '#33ff66',
  mid: '#99ff33',
  urgent: '#ff3333',
  failed: '#598759',
  done: '#33fff0',

  accent: '#ff3333',
  backdrop: 'rgba(0,0,0,0.7)',
  failedCardBg: '#050a05',
  failedCardBorder: '#1c3d1c',
  trackBg: '#0f1c0f',
  urgentBorderAlpha: 'rgba(255,51,51,0.5)',
  badgeFailedText: '#6baf7a',

  badgeFreshBg: 'rgba(51,255,102,0.15)',
  badgeMidBg: 'rgba(153,255,51,0.15)',
  badgeUrgentBg: 'rgba(255,51,51,0.2)',
  badgeDoneBg: 'rgba(51,255,240,0.15)',

  badgeInk: { fresh: '#00711c', mid: '#3a7400', urgent: '#460000', done: '#003d38' },
  statusInk: { fresh: '#33ff66', mid: '#99ff33', urgent: '#ff3333', done: '#33fff0' },
};

// Light twin of Terminal: pale green-tinted "printout paper" instead of a
// pure-black CRT, deep phosphor-green ink, same red alarm hue darkened.
const terminalLightColors: Palette = {
  bg: '#eef7ee',
  bgElevated: '#f7fdf7',
  panel: '#f7fdf7',
  panel2: '#e0f0e0',
  border: '#1c3d1c',
  text: '#0a2e0a',
  textDim: '#2f6b2f',
  textFaint: '#4f6f4f',

  fresh: '#1f8f3f',
  mid: '#5c8f1f',
  urgent: '#c02020',
  failed: '#4f6f4f',
  done: '#0f766e',

  accent: '#c02020',
  backdrop: 'rgba(10,30,10,0.4)',
  failedCardBg: '#e6f2e6',
  failedCardBorder: '#bcd6bc',
  trackBg: '#dceedc',
  urgentBorderAlpha: 'rgba(192,32,32,0.35)',
  badgeFailedText: '#255a25',

  badgeFreshBg: 'rgba(31,143,63,0.14)',
  badgeMidBg: 'rgba(92,143,31,0.16)',
  badgeUrgentBg: 'rgba(192,32,32,0.16)',
  badgeDoneBg: 'rgba(15,118,110,0.14)',

  badgeInk: { fresh: '#051509', mid: '#111b06', urgent: '#f8d8d8', done: '#d8fff8' },
  statusInk: { fresh: '#1d853b', mid: '#527f1c', urgent: '#c02020', done: '#0f766e' },
};

const defaultPalettes: Record<Scheme, Palette> = { dark: darkColors, light: lightColors };
const brutalistPalettes: Record<Scheme, Palette> = { light: brutalistColors, dark: brutalistDarkColors };
const terminalPalettes: Record<Scheme, Palette> = { dark: terminalColors, light: terminalLightColors };

export function makeStatusColor(p: Palette): Record<TaskStatus, string> {
  return { done: p.done, fresh: p.fresh, mid: p.mid, urgent: p.urgent, failed: p.failed };
}

export function makeBadgeBg(p: Palette): Record<TaskStatus, string> {
  return {
    done: p.badgeDoneBg,
    fresh: p.badgeFreshBg,
    mid: p.badgeMidBg,
    urgent: p.badgeUrgentBg,
    failed: p.failedCardBorder,
  };
}

export function makeBadgeInk(p: Palette): Record<TaskStatus, string> {
  return {
    done: p.badgeInk.done,
    fresh: p.badgeInk.fresh,
    mid: p.badgeInk.mid,
    urgent: p.badgeInk.urgent,
    failed: p.badgeFailedText,
  };
}

export function makeStatusInk(p: Palette): Record<TaskStatus, string> {
  return {
    done: p.statusInk.done,
    fresh: p.statusInk.fresh,
    mid: p.statusInk.mid,
    urgent: p.statusInk.urgent,
    failed: p.failed,
  };
}

// Countdown numbers and timestamps are monospace in the mockup.
export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

/**
 * Shared shape/spacing tokens so sheets, cards, and buttons across the app
 * (CommitModal, ConfirmModal, TaskCard, ...) agree on the same radii instead
 * of each component picking its own hardEdges ? X : Y numbers.
 */
export interface RadiusScale {
  sheet: number; // bottom-sheet modals (top corners)
  box: number; // clock/stat boxes, primary buttons
  field: number; // text inputs, small controls
}

export const spacing = { xs: 6, sm: 12, md: 16, lg: 20, xl: 24 } as const;

const roundedRadius: RadiusScale = { sheet: 28, box: 16, field: 14 };
const sharpRadius: RadiusScale = { sheet: 8, box: 6, field: 6 };
const terminalRadius: RadiusScale = { sheet: 12, box: 4, field: 4 };

/**
 * Shape tokens: replaces the old scattered `isBrutalist ? X : Y` ternaries
 * duplicated across TaskCard/PipCard/TabBar/PetPicker/SettingsScreen/
 * CommitModal/ConfirmModal/TimelineScreen. `hardEdges` themes get thicker
 * borders and a hard offset drop-shadow instead of none.
 */
export interface ThemeShape {
  radius: RadiusScale;
  hardEdges: boolean;
}

/**
 * Typography tokens per theme. `display`/`body` are font-family overrides;
 * `undefined` keeps the platform default (React Native's system font), same
 * as the app's behavior before this theme had any font opinion.
 */
export interface ThemeType {
  display?: string;
  body?: string;
  titleWeight: TextStyle['fontWeight'];
  titleTracking: number;
  titleCase: 'none' | 'uppercase';
  badgeDecoration?: { prefix?: string; suffix?: string };
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  /** Every theme defines both a light and a dark Palette; `mode` in the theme store picks which one renders. */
  colors: Record<Scheme, Palette>;
  shape: ThemeShape;
  type: ThemeType;
}

const defaultType: ThemeType = {
  titleWeight: '800',
  titleTracking: -0.5,
  titleCase: 'none',
};

/**
 * Single source of truth for every theme: palette, shape, and typography.
 * `useTheme()` and the Settings screen's picker both read this — adding or
 * changing a theme only ever means editing an entry here.
 */
export const THEME_REGISTRY: Record<ThemeId, ThemeDefinition> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Neutral grays — follows the Mode setting below.',
    colors: defaultPalettes,
    shape: { radius: roundedRadius, hardEdges: false },
    type: defaultType,
  },
  brutalist: {
    id: 'brutalist',
    label: 'Brutalist Block',
    description: 'High-contrast paper & ink.',
    colors: brutalistPalettes,
    shape: { radius: sharpRadius, hardEdges: true },
    type: defaultType,
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    description: 'CRT phosphor green, monospace throughout.',
    colors: terminalPalettes,
    shape: { radius: terminalRadius, hardEdges: true },
    type: {
      display: mono,
      body: mono,
      titleWeight: '700',
      titleTracking: 0.5,
      titleCase: 'none',
      badgeDecoration: { prefix: '[', suffix: ']' },
    },
  },
};

/** Display order for the Settings screen's theme picker. */
export const THEME_ORDER: ThemeId[] = ['default', 'brutalist', 'terminal'];

/**
 * Resolves the active theme. `mode` (light/dark) is a global concern owned by
 * the theme store — seeded once from the OS appearance at store creation,
 * then only changed by the user via the Settings screen's Mode toggle — and
 * applies to whichever ThemeId is selected, including 'default'.
 */
export function useTheme() {
  const themeId = useThemeStore((s) => s.themeId);
  const mode = useThemeStore((s) => s.mode);
  const def = THEME_REGISTRY[themeId];
  const colors = def.colors[mode];
  return useMemo(() => {
    return {
      scheme: mode,
      themeId,
      colors,
      statusColor: makeStatusColor(colors),
      badgeBg: makeBadgeBg(colors),
      badgeInk: makeBadgeInk(colors),
      statusInk: makeStatusInk(colors),
      mono,
      shape: def.shape,
      type: def.type,
      spacing,
    };
  }, [themeId, mode, colors, def]);
}
