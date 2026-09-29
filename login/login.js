/* Nila Inn Residency — login page
   Logs in or creates an account through /api/auth. The server keeps the session in an httpOnly cookie,
   so nothing is stored in the browser here. */

(function(){
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var mode = 'login';

  function $(id){ return document.getElementById(id); }
  function msg(m){ $('msg').textContent = m || ''; }

  function setMode(m){
    mode = m;
    var reg = m === 'register';
    $('w-name').hidden = !reg;
    $('passHint').hidden = !reg;
    $('f-pass').setAttribute('autocomplete', reg ? 'new-password' : 'current-password');
    $('bSubmit').textContent = reg ? 'Create account' : 'Log in';
    document.querySelectorAll('#tabs [data-mode]').forEach(function(b){ b.setAttribute('aria-selected', b.getAttribute('data-mode') === m ? 'true' : 'false'); });
    msg('');
    (reg ? $('f-name') : $('f-email')).focus();
  }
  $('tabs').addEventListener('click', function(e){ var b = e.target.closest('[data-mode]'); if(b) setMode(b.getAttribute('data-mode')); });

  /* offer "Create account" only while the server allows new sign-ups */
  fetch('/api/auth/config').then(function(r){ return r.json(); }).then(function(c){ $('tabs').hidden = !c.signup; }).catch(function(){});

  function check(d){
    if(mode === 'register' && !d.name) return 'Enter your name.';
    if(!EMAIL.test(d.email)) return 'Enter a valid email address.';
    if(!d.password) return 'Enter your password.';
    if(mode === 'register' && d.password.length < 8) return 'Password must be at least 8 characters.';
    return '';
  }

  $('form').addEventListener('submit', function(e){
    e.preventDefault();
    var d = { email:$('f-email').value.trim(), password:$('f-pass').value };
    if(mode === 'register') d.name = $('f-name').value.trim();
    var err = check(d);
    if(err){ msg(err); return; }

    var btn = $('bSubmit'), label = btn.textContent;
    btn.disabled = true; btn.textContent = mode === 'register' ? 'Creating account…' : 'Logging in…'; msg('');

    fetch('/api/auth/' + mode, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(d) })
      .then(function(r){
        return r.json().catch(function(){ return {}; }).then(function(body){
          if(!r.ok) throw new Error(body.error || 'Something went wrong. Please try again.');
        });
      })
      .then(function(){ location.replace('/'); })
      .catch(function(e){
        // fetch itself rejects with a TypeError when the server cannot be reached
        msg(e instanceof TypeError ? 'Cannot reach the server. Check your connection and try again.' : e.message);
        btn.disabled = false; btn.textContent = label;
      });
  });
})();
