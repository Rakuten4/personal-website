document.addEventListener('DOMContentLoaded', function(){
  // set current year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // mobile nav toggle
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  if(toggle && nav){
    toggle.addEventListener('click', ()=>{
      if(nav.style.display === 'flex') nav.style.display = '';
      else nav.style.display = 'flex';
    });
  }

  // simple scroll reveal
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(e => {
      if(e.isIntersecting) e.target.classList.add('reveal');
    });
  },{threshold:0.12});
  document.querySelectorAll('.card, .feature, .plan, .testimonial, .stat').forEach(el=>observer.observe(el));

  // contact form handling (demo only, no network calls)
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const clearBtn = document.getElementById('clear');
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      form.reset();
      status.textContent = '';
    });
  }
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name');
      const email = data.get('email');
      const message = data.get('message');
      if(!name || !email || !message){
        status.textContent = 'Please fill required fields.';
        return;
      }
      status.textContent = 'Sending…';
      // simulate async send
      setTimeout(()=>{
        status.textContent = 'Thanks! Your message has been received. We will get back to you soon.';
        form.reset();
      }, 900);
    });
  }

  // Auth modal behavior
  const authModal = document.getElementById('auth-modal');
  const openLogin = document.getElementById('open-login');
  const openSignup = document.getElementById('open-signup');
  const modalClose = authModal && authModal.querySelector('.modal-close');
  const tabs = document.querySelectorAll('.auth-tabs .tab');
  const forms = document.querySelectorAll('.auth-form');

  function openAuth(tab){
    if(!authModal) return;
    authModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    // show requested tab
    tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
    forms.forEach(f=>f.classList.toggle('hidden', f.dataset.form!==tab));
    // focus first input
    const first = authModal.querySelector('.auth-form:not(.hidden) input');
    if(first) first.focus();
  }
  function closeAuth(){
    if(!authModal) return;
    authModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  if(openLogin) openLogin.addEventListener('click', ()=>openAuth('login'));
  if(openSignup) openSignup.addEventListener('click', ()=>openAuth('signup'));
  if(modalClose) modalClose.addEventListener('click', closeAuth);

  // click outside to close
  if(authModal){
    authModal.addEventListener('click', (e)=>{
      if(e.target === authModal) closeAuth();
    });
  }

  // tab switching
  tabs.forEach(t=>t.addEventListener('click', ()=>{
    const tab = t.dataset.tab;
    tabs.forEach(x=>x.classList.toggle('active', x===t));
    forms.forEach(f=>f.classList.toggle('hidden', f.dataset.form!==tab));
    const first = authModal.querySelector('.auth-form:not(.hidden) input');
    if(first) first.focus();
  }));

  // Preload AC image and toggle background for auth-left when login tab is active
  (function(){
    const authLeft = document.querySelector('.auth-left');
    if(!authLeft) return;
    const acSrc = 'images/ac con 2.webp';
    const img = new Image();
    img.src = acSrc;
    img.onload = ()=>{
      // set as inline style background-image (so CSS rules apply)
      authLeft.style.backgroundImage = `url('${acSrc.replace(/'/g,"\\'")}')`;
      // when opening auth, ensure we only show bg for login tab
      function updateBg(){
        const activeTab = Array.from(tabs).find(x=>x.classList.contains('active'));
        if(activeTab && activeTab.dataset.tab === 'login') authLeft.classList.add('login-bg');
        else authLeft.classList.remove('login-bg');
      }
      // initial
      updateBg();
      // react to tab clicks
      tabs.forEach(t=>t.addEventListener('click', ()=>{ setTimeout(updateBg, 0); }));
      // when opening modal via buttons
      if(openLogin) openLogin.addEventListener('click', ()=> setTimeout(updateBg, 0));
      if(openSignup) openSignup.addEventListener('click', ()=> setTimeout(updateBg, 0));
      // when closing modal remove class
      if(modalClose) modalClose.addEventListener('click', ()=> authLeft.classList.remove('login-bg'));
      if(authModal) authModal.addEventListener('click', (e)=>{ if(e.target===authModal) authLeft.classList.remove('login-bg'); });
      // also remove when ESC closes modal
      window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') authLeft.classList.remove('login-bg'); });
    };
  })();

  // show/hide password
  document.querySelectorAll('.show-pass').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = btn.parentElement.querySelector('input');
      if(!input) return;
      if(input.type === 'password'){ input.type = 'text'; btn.textContent = '🙈'; }
      else { input.type = 'password'; btn.textContent = '👁️'; }
    });
  });

  // basic auth form simulation
  // real auth: call backend API (register/login)
  const API_BASE = location.hostname === 'localhost' ? 'http://localhost:4000' : '';
  function saveToken(token){ localStorage.setItem('adetop_token', token); }
  function getToken(){ return localStorage.getItem('adetop_token'); }
  function clearToken(){ localStorage.removeItem('adetop_token'); }

  async function api(path, body){
    const res = await fetch(API_BASE + path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    return res.json();
  }

  async function handleAuthSubmit(f){
    const btn = f.querySelector('button[type="submit"]');
    const formData = new FormData(f);
    const data = {};
    for(const [k,v] of formData.entries()) data[k]=v;
    // basic validation
    for(const k of Object.keys(data)){ if(!data[k]){ alert('Please fill all required fields.'); return; } }
    btn.disabled = true; const original = btn.textContent; btn.textContent = 'Processing…';
    try{
      if(f.dataset.form === 'signup'){
        const resp = await api('/api/register', data);
        if(resp.error) throw new Error(resp.error);
        saveToken(resp.token);
        updateAuthUI(resp.user);
      }else{
        const resp = await api('/api/login', data);
        if(resp.error) throw new Error(resp.error);
        saveToken(resp.token);
        updateAuthUI(resp.user);
      }
      closeAuth();
    }catch(err){ alert('Auth error: ' + (err.message||err)); }
    btn.disabled=false; btn.textContent = original;
  }

  document.querySelectorAll('.auth-form').forEach(f=>{
    f.addEventListener('submit', (e)=>{ e.preventDefault(); handleAuthSubmit(f); });
  });

  // show logged-in state
  const headerActions = document.querySelector('.header-actions');
  function updateAuthUI(user){
    if(!headerActions) return;
    headerActions.innerHTML = '';
    if(user){
      const el = document.createElement('div'); el.className='user-chip'; el.textContent = user.name || user.email;
      const out = document.createElement('button'); out.className='btn'; out.textContent='Sign out';
      out.addEventListener('click', ()=>{ clearToken(); location.reload(); });
      headerActions.appendChild(el); headerActions.appendChild(out);
    }else{
      const l = document.createElement('button'); l.className='btn'; l.id='open-login'; l.textContent='Login'; l.addEventListener('click', ()=>openAuth('login'));
      const s = document.createElement('button'); s.className='btn primary'; s.id='open-signup'; s.textContent='Sign up'; s.addEventListener('click', ()=>openAuth('signup'));
      headerActions.appendChild(l); headerActions.appendChild(s);
    }
  }

  // try to hydrate user from token
  (async ()=>{
    const t = getToken();
    if(!t){ updateAuthUI(null); return; }
    try{
      const res = await fetch(API_BASE + '/api/me', { headers: { Authorization: 'Bearer ' + t } });
      const data = await res.json();
      if(data && data.user) updateAuthUI(data.user); else updateAuthUI(null);
    }catch(e){ updateAuthUI(null); }
  })();

  // close modal with ESC
  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeAuth();
  });

  // simple focus trap when modal is open
  document.addEventListener('focus', function(e){
    if(authModal && authModal.getAttribute('aria-hidden')==='false' && !authModal.contains(e.target)){
      const first = authModal.querySelector('button, input, [tabindex]:not([tabindex="-1"])');
      if(first) first.focus();
    }
  }, true);

  // Hero background slideshow (for live refrigeration photos)
  (function(){
    const slideshow = document.querySelector('.hero-slideshow');
    if(!slideshow) return;

    // images to rotate — replace/add fridge1.jpg, fridge2.jpg etc in images/ folder
    const candidates = ['images/fridge1.jpg','images/fridge2.jpg','images/fridge3.jpg','images/office-illustration.png','images/logo.png'];

    // test which files exist by attempting to preload and keep those that load
    function preload(src){
      return new Promise((resolve)=>{
        const img = new Image(); img.src = src;
        img.onload = ()=>resolve(src);
        img.onerror = ()=>resolve(null);
      });
    }

    (async ()=>{
      const results = await Promise.all(candidates.map(preload));
      const images = results.filter(Boolean);
      if(images.length===0) return;

      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(prefersReduced){
        // show the first image statically
        slideshow.style.backgroundImage = `url('${images[0]}')`;
        slideshow.classList.add('visible');
        return;
      }

      let idx = 0;
      slideshow.style.backgroundImage = `url('${images[0]}')`;
      slideshow.classList.add('visible');

      setInterval(()=>{
        idx = (idx + 1) % images.length;
        // crossfade by toggling opacity class on a tiny timeout to allow transition
        const next = images[idx];
        const temp = document.createElement('div');
        temp.className = 'hero-slideshow temp';
        temp.style.backgroundImage = `url('${next}')`;
        temp.style.position = 'absolute'; temp.style.inset = '0'; temp.style.zIndex = '1'; temp.style.opacity = '0'; temp.style.transition = 'opacity 1s ease';
        slideshow.parentElement.insertBefore(temp, slideshow);
        // force reflow then show
        void temp.offsetWidth;
        temp.style.opacity = '1';
        setTimeout(()=>{
          slideshow.style.backgroundImage = `url('${next}')`;
          temp.remove();
        }, 900);
      }, 5000);
    })();
  })();
});
