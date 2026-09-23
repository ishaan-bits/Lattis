/**
 * Project Threads — realtime thread list for one project.
 *
 * Back nav, live search, and a FAB-backed create sheet. Threads are scoped
 * to `ownerId + projectId` via the threads store; long-press opens rename /
 * archive / delete actions, tap opens the chat workspace.
 */

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { Icon, ScreenContainer, Text } from '@/components';
import { useAuth } from '@/features/auth';
import { FabButton, PressableScale, SearchBar } from '@/features/projects';
import {
  CreateThreadSheet,
  EmptyThreads,
  RenameThreadSheet,
  ThreadActionsSheet,
  ThreadCard,
  filterThreadsByTitle,
  useThreadPreviews,
  useThreadsStore,
} from '@/features/threads';
import { colors, spacing } from '@/theme';
import type { Thread } from '@/types';

export default function ProjectThreadsScreen(): React.JSX.Element {
  const { initialized, user, authLoading } = useAuth();
  const params = useLocalSearchParams<{ projectId?: string; projectTitle?: string }>();
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';
  const projectTitle = typeof params.projectTitle === 'string' ? params.projectTitle : '';

  const threads = useThreadsStore((state) => state.threads);
  const threadsLoading = useThreadsStore((state) => state.loading);
  const searchQuery = useThreadsStore((state) => state.searchQuery);
  const setSearchQuery = useThreadsStore((state) => state.setSearchQuery);
  const subscribe = useThreadsStore((state) => state.subscribe);
  const resetThreads = useThreadsStore((state) => state.reset);

  const [createVisible, setCreateVisible] = useState(false);
  const [actionsThread, setActionsThread] = useState<Thread | null>(null);
  const [renameThread, setRenameThread] = useState<Thread | null>(null);

  const ownerId = user?.uid;

  useEffect(() => {
    if (!ownerId || !projectId) return undefined;
    subscribe(ownerId, projectId);
    return () => resetThreads();
  }, [ownerId, projectId, subscribe, resetThreads]);

  const visibleThreads = useMemo(
    () => filterThreadsByTitle(threads, searchQuery),
    [threads, searchQuery],
  );

  const threadIds = useMemo(() => visibleThreads.map((thread) => thread.id), [visibleThreads]);
  const previews = useThreadPreviews(threadIds);

  if (!projectId) {
    return <Redirect href="/" />;
  }

  if (authLoading) {
    return <Redirect href="/splash" />;
  }

  if (initialized && !user) {
    return <Redirect href="/login" />;
  }

  const showEmptyState = !threadsLoading && threads.length === 0;
  const showNoMatches = !threadsLoading && threads.length > 0 && visibleThreads.length === 0;

  function renderEmpty(): React.JSX.Element | null {
    if (threadsLoading && threads.length === 0) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }
    if (showEmptyState) {
      return <EmptyThreads onCreate={() => setCreateVisible(true)} />;
    }
    if (showNoMatches) {
      return (
        <View style={styles.noMatches}>
          <Text variant="body" color="textSecondary" style={styles.noMatchesText}>
            No threads match “{searchQuery.trim()}”.
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <ScreenContainer>
      <FlatList
        data={visibleThreads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <PressableScale
                accessibilityLabel="Back to projects"
                accessibilityRole="button"
                hitSlop={12}
                onPress={() => router.back()}
                scaleTo={0.9}
                style={styles.back}
              >
                <Icon name="chevron.left" size={18} color={colors.text} />
                <Text variant="bodyMedium" color="text">
                  Projects
                </Text>
              </PressableScale>
              <PressableScale
                accessibilityLabel="Open canvas"
                accessibilityRole="button"
                hitSlop={12}
                onPress={() =>
                  router.push({
                    pathname: '/projects/[projectId]/canvas',
                    params: { projectId, projectTitle },
                  })
                }
                scaleTo={0.9}
                style={styles.canvasButton}
              >
                <Icon name="scribble" size={16} color={colors.text} />
                <Text variant="caption" color="text">
                  Canvas
                </Text>
              </PressableScale>
            </View>

            <View style={styles.titleBlock}>
              <Text variant="title" style={styles.title}>
                {projectTitle || 'Threads'}
              </Text>
              <Text variant="body" color="textSecondary">
                Threads
              </Text>
            </View>

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search threads"
            />

            <Text variant="label" color="textMuted" style={styles.sectionTitle}>
              Threads
            </Text>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        renderItem={({ item, index }) => (
          <ThreadCard
            thread={item}
            index={index}
            preview={previews[item.id]}
            onPress={() =>
              router.push({
                pathname: '/threads/[threadId]',
                params: {
                  threadId: item.id,
                  threadTitle: item.title,
                  projectId,
                  projectTitle,
                },
              })
            }
            onActions={() => setActionsThread(item)}
          />
        )}
        removeClippedSubviews
      />

      <FabButton active={createVisible} label="New thread" onPress={() => setCreateVisible(true)} />

      <CreateThreadSheet visible={createVisible} onClose={() => setCreateVisible(false)} />
      <ThreadActionsSheet
        thread={actionsThread}
        onClose={() => setActionsThread(null)}
        onRename={(thread) => {
          setActionsThread(null);
          setRenameThread(thread);
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
  header: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
    paddingRight: spacing.xs,
  },
  canvasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingLeft: spacing.xs,
  },
  titleBlock: {
    gap: spacing.xxs,
  },
  title: {
    letterSpacing: -0.4,
  },
  sectionTitle: {
    marginLeft: spacing.xxs,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: 96,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  noMatches: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noMatchesText: {
    textAlign: 'center',
  },
});
