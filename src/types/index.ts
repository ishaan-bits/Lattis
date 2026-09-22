/**
 * Shared cross-cutting types.
 */

/** ISO-8601 timestamp string. */
export type ISOTimestamp = string;

/** Opaque, app-unique identifier (UUID v4). */
export type ID = string;

export * from './project';
export * from './thread';
export * from './user';
