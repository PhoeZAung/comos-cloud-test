// Render authenticated, same-origin profile photos; show a silhouette if absent.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderAuthorAvatar(record){
  const url=record?.avatarUrl;
  const safe=typeof url==='string'&&/^\/api\/v1\/member-avatars\/[0-9a-f-]{36}$/i.test(url);
  return '<div class="comos-post-avatar" aria-hidden="true"><svg class="comos-avatar-default" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M4.6 20v-2.2a7.4 7.4 0 0 1 14.8 0V20"/></svg>'+ (safe?'<img loading="lazy" decoding="async" src="'+esc(url)+'" alt="">':'')+'</div>';
}
