export default {
  id:'compose',title:'New post · Comos',bodyClass:'app',layout:'app',activeMain:'home',section:null,
  description:'Write a post to your Comos world or party.',
  content:`<section class="comos-composer" data-compose><a class="back" href="home.html" data-compose-return>← Home</a>
    <h1>New post</h1><form data-compose-form>
      <label for="post-message">Your post</label>
      <textarea id="post-message" name="text" required maxlength="2000" rows="7" placeholder="What’s happening?"></textarea>
      <p class="comos-count" data-compose-count>0 / 2000</p>
      <div data-compose-scopes hidden><label for="post-world">World</label><select id="post-world" name="worldId" required></select>
      <label for="post-party">Party (optional)</label><select id="post-party" name="partyId"></select></div>
      <p role="status" data-compose-status></p>
      <button class="button primary" type="submit" data-compose-submit disabled>Post</button>
    </form></section>`,
};