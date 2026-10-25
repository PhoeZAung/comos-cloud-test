export default {
  id:'compose',title:'New post · Comos',bodyClass:'app',layout:'app',activeMain:'home',section:null,
  description:'Publish a new Comos post. Only verified admins can publish.',
  content:`<section class="comos-composer" data-compose><a class="back" href="home.html" data-compose-return>← Home</a>
    <h1>New post</h1><form data-compose-form>
      <label for="post-title">Title (optional)</label>
      <input id="post-title" name="title" maxlength="140" placeholder="Give your post a title" autocomplete="off">
      <label for="post-message">Description</label>
      <textarea id="post-message" name="text" required maxlength="2000" rows="7" placeholder="What would you like to share?"></textarea>
      <p class="comos-count" data-compose-count>0 / 2000</p>
      <p class="comos-compose-audience">Everyone on Comos can read and reply to this post.</p>
      <p role="status" aria-live="polite" data-compose-status>Checking posting permission…</p>
      <button class="button primary" type="submit" data-compose-submit disabled>Publish post</button>
    </form></section>`,
};