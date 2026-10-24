import { freshFixtures } from './fixtures.mjs';

// This adapter has no network client, browser storage, credentials, or API URL.
// Each instance owns its data. All changes disappear on reset or page reload.
export function createFixtureStore() {
  let records = freshFixtures();
  let sequence = 0;
  const copy = value => structuredClone(value);
  function table(name) {
    if (!Object.hasOwn(records, name)) throw new Error(`Unknown fixture collection: ${name}`);
    return records[name];
  }
  function checkId(id) {
    if (typeof id !== 'string' || !id.startsWith('fixture:')) throw new Error('Only fixture IDs are allowed in preview.');
  }
  function fields(value) {
    if (!value || Object.getPrototypeOf(value) !== Object.prototype) throw new Error('Fixture fields must be a plain object.');
    if (Object.hasOwn(value, 'id')) throw new Error('Fixture IDs are assigned by the preview store.');
    return copy(value);
  }
  return Object.freeze({
    list(name) { return copy(table(name)); },
    get(name, id) {
      checkId(id);
      return copy(table(name).find(row => row.id === id) ?? null);
    },
    create(name, value) {
      const rows = table(name);
      const row = { ...fields(value), id: `fixture:${name}:${++sequence}` };
      rows.push(row);
      return copy(row);
    },
    update(name, id, changes) {
      checkId(id);
      const rows = table(name);
      const index = rows.findIndex(row => row.id === id);
      if (index < 0) throw new Error('Fixture record not found.');
      rows[index] = { ...rows[index], ...fields(changes) };
      return copy(rows[index]);
    },
    remove(name, id) {
      checkId(id);
      const rows = table(name);
      const index = rows.findIndex(row => row.id === id);
      if (index < 0) return false;
      rows.splice(index, 1);
      return true;
    },
    reset() { records = freshFixtures(); },
  });
}
