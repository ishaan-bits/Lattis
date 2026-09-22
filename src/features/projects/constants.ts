/**
 * Project creation constants — curated emoji palette and accent colors.
 */

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
  '#3B82F6',
  '#38BDF8',
  '#34D399',
  '#FBBF24',
  '#F87171',
  '#A78BFA',
  '#F472B6',
  '#94A3B8',
] as const;

export const DEFAULT_PROJECT_EMOJI = '🎯';
export const DEFAULT_PROJECT_COLOR = '#3B82F6';
export const PROJECT_TITLE_MAX = 60;
