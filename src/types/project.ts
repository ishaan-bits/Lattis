/**
 * Project domain types.
 *
 * The canvas/boards relationship is intentionally left to a later phase —
 * keep this model minimal until persistence lands.
 */

import type { ID, ISOTimestamp } from '@/types';

export type Project = {
  id: ID;
  name: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
};

/** Shape used when creating a project; ids/timestamps are assigned by the store. */
export type NewProject = Pick<Project, 'name'>;
