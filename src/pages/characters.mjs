export default {
  id:'characters',title:'Characters · Cosmos',bodyClass:'app',layout:'app',activeMain:'characters',section:null,
  description:'Your characters in Cosmos.',
  content:`<section class="page-heading"><div class="heading-row"><div><h1>Characters</h1></div><div class="actions"><button class="button primary" type="button" data-character-create-open>+ Create character</button><a class="button" data-admin-entry href="admin.html">Admin panel</a></div></div></section><section data-character-cards aria-label="Your characters"><p role="status">Loading characters…</p></section>
    <dialog class="character-create-dialog" data-character-create-dialog aria-labelledby="character-create-title">
      <h2 id="character-create-title">Create a character</h2>
      <p>How would you like to start?</p>
      <div class="character-create-choices">
        <a href="create-identity.html" class="button primary" data-character-create-wizard>Use Wizard</a>
        <button type="button" class="button" data-character-create-manual>Create Manually</button>
      </div>
      <p role="status" aria-live="polite" data-character-create-status></p>
      <form method="dialog"><button class="button" type="submit" data-character-create-cancel>Cancel</button></form>
    </dialog>`
};
