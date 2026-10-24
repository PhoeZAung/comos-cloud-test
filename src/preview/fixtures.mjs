// Synthetic development data only. Never import real accounts or campaign records here.
export function freshFixtures() {
  return {
    profiles: [{ id: 'fixture:profile:guest', displayName: 'Preview explorer' }],
    characters: [],
    posts: [],
    replies: [],
    lore: [],
  };
}
