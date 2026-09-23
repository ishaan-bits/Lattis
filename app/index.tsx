/**
 * Home — premium projects dashboard.
 *
 * Time-based greeting, live search, avatar, and a realtime 2-column project
 * grid scoped to the signed-in owner. Create / rename / delete all run
 * through the projects store (no Firestore calls in UI).
 */

import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

import { ScreenContainer, Text } from '@/components';
import { useAuth } from '@/features/auth';
import {
  CreateProjectSheet,
  EmptyProjects,
  FabButton,
  PressableScale,
  ProjectActionsSheet,
  ProjectCard,
  RenameProjectSheet,
  SearchBar,
  useProjectsStore,
} from '@/features/projects';
import { colors, radius, spacing } from '@/theme';
import type { Project } from '@/types';

function greetingForNow(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function firstNameOf(fullName: string | null | undefined): string | null {
  const name = fullName?.trim();
  if (!name) return null;
  return name.split(/\s+/)[0] ?? null;
}

export default function HomeScreen(): React.JSX.Element {
  const { initialized, user, userProfile, authLoading, logout } = useAuth();

  const projects = useProjectsStore((state) => state.projects);
  const projectsLoading = useProjectsStore((state) => state.loading);
  const projectsError = useProjectsStore((state) => state.error);
  const searchQuery = useProjectsStore((state) => state.searchQuery);
  const setSearchQuery = useProjectsStore((state) => state.setSearchQuery);
  const subscribe = useProjectsStore((state) => state.subscribe);
  const resetProjects = useProjectsStore((state) => state.reset);

  const [createVisible, setCreateVisible] = useState(false);
  const [actionsProject, setActionsProject] = useState<Project | null>(null);
  const [renameProject, setRenameProject] = useState<Project | null>(null);
  const [greeting] = useState(() => greetingForNow());

  const ownerId = user?.uid;

  useEffect(() => {
    if (!ownerId) return undefined;
    subscribe(ownerId);
    return () => resetProjects();
  }, [ownerId, subscribe, resetProjects]);

  const visibleProjects = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    const filtered = needle
      ? projects.filter((project) => project.title.toLowerCase().includes(needle))
      : projects;
    return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projects, searchQuery]);

  const openProject = useCallback((item: Project) => {
    router.push({
      pathname: '/projects/[projectId]',
      params: { projectId: item.id, projectTitle: item.title },
    });
  }, []);

  const openActions = useCallback((item: Project) => {
    setActionsProject(item);
  }, []);

  const renderProject = useCallback(
    ({ item, index }: { item: Project; index: number }) => {
      const isLastOdd = visibleProjects.length % 2 === 1 && index === visibleProjects.length - 1;
      return (
        <>
          <ProjectCard
            project={item}
            index={index}
            onPress={() => openProject(item)}
            onActions={() => openActions(item)}
          />
          {isLastOdd ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.gridSpacer}
            />
          ) : null}
        </>
      );
    },
    [openProject, openActions, visibleProjects.length],
  );

  if (authLoading) {
    return <Redirect href="/splash" />;
  }

  if (initialized && !user) {
    return <Redirect href="/login" />;
  }

  const firstName = firstNameOf(userProfile?.fullName) ?? userProfile?.username ?? 'there';
  const avatarLetter = (firstName[0] ?? '?').toUpperCase();
  const showEmptyState = !projectsLoading && !projectsError && projects.length === 0;
  const showNoMatches =
    !projectsLoading && !projectsError && projects.length > 0 && visibleProjects.length === 0;

  function onAvatarPress(): void {
    Alert.alert('Account', userProfile?.email ?? user?.email ?? 'Signed in', [
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void logout().catch((err) => {
            Alert.alert(
              'Sign out failed',
              err instanceof Error && err.message ? err.message : 'Please try again.',
            );
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function renderEmpty(): React.JSX.Element | null {
    if (projectsLoading && projects.length === 0) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }
    if (projectsError) {
      return (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text variant="body" color="danger" style={styles.centerText}>
            {projectsError}
          </Text>
          <Text variant="caption" color="textMuted" style={styles.centerText}>
            Pull to refresh or sign in again to retry.
          </Text>
        </View>
      );
    }
    if (showEmptyState) {
      return <EmptyProjects onCreate={() => setCreateVisible(true)} />;
    }
    if (showNoMatches) {
      return (
        <View style={styles.noMatches}>
          <Text variant="body" color="textSecondary" style={styles.noMatchesText}>
            No projects match “{searchQuery.trim()}”.
          </Text>
        </View>
      );
    }
    return null;
  }

  return (
    <ScreenContainer>
      <FlatList
        data={visibleProjects}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View style={styles.greetingBlock}>
                <Text variant="title" style={styles.greeting}>
                  {greeting}, {firstName}
                </Text>
                <Text variant="body" color="textSecondary">
                  Your ideas, organized.
                </Text>
              </View>
              <PressableScale
                accessibilityLabel="Account"
                accessibilityRole="button"
                onPress={onAvatarPress}
                scaleTo={0.92}
                style={styles.avatar}
              >
                <Text variant="bodyMedium" color="primary">
                  {avatarLetter}
                </Text>
              </PressableScale>
            </View>

            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search projects"
            />

            <Text variant="label" color="textMuted" style={styles.sectionTitle}>
              Projects
            </Text>
          </View>
        }
        ListEmptyComponent={renderEmpty}
        renderItem={renderProject}
      />

      <FabButton active={createVisible} onPress={() => setCreateVisible(true)} />

      <CreateProjectSheet visible={createVisible} onClose={() => setCreateVisible(false)} />
      <ProjectActionsSheet
        project={actionsProject}
        onClose={() => setActionsProject(null)}
        onRename={(project) => {
          setActionsProject(null);
          setRenameProject(project);
        }}
      />
      <RenameProjectSheet
        key={renameProject?.id ?? 'rename-closed'}
        project={renameProject}
        onClose={() => setRenameProject(null)}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  greetingBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  greeting: {
    letterSpacing: -0.4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  sectionTitle: {
    marginLeft: spacing.xxs,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: 96,
  },
  gridRow: {
    gap: spacing.md,
  },
  loadingBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  errorBox: {
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  centerText: {
    textAlign: 'center',
  },
  noMatches: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  noMatchesText: {
    textAlign: 'center',
  },
  gridSpacer: {
    flex: 1,
  },
});
