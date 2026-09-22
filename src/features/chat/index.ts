/**
 * Chat feature — conversation presentation (bubbles, markdown, actions).
 *
 * Screen composition lives under `app/`; this folder owns the message UI
 * only. Thread/message data still flows through `@/services` + threads hooks.
 */

export { CodeBlock, type CodeBlockProps } from './components/CodeBlock';
export { MarkdownMessage, type MarkdownMessageProps } from './components/MarkdownMessage';
export { MessageActions, type MessageActionsProps } from './components/MessageActions';
export { MessageBubble, type MessageBubbleProps } from './components/MessageBubble';
export { TypingCursor } from './components/TypingCursor';
