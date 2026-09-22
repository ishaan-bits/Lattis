/**
 * User domain types.
 */

import type { ID, ISOTimestamp } from '@/types';

export type UserProfile = {
  uid: ID;
  username: string;
  fullName: string;
  /** ISO date string (YYYY-MM-DD). */
  dateOfBirth: string;
  email: string;
  createdAt?: ISOTimestamp;
  updatedAt?: ISOTimestamp;
};

export type NewUserProfile = Omit<UserProfile, 'createdAt' | 'updatedAt'>;
