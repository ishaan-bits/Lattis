/**
 * Chat Workspace — ChatGPT-style conversation for one thread.
 *
 * Realtime messages from `threads/{id}/messages`, live thread title in the
 * header (with rename/actions sheets), markdown assistant replies streamed
 * through the AIProvider, stop-generation, per-message copy/regenerate/
 * delete, auto-titling on the first send, and an inline empty state with
 * prompt chips. AI access goes through the provider interface only —
 * Gemini streams directly from the app.
 */

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, ScreenContainer, Text } from '@/components';
import { aiProvider, type AIChatMessage } from '@/features/ai';
import { MessageBubble } from '@/features/chat';
import { useAuth } from '@/features/auth';
import { PressableScale } from '@/features/projects';
import {
  ChatComposer,
  DEFAULT_THREAD_TITLE,
  RenameThreadSheet,
  THREAD_TITLE_MAX,
  ThreadActionsSheet,
  TypingIndicator,
  useThread,
  useThreadMessages,
} from '@/features/threads';
import { deleteThreadMessage, sendThreadMessage, updateThread } from '@/services';
import { colors, radius, spacing } from '@/theme';
import type { Thread } from '@/types';

/** Shown as the assistant reply whenever Gemini (or persistence) fails. */
const FALLBACK_REPLY = 'Sorry, something went wrong. Please try again.';

const PROMPT_CHIPS = [
  'Build a roadmap',
  'Explain this code',
  'Brainstorm ideas',
  'Write documentation',
];

