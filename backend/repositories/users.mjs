import { randomUUID } from 'node:crypto';

function record(row) {
  if (!row) return null;
  return { id: row.id, displayName: row.display_name, theme: row.theme, profileState: row.profile_state,
    avatarMediaId: row.avatar_media_id || null, preferences: {theme:row.theme_choice || 'cosmic',splashCursor:Boolean(row.splash_cursor),effectColors:row.effect_colors !== 0},
    schemaVersion: row.schema_version, revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at };
}
function name(value) {
  if (typeof value !== 'string' || value.trim().length > 80) throw new TypeError('Display name must contain at most 80 characters.');
  return value.trim();
}
export function createUserRepository(db) {
  const get = id => record(db.prepare('SELECT users.*,p.theme_choice,p.splash_cursor,p.effect_colors FROM users LEFT JOIN user_preferences p ON p.user_id=users.id WHERE users.id = ?').get(id));
  return Object.freeze({
    get,
    create({ displayName = '' } = {}) {
      const id = randomUUID(), now = new Date().toISOString();
      db.prepare('INSERT INTO users(id, display_name, created_at, updated_at) VALUES(?, ?, ?, ?)').run(id, name(displayName), now, now);
      return get(id);
    },
    completeProfile(id, displayName, expectedRevision) {
      const trimmed = name(displayName);
      if (!trimmed || /[\u0000-\u001f\u007f]/u.test(trimmed)) throw Object.assign(new Error('Enter a display name of 1–80 characters.'), { code: 'INVALID_PROFILE' });
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw Object.assign(new Error('Invalid revision.'), { code: 'INVALID_PROFILE' });
      const changed = db.prepare("UPDATE users SET display_name = ?, profile_state = 'complete', updated_at = ?, revision = revision + 1 WHERE id = ? AND revision = ? AND profile_state = 'incomplete'")
        .run(trimmed, new Date().toISOString(), id, expectedRevision);
      const user = get(id);
      // Lost-response retries never create another user or overwrite a completed profile.
      if (changed.changes === 1 || (user?.profileState === 'complete' && user.displayName === trimmed)) return user;
      throw Object.assign(new Error('Profile changed in another session.'), { code: 'REVISION_CONFLICT' });
    },
    updateProfile(id, { displayName, theme }, expectedRevision) {
      if (!Number.isInteger(expectedRevision) || expectedRevision < 1) throw new TypeError('A positive expected revision is required.');
      if (!['system', 'dark', 'light'].includes(theme)) throw new TypeError('Unknown theme.');
      const changed = db.prepare('UPDATE users SET display_name = ?, theme = ?, updated_at = ?, revision = revision + 1 WHERE id = ? AND revision = ?')
        .run(name(displayName), theme, new Date().toISOString(), id, expectedRevision);
      if (changed.changes !== 1) {
        const error = new Error('User missing or revision conflict.'); error.code = 'REVISION_CONFLICT'; throw error;
      }
      return get(id);
    },
  });
}

// Trusted server-side use only, after future provider-proof verification.
// Matching identity tuples are idempotent; remapping an identity is rejected.
export function createIdentityRepository(db) {
  const find = ({ provider, issuer, subject }) => db.prepare('SELECT user_id FROM external_identities WHERE provider = ? AND issuer = ? AND subject = ?').get(provider, issuer, subject)?.user_id ?? null;
  return Object.freeze({
    find,
    link(identity, userId) {
      for (const key of ['provider', 'issuer', 'subject']) {
        if (typeof identity[key] !== 'string' || !identity[key].trim() || identity[key].length > 2048) throw new TypeError(`Invalid identity ${key}.`);
      }
      const { provider, issuer, subject } = identity;
      const now = new Date().toISOString();
      db.prepare('INSERT INTO external_identities(provider, issuer, subject, user_id, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?) ON CONFLICT(provider, issuer, subject) DO NOTHING')
        .run(provider, issuer, subject, userId, now, now);
      if (find(identity) !== userId) throw new Error('Identity already belongs to another user.');
      return userId;
    },
  });
}
