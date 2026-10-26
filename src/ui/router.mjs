export const routeNames = ['index','home','lore','lore-compose','characters','account','admin','admin-items','admin-groups','post','compose','lore-entry','create-source','create-identity','create-race','create-class','signin','signup'];
export function routeId(url, base) {
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
  const file = url.pathname.slice(base.pathname.length);
  const id = file === '' ? 'index' : file.endsWith('.html') ? file.slice(0,-5) : null;
  return routeNames.includes(id) ? id : null;
}
export function createRouter({ afterRender, disposePage }) {
  const base = new URL('../', import.meta.url);
  const main = document.querySelector('main');
  const header = document.querySelector('header');
  const positions = new Map();
  let sequence=0;
  history.replaceState({...history.state, comos:true, scrollY:window.scrollY},'');
  history.scrollRestoration='manual';
  function remember() {
    positions.set(location.pathname+location.search,window.scrollY);
    history.replaceState({...history.state,scrollY:window.scrollY},'');
  }
  async function navigate(url, {pop=false,state=null}={}) {
    const id=routeId(url,base);
    if(!id || document.body.dataset.layout==='sheet') { location.assign(url.href); return; }
    if(document.body.dataset.mode==='fixture' && ['signin','signup'].includes(id)) { location.assign(url.href); return; }
    const ticket=++sequence;
    main.setAttribute('aria-busy','true');
    try {
      // Only the selected view is imported. The browser reuses loaded modules.
      const {default:view}=await import(new URL('routes/'+id+'.mjs',import.meta.url));
      if(ticket!==sequence)return;
      if(!pop)remember();
      disposePage();
      if(!pop)history.pushState({comos:true,scrollY:positions.get(url.pathname+url.search)||0},'',url.href);
      document.body.className=view.bodyClass;
      document.body.dataset.page=view.id; document.body.dataset.layout=view.layout;
      // Keep the header node and app navigation links mounted between app tabs.
      if(header.dataset.layout !== view.layout) {
        const template=document.createElement('template');template.innerHTML=view.header;
        header.replaceChildren(...template.content.firstElementChild.childNodes);
        header.dataset.layout=view.layout;
      }
      const active=['create-source','create-identity','create-race','create-class'].includes(id)?'characters':id;
      for(const a of header.querySelectorAll('.main-nav a, .public-nav a')) {
        if(a.getAttribute('href')===active+'.html')a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
      }
      main.innerHTML=view.main; document.title=view.title;
      const description=document.querySelector('meta[name="description"]');description?.remove();
      main.removeAttribute('aria-busy');main.focus({preventScroll:true});
      const y=pop?(state?.scrollY||0):(positions.get(url.pathname+url.search)||0);
      window.scrollTo(0,y);
      document.querySelector('[data-route-status]').textContent=view.title;
      await afterRender();
    } catch {
      if(ticket===sequence)location.assign(url.href);
    }
  }
  header.dataset.layout=document.body.dataset.layout;
  const saveScroll=()=>{positions.set(location.pathname+location.search,window.scrollY);};
  window.addEventListener('scroll',saveScroll,{passive:true});
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const a=event.target.closest('a[href]');
    if(!a||a.target||a.hasAttribute('download')||a.getAttribute('href').startsWith('#'))return;
    const url=new URL(a.href); if(!routeId(url,base)||url.hash)return;
    if(document.body.dataset.layout==='sheet')return;
    event.preventDefault();
    if(url.href===location.href)return;
    void navigate(url);
  });
  window.addEventListener('popstate',event=>void navigate(new URL(location.href),{pop:true,state:event.state}));
  window.addEventListener('pagehide',remember);
  return {navigate};
}
