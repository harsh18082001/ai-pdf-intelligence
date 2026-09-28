import type { RequestOwner } from '../types/index.js';

/** Pinecone namespace for an owner — prefixed so a guest id can never collide with a user cuid. */
export function ownerNamespace(owner: RequestOwner): string {
  return owner.type === 'user' ? `u_${owner.id}` : `g_${owner.id}`;
}
