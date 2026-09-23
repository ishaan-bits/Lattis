/**
 * Project creation constants — curated emoji palette and accent colors.
 */

import { colors } from '@/theme';

/** Exactly 30 curated emojis for the create-project picker. */
export const PROJECT_EMOJIS = [
  '🎯',
  '🚀',
  '💡',
  '🎨',
  '📚',
  '🌱',
  '🔥',
  '⚡',
  '🧠',
  '🛠️',
  '🧪',
  '🎵',
  '📸',
  '💼',
  '🗺️',
  '🏋️',
  '🧘',
  '🍳',
  '✈️',
  '💰',
  '❤️',
  '🔬',
  '📐',
  '🎮',
  '✍️',
  '🏗️',
  '🌍',
  '📦',
  '🔑',
  '🏆',
] as const;

/** Exactly 8 accent colors for project cards. */
export const PROJECT_COLORS = [
  colors.primary,
  colors.accent,
  colors.success,
  colors.warning,
  colors.danger,
  '#A78BFA',
  '#F472B6',
  '#94A3B8',
] as const;

export const DEFAULT_PROJECT_EMOJI = '🎯';
export const DEFAULT_PROJECT_COLOR = colors.primary;
export const PROJECT_TITLE_MAX = 60;
