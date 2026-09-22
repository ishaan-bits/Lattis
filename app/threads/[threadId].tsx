/**
 * Chat Workspace — ChatGPT-style conversation for one thread.
 *
 * Realtime messages from `threads/{id}/messages`, user bubble right /
 * assistant bubble left, auto-scroll, typing indicator while the AIProvider
 * streams, and a multiline composer. AI access goes through the provider
 * interface only (`@/features/ai`) — Gemini streams directly from the app.
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
} from 'react-native';

import { Icon, ScreenContainer, Text } from '@/components';
import { aiProvider, type AIChatMessage } from '@/features/ai';
import { useAuth } from '@/features/auth';
import { PressableScale } from '@/features/projects';
import {
  ChatComposer,
  MessageBubble,
  TypingIndicator,
  useThreadMessages,
} from '@/features/threads';
import { colors, spacing } from '@/theme';

export default function ChatScreen(): React.JSX.Element {
  const { initialized, user, loading } = useAuth();
  const params = useLocalSearchParams<{ threadId?: string; threadTitle?: string }>();
  const threadId = typeof params.threadId === 'string' ? params.threadId : '';
  const threadTitle = typeof params.threadTitle === 'string' ? params.threadTitle : 'Thread';

  const { messages, loading: messagesLoading } = useThreadMessages(threadId || null);

  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [streamText, setStreamText] = useState<string | null>(null);
  const [awaiting, setAwaiting] = useState(false);

  const busy = awaiting || streamText !== null;
  const visibleCount = messages.length + (streamText !== null ? 1 : 0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [visibleCount, streamText]);

  if (!threadId) {
    return <Redirect href="/" />;
  }

  if (!initialized && loading) {
    return <Redirect href="/splash" />;
  }

  if (initialized && !user) {
    return <Redirect href="/login" />;
  }

  /** Shown as the assistant reply whenever Gemini (or persistence) fails. */
  const FALLBACK_REPLY = 'Sorry, something went wrong. Please try again.';

  async function onSend(): Promise<void> {
    const text = draft.trim();
    if (!text || busy) return;

    setDraft('');
    setAwaiting(true);

    const { sendThreadMessage } = await import('@/services');

    // 1. Persist the user message first (realtime listener updates the list).
    try {
      await sendThreadMessage(threadId, { role: 'user', content: text });
    } catch (error) {
      Alert.alert(
        'Could not send message',
        error instanceof Error ? error.message : 'Please try again.',
      );
      setAwaiting(false);
      return;
    }

    const history: AIChatMessage[] = [
      ...messages.map((message) => ({ role: message.role, content: message.content })),
      { role: 'user', content: text },
    ];

    // 2-5. Typing indicator → stream tokens live into the assistant bubble.
    let acc = '';
    try {
      for await (const chunk of aiProvider.sendMessage(history)) {
        setAwaiting(false);
        acc += chunk;
        setStreamText(acc);
      }
      if (!acc.trim()) {
        throw new Error('empty reply');
      }
    } catch {
      // Gemini failed — show (and persist) the fallback assistant message.
      acc = FALLBACK_REPLY;
      setStreamText(acc);
    }

    // 6-7. Persist the reply, then drop the streaming bubble + indicator.
    try {
      await sendThreadMessage(threadId, { role: 'assistant', content: acc });
    } catch {
      console.warn('[chat] failed to persist assistant reply');
    } finally {
      setStreamText(null);
      setAwaiting(false);
    }
  }

  const showEmptyHint = !messagesLoading && messages.length === 0 && streamText === null;

  return (
    <ScreenContainer horizontalPadding={0} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <PressableScale
          accessibilityLabel="Back to threads"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          scaleTo={0.9}
          style={styles.back}
        >
          <Icon name="chevron.left" size={20} color={colors.text} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {threadTitle}
          </Text>
          <Text variant="caption" color="textMuted">
            Chat
          </Text>
        </View>
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
        >
          {messagesLoading && messages.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} size="small" />
            </View>
          ) : null}

          {showEmptyHint ? (
            <View style={styles.hint}>
              <Text variant="body" color="textSecondary" style={styles.hintText}>
                Start the conversation — send a message below.
              </Text>
            </View>
          ) : null}

          {messages.map((message, index) => (
            <MessageBubble key={message.id} message={message} index={index} />
          ))}

          {awaiting && streamText === null ? <TypingIndicator /> : null}
          {streamText !== null ? (
            <MessageBubble
              key="streaming-assistant"
              index={messages.length}
              message={{
                id: 'streaming',
                threadId,
                role: 'assistant',
                // Trailing block cursor while generating (never persisted —
                // Firestore gets the raw `acc` without it).
                content: `${streamText}▍`,
                createdAt: new Date().toISOString(),
              }}
            />
          ) : null}
        </ScrollView>

        <ChatComposer
          value={draft}
          onChangeText={setDraft}
          onSend={() => void onSend()}
          disabled={busy}
        />
      </KeyboardAvoidingView>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 1,
  },
  listContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  hint: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  hintText: {
    textAlign: 'center',
  },
});