export default function ChatScreen(): React.JSX.Element {
  const { initialized, user, authLoading } = useAuth();
  const params = useLocalSearchParams<{
    threadId?: string;
    threadTitle?: string;
    projectTitle?: string;
  }>();
  const threadId = typeof params.threadId === 'string' ? params.threadId : '';
  const fallbackTitle = typeof params.threadTitle === 'string' ? params.threadTitle : 'Thread';
  const projectTitle = typeof params.projectTitle === 'string' ? params.projectTitle : '';

  const { thread, loading: threadLoading } = useThread(threadId || null);
  const { messages, loading: messagesLoading } = useThreadMessages(threadId || null);
  const insets = useSafeAreaInsets();
  const headerInsets: ViewStyle = { paddingTop: insets.top + spacing.xs };

  const scrollRef = useRef<ScrollView>(null);
  const cancelledRef = useRef(false);
  const mountedRef = useRef(true);
  const nearBottomRef = useRef(true);
  const [draft, setDraft] = useState('');
  const [streamText, setStreamText] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);
  const [actionsThread, setActionsThread] = useState<Thread | null>(null);
  const [renameThread, setRenameThread] = useState<Thread | null>(null);

  const busy = awaiting || streamText !== null;
  const visibleCount = messages.length + (streamText !== null ? 1 : 0);
  const title = thread?.title ?? fallbackTitle;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelledRef.current = true;
    };
  }, []);

  // Auto-scroll only when the user is already near the bottom — don't yank
  // the viewport while reading history mid-stream.
  useEffect(() => {
    if (!nearBottomRef.current) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [visibleCount, streamText]);

  // Thread deleted from the actions sheet (or elsewhere) — leave the screen.
  const threadGone =
    Boolean(threadId) && initialized && Boolean(user) && !threadLoading && thread === null;
  useEffect(() => {
    if (threadGone) router.back();
  }, [threadGone]);

  if (!threadId) {
    return <Redirect href="/" />;
  }

  if (authLoading) {
    return <Redirect href="/splash" />;
  }

  if (initialized && !user) {
    return <Redirect href="/login" />;
  }

  /** Streams one assistant reply; respects the stop flag, then persists. */
  async function streamReply(history: AIChatMessage[]): Promise<void> {
    setAwaiting(true);

    let acc = '';
    let failed = false;
    try {
      for await (const chunk of aiProvider.sendMessage(history)) {
        if (cancelledRef.current || !mountedRef.current) break;
        setAwaiting(false);
        acc += chunk;
        setStreamText(acc);
      }
    } catch {
      failed = true;
    }

    if (failed) {
      // Keep partial content if the stream already produced something.
      if (acc.trim()) {
        setStreamText(acc);
      } else {
        acc = FALLBACK_REPLY;
        setStreamText(acc);
      }
    } else if (!acc.trim() && !cancelledRef.current) {
      // Provider yielded nothing without throwing — treat as a failure.
      acc = FALLBACK_REPLY;
      setStreamText(acc);
    }

    // Persist the reply (partial text when stopped mid-stream); a stop
    // before the first token has nothing to save.
    if (acc.trim() && mountedRef.current) {
      try {
        await sendThreadMessage(threadId, { role: 'assistant', content: acc });
      } catch {
        console.warn('[chat] failed to persist assistant reply');
      }
    }

    if (mountedRef.current) {
      setStreamText(null);
      setAwaiting(false);
    }
    cancelledRef.current = false;
  }

  async function onSend(): Promise<void> {
    const text = draft.trim();
    if (!text || busy) return;

    setDraft('');
    cancelledRef.current = false;

    // First message names the thread from its opening line.
    if (messages.length === 0) {
      const currentTitle = thread?.title ?? DEFAULT_THREAD_TITLE;
      if (!currentTitle.trim() || currentTitle === DEFAULT_THREAD_TITLE) {
        const firstLine = (text.split('\n')[0] ?? '').trim();
        if (firstLine) {
          void updateThread(threadId, { title: firstLine.slice(0, THREAD_TITLE_MAX) }).catch(
            () => undefined,
          );
        }
      }
    }

    setAwaiting(true);

    // 1. Persist the user message first (realtime listener updates the list).
    try {
      await sendThreadMessage(threadId, { role: 'user', content: text });
    } catch (error) {
      Alert.alert(
        'Could not send message',
        error instanceof Error && error.message ? error.message : 'Please try again.',
      );
      setAwaiting(false);
      // Restore the draft so the user doesn't lose their text.
      setDraft((current) => (current === '' ? text : current));
      return;
    }

    const history: AIChatMessage[] = [
      ...messages.map((message) => ({ role: message.role, content: message.content })),
      { role: 'user', content: text },
    ];

    await streamReply(history);
  }

  function onStop(): void {
    cancelledRef.current = true;
    // Stop while still awaiting first token — clear the spinner immediately.
    if (streamText === null) {
      setAwaiting(false);
    }
  }

  async function onRegenerate(messageId: string): Promise<void> {
    if (busy) return;
    const index = messages.findIndex((message) => message.id === messageId);
    if (index < 0) return;

    // History up to (but excluding) the reply being regenerated — it must
    // end on the user prompt that produced it.
    const history: AIChatMessage[] = messages
      .slice(0, index)
      .map((message) => ({ role: message.role, content: message.content }));
    if (history.length === 0 || history[history.length - 1]?.role !== 'user') return;

    setAwaiting(true);
    cancelledRef.current = false;
    try {
      // Firestore forbids message updates — regenerate deletes and re-streams.
      await deleteThreadMessage(threadId, messageId);
    } catch (error) {
      Alert.alert(
        'Could not regenerate reply',
        error instanceof Error && error.message ? error.message : 'Please try again.',
      );
      setAwaiting(false);
      return;
    }

    await streamReply(history);
  }

  function onDeleteMessage(messageId: string): void {
    Alert.alert('Delete message?', 'This removes the message from the thread.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteThreadMessage(threadId, messageId).catch((error: unknown) => {
            Alert.alert(
              'Could not delete message',
              error instanceof Error ? error.message : 'Please try again.',
            );
          });
        },
      },
    ]);
  }

  const showEmptyState =
    !messagesLoading && messages.length === 0 && streamText === null && !awaiting;

  return (
    <ScreenContainer horizontalPadding={0} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, headerInsets]}>
        <PressableScale
          accessibilityLabel="Back to threads"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          scaleTo={0.9}
          style={styles.back}
        >
          <Icon name="chevron.left" size={20} color={colors.text} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {projectTitle || 'Chat'}
          </Text>
        </View>
        <PressableScale
          accessibilityLabel="Thread actions"
          accessibilityRole="button"
          disabled={!thread}
          hitSlop={12}
          onPress={() => setActionsThread(thread)}
          scaleTo={0.9}
          style={styles.headerBtn}
        >
          <Icon name="ellipsis" size={20} color={colors.textSecondary} />
        </PressableScale>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const distanceFromBottom =
              contentSize.height - layoutMeasurement.height - contentOffset.y;
            nearBottomRef.current = distanceFromBottom < 120;
          }}
          scrollEventThrottle={16}
        >
          {messagesLoading && messages.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null}

          {showEmptyState ? (
            <Animated.View entering={FadeInUp.duration(420)} style={styles.empty}>
              <View accessibilityElementsHidden style={styles.sparkle}>
                <Icon name="sparkles" size={26} color={colors.accent} />
              </View>
              <Text variant="title" style={styles.emptyTitle}>
                Lattis AI
              </Text>
              <Text variant="body" color="textSecondary" style={styles.emptyBody}>
                Your intelligent workspace for thinking, planning and building.
              </Text>
              <View style={styles.chips}>
                {PROMPT_CHIPS.map((chip) => (
                  <PressableScale
                    key={chip}
                    accessibilityLabel={`Use prompt: ${chip}`}
                    onPress={() => setDraft(chip)}
                    scaleTo={0.96}
                    style={styles.chip}
                  >
                    <Text variant="caption" color="textSecondary">
                      {chip}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              index={index}
              onRegenerate={(id) => void onRegenerate(id)}
              onDelete={onDeleteMessage}
            />
          ))}

          {awaiting && streamText === null ? <TypingIndicator /> : null}
          {streamText !== null ? (
            <MessageBubble
              key="streaming-assistant"
              index={messages.length}
              streaming
              message={{
                id: 'streaming',
                threadId,
                role: 'assistant',
                content: streamText,
                createdAt: new Date().toISOString(),
              }}
            />
          ) : null}
        </ScrollView>

        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={() => void onSend()}
          onStop={onStop}
          busy={busy}
        />
      </KeyboardAvoidingView>

      <ThreadActionsSheet
        thread={actionsThread}
        onClose={() => setActionsThread(null)}
        onRename={(next) => {
          setActionsThread(null);
          setRenameThread(next);
        }}
      />
      <RenameThreadSheet
        key={renameThread?.id ?? 'rename-closed'}
        thread={renameThread}
        onClose={() => setRenameThread(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  sparkle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    letterSpacing: -0.4,
  },
  emptyBody: {
    textAlign: 'center',
    maxWidth: 300,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
