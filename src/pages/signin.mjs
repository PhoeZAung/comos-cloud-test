import { authContent } from '../auth/forms.mjs';
export default { id: 'signin', title: 'Sign in · Comos', bodyClass: 'public auth-page', layout: 'public', activeMain: 'signin', section: null, description: '', auth: true, content: authContent('signin') };
