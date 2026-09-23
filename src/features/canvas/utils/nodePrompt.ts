/**
 * Node AI prompt templates — one instruction per floating-toolbar action.
 *
 * Every template ends with an explicit output contract so Gemini returns
 * bare note content (or bare continuation text) rather than chatty preamble.
 */

import type { NodeAIAction } from '../types';

const INSTRUCTIONS: Record<NodeAIAction, string> = {
  continue:
    'Continue writing where the content leaves off. Return ONLY the new text to append. Do not repeat existing content.',
  summarize: 'Summarize the content in a few concise sentences. Return ONLY the rewritten content.',
  rewrite:
    'Rewrite the content so it is clearer and better written while preserving the meaning. Return ONLY the rewritten content.',
  bullets:
    'Convert the content into a clean bulleted list using "- " prefixes. Return ONLY the rewritten content.',
  explain:
    'Explain the content in simple language anyone can understand. Return ONLY the rewritten content.',
};

export function buildNodePrompt(action: NodeAIAction, title: string, content: string): string {
  const safeTitle = title.trim() === '' ? '(untitled)' : title;
  const safeContent = content.trim() === '' ? '(empty)' : content;
  return [INSTRUCTIONS[action], '', `Title:\n${safeTitle}`, '', `Content:\n${safeContent}`].join(
    '\n',
  );
}
