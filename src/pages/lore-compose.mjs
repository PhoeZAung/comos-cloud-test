export default {
 id:'lore-compose',title:'New Lore · Comos',bodyClass:'app',layout:'app',activeMain:'lore',section:null,
 description:'Publish Lore with a title, description, and your character tags.',
 content:`<section class="comos-composer comos-lore-composer" data-lore-compose>
  <a class="back" href="lore.html">← Lore</a>
  <h1>New Lore</h1>
  <form data-lore-compose-form>
    <label for="lore-title">Title</label>
    <input id="lore-title" name="title" required maxlength="140" placeholder="Give your Lore a title" autocomplete="off">
    <label for="lore-description">Description</label>
    <textarea id="lore-description" name="text" required maxlength="10000" rows="9" placeholder="Write your Lore…"></textarea>
    <p class="comos-count" data-lore-count>0 / 10000</p>
    <div class="comos-lore-compose-tags">
      <label for="lore-tag-select">Tags <small>optional</small></label>
      <div class="comos-lore-selected-tags" data-lore-selected-tags></div>
      <div class="comos-lore-tag-picker">
        <select id="lore-tag-select" data-lore-tag-select disabled><option value="">Loading character tags…</option></select>
        <button type="button" class="button" data-lore-tag-add disabled>Add tag</button>
      </div>
      <small data-lore-tag-hint>Only tags on your characters can be added.</small>
    </div>
    <p role="status" aria-live="polite" data-lore-compose-status>Checking account…</p>
    <button class="button primary" type="submit" data-lore-publish disabled>Publish Lore</button>
  </form>
 </section>`
};
