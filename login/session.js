/* Nila Inn Residency — session on the invoice page
   Shows who is signed in (Settings → Account), handles Log out, and sends the user
   back to /login when the session has expired. */

(function(){
  function $(id){ return document.getElementById(id); }
  function toLogin(){ location.replace('/login'); }

  function check(){
    fetch('/api/auth/me', { cache:'no-store' })
      .then(function(r){
        if(r.status === 401) return toLogin();
        return r.json().then(function(d){
          if(!d.user) return;
          $('userName').textContent = d.user.name;
          $('userEmail').textContent = d.user.email;
        });
      })
      .catch(function(){ /* offline: keep working; the server checks again on the next page load */ });
  }

  $('bLogout').addEventListener('click', function(){
    this.disabled = true;
    fetch('/api/auth/logout', { method:'POST' }).catch(function(){}).then(toLogin);
  });

  /* the Back button can restore this page from memory after logging out */
  addEventListener('pageshow', function(e){ if(e.persisted) check(); });
  check();
})();
