export default {
  id:'compose',title:'New post · Comos',bodyClass:'app',layout:'app',activeMain:'home',section:null,
  description:'Publish a new Comos post. Only verified admins can publish.',
  content:`<section class="comos-composer" data-compose><a class="back" href="home.html" data-compose-return>← Home</a>
    <h1>New post</h1><form data-compose-form>
      <label for="post-title">Title</label>
      <input id="post-title" name="title" required maxlength="140" placeholder="Give your post a title" autocomplete="off">
      <label for="post-message">Description</label>
      <textarea id="post-message" name="text" required maxlength="2000" rows="7" placeholder="What would you like to share?"></textarea>
      <div class="post-tools"><label class="button">Images<input type="file" data-post-images accept="image/jpeg,image/png,image/webp" multiple hidden></label><label class="button">GIF<input type="file" data-post-gif accept="image/gif" hidden></label><button class="button" type="button" data-emoji>☺ Emoji</button></div><div data-emoji-picker hidden></div><div class="post-attachments" data-attachments></div><p class="comos-count" data-compose-count>0 / 2000</p>
      <p class="comos-compose-audience">Everyone on Comos can read and reply to this post.</p>
      <p role="status" aria-live="polite" data-compose-status>Checking posting permission…</p>
      <button class="button primary" type="submit" data-compose-submit disabled>Publish post</button>
    </form></section>`,
};
