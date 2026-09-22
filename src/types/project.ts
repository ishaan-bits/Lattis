/**
 * Project domain types.
 *
 * Matches the Firestore `projects/{projectId}` document shape. Every query
 * must filter by `ownerId == current user uid`.
 */

import type { ID, ISOTimestamp } from '@/types';

export type Project = {
  id: ID;
  ownerId: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  archived: boolean;
};

/** Shape used when creating a project; ids/timestamps are assigned by the service. */
export type NewProject = Pick<Project, 'title' | 'emoji' | 'color' | 'description'>;
