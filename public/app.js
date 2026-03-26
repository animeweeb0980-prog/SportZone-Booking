var currentUser = null;
var selectedCourtId = null;
var selectedSlot = null;
var emojis = {tennis:'🎾',pickleball:'🏓',badminton:'🏸',football:'⚽',volleyball:'🏐'};
var colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

window.onload = function() {
  document.getElementById('bdate').addEventListener('change', function() {
    loadSlots(this.value);
  });
  try {
    var s = localStorage.getItem('sportzone_user');
    if (s) { currentUser = JSON.parse(s); showApp(); }
  } catch(e) { localStorage.removeItem('sportzone_user'); }
};

function switchTab(t) {
  document.getElementById('tab-login').classList.toggle('active', t === 'login');
  document.getElementById('tab-register').classList.toggle('active', t === 'register');
  document.getElementById('login-form').classList.toggle('hidden', t !== 'login');
  document.getElementById('register-form').classList.toggle('hidden', t !== 'register');
  document.getElementById('login-error').textContent = '';
  document.getElementById('reg-error').textContent = '';
  return false;
}

async function doLogin() {
  var email = document.getElementById('login-email').value.trim();
  var pass = document.getElementById('login-password').value;
  var err = document.getElementById('login-error');
  err.textContent = '';
  if (!email || !pass) { err.textContent = 'Please fill in all fields.'; return; }
  var btn = document.querySelector('#login-form .btn-primary');
  btn.textContent = 'Signing in...'; btn.disabled = true;
  try {
    var res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: pass }) });
    var d = await res.json();
    if (d.success) { currentUser = d.user; localStorage.setItem('sportzone_user', JSON.stringify(currentUser)); showApp(); }
    else { err.textContent = d.error; btn.textContent = 'Sign In'; btn.disabled = false; }
  } catch(e) { err.textContent = 'Connection error.'; btn.textContent = 'Sign In'; btn.disabled = false; }
}

async function doRegister() {
  var name = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var pass = document.getElementById('reg-password').value;
  var err = document.getElementById('reg-error');
  err.textContent = '';
  if (!name || !email || !pass) { err.textContent = 'Please fill in all fields.'; return; }
  if (pass.length < 4) { err.textContent = 'Password must be at least 4 characters.'; return; }
  var btn = document.querySelector('#register-form .btn-primary');
  btn.textContent = 'Creating...'; btn.disabled = true;
  try {
    var res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, email: email, password: pass }) });
    var d = await res.json();
    if (d.success) { currentUser = d.user; localStorage.setItem('sportzone_user', JSON.stringify(currentUser)); showApp(); }
    else { err.textContent = d.error; btn.textContent = 'Create Account'; btn.disabled = false; }
  } catch(e) { err.textContent = 'Connection error.'; btn.textContent = 'Create Account'; btn.disabled = false; }
}

function doLogout() {
  currentUser = null; localStorage.removeItem('sportzone_user');
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function showApp() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('uname').textContent = currentUser.name;
  document.getElementById('uav').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('hero-name').textContent = currentUser.name.split(' ')[0];
  showPage('home', document.querySelector('.nb'));
}

function showPage(name, btn) {
  ['home','courts','bookings','events','leaderboard','locations'].forEach(function(p) {
    document.getElementById('page-' + p).classList.add('hidden');
  });
  document.getElementById('page-' + name).classList.remove('hidden');
  document.querySelectorAll('.nb').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  if (name === 'home') loadHome();
  if (name === 'courts') loadCourts(null);
  if (name === 'bookings') loadBookings();
  if (name === 'events') loadEvents();
  if (name === 'leaderboard') loadLeaderboard('overall', document.querySelector('.lb-tabs .chip'));
  if (name === 'locations') loadLocations();
}

async function loadHome() {
  try {
    var bookings = await fetch('/api/bookings?email=' + currentUser.email).then(function(r) { return r.json(); });
    var stats = document.getElementById('hero-stats');
    var total = bookings.filter(function(b) { return b.status === 'confirmed'; }).length;
    var sports = {};
    bookings.forEach(function(b) { if (b.status === 'confirmed') sports[b.sport] = (sports[b.sport] || 0) + 1; });
    var html = '<div class="stat-card"><span class="stat-num">' + total + '</span><span class="stat-lbl">Sessions</span></div>';
    Object.keys(sports).slice(0,2).forEach(function(s) {
      html += '<div class="stat-card"><span class="stat-num">' + sports[s] + '</span><span class="stat-lbl">' + s + '</span></div>';
    });
    stats.innerHTML = html;
    var events = await fetch('/api/events').then(function(r) { return r.json(); });
    var he = document.getElementById('home-events');
    he.innerHTML = events.slice(0,3).map(function(e) {
      return '<div style="padding:12px;background:#f8f9fa;border-radius:10px;margin-bottom:8px;border:1px solid #e5e7eb"><div style="font-weight:700;font-size:0.9rem;margin-bottom:3px">' + e.title + '</div><div style="font-size:0.78rem;color:#9ca3af">📅 ' + e.event_date + ' &nbsp;·&nbsp; 📍 ' + e.location + '</div></div>';
    }).join('');
  } catch(e) { console.error('loadHome error', e); }
}

function quickBook(sport) {
  showPage('courts', document.querySelectorAll('.nb')[1]);
  setTimeout(function() {
    var chip = document.querySelector('.filter-bar .chip[onclick*="' + sport + '"]');
    if (chip) filterCourt(sport, chip);
  }, 150);
}

async function loadCourts(sport) {
  var url = sport ? '/api/courts?sport=' + sport : '/api/courts';
  var grid = document.getElementById('courts-grid');
  grid.innerHTML = '<p style="padding:40px;text-align:center;color:#9ca3af">Loading courts...</p>';
  try {
    var courts = await fetch(url).then(function(r) { return r.json(); });
    if (!courts.length) { grid.innerHTML = '<p style="padding:40px;text-align:center;color:#9ca3af">No courts found.</p>'; return; }
    var html = '';
    for (var i = 0; i < courts.length; i++) {
      var c = courts[i];
      var emoji = emojis[c.sport] || '🏟️';
      html += '<div class="court-card">';
      html += '<div class="cc-top"><div class="cc-emoji em-' + c.sport + '">' + emoji + '</div><span class="sp-tag st-' + c.sport + '">' + c.sport + '</span></div>';
      html += '<div class="cc-body"><h3>' + c.name + '</h3>';
      html += '<div class="loc">📍 ' + c.location + '</div>';
      html += '<p>' + c.description + '</p>';
      html += '<div class="price-tag">₹' + c.price_per_hour + '/hour</div>';
      html += '<button class="book-btn" data-id="' + c.id + '" data-name="' + c.name + '" data-sport="' + c.sport + '" data-loc="' + c.location + '">Book Now →</button>';
      html += '</div></div>';
    }
    grid.innerHTML = html;
    document.querySelectorAll('.book-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        openModal(this.getAttribute('data-id'), this.getAttribute('data-name'), this.getAttribute('data-sport'), this.getAttribute('data-loc'));
      });
    });
  } catch(e) { grid.innerHTML = '<p style="padding:40px;text-align:center;color:#ef4444">Error loading courts.</p>'; }
}

function filterCourt(sport, btn) {
  document.querySelectorAll('.filter-bar .chip').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  loadCourts(sport === 'all' ? null : sport);
}

function openModal(id, name, sport, loc) {
  selectedCourtId = id;
  selectedSlot = null;
  document.getElementById('modal-sport-emoji').textContent = emojis[sport] || '🏟️';
  document.getElementById('modal-court-name').textContent = name;
  document.getElementById('modal-court-loc').textContent = '📍 ' + loc;
  document.getElementById('bdate').value = '';
  document.getElementById('slots').innerHTML = '<p class="shint">Choose a date to see available time slots</p>';
  document.getElementById('modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.style.overflow = '';
  selectedCourtId = null;
  selectedSlot = null;
}

async function loadSlots(date) {
  if (!date || !selectedCourtId) return;
  document.getElementById('slots').innerHTML = '<p class="shint">Loading available slots...</p>';
  try {
    var res = await fetch('/api/availability?court_id=' + selectedCourtId + '&date=' + date);
    var slots = await res.json();
    var html = '';
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (s.available) {
        html += '<button class="slot-btn" data-time="' + s.time + '">' + s.time + '</button>';
      } else {
        html += '<button class="slot-btn taken" disabled>' + s.time + '</button>';
      }
    }
    document.getElementById('slots').innerHTML = html || '<p class="shint">No slots available for this date.</p>';
    document.querySelectorAll('.slot-btn:not(.taken)').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.slot-btn').forEach(function(b) { b.classList.remove('selected'); });
        this.classList.add('selected');
        selectedSlot = this.getAttribute('data-time');
      });
    });
  } catch(e) {
    document.getElementById('slots').innerHTML = '<p class="shint" style="color:#ef4444">Error loading slots. Please try again.</p>';
    console.error('loadSlots error:', e);
  }
}

async function confirmBooking() {
  var date = document.getElementById('bdate').value;
  if (!date) { alert('Please pick a date first.'); return; }
  if (!selectedSlot) { alert('Please select a time slot.'); return; }
  var btn = document.getElementById('confirm-btn');
  btn.textContent = 'Confirming...'; btn.disabled = true;
  try {
    var res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ court_id: selectedCourtId, user_name: currentUser.name, user_email: currentUser.email, date: date, time_slot: selectedSlot })
    });
    var d = await res.json();
    if (d.success) {
      closeModal();
      document.getElementById('success-msg').textContent = 'Booking #' + d.booking_id + ' confirmed for ' + date + ' at ' + selectedSlot;
      document.getElementById('success-pop').classList.remove('hidden');
    } else { alert(d.error); }
  } catch(e) { alert('Connection error!'); }
  btn.textContent = 'Confirm Booking'; btn.disabled = false;
}

function closeSuccess() { document.getElementById('success-pop').classList.add('hidden'); }

async function loadBookings() {
  var list = document.getElementById('bookings-list');
  list.innerHTML = '<p style="padding:40px;text-align:center;color:#9ca3af">Loading...</p>';
  try {
    var bks = await fetch('/api/bookings?email=' + currentUser.email).then(function(r) { return r.json(); });
    if (!bks.length) { list.innerHTML = '<div class="empty"><span class="empty-ico">📋</span><h3>No bookings yet</h3><p>Book a court to get started!</p></div>'; return; }
    var html = '';
    for (var i = 0; i < bks.length; i++) {
      var b = bks[i];
      var emoji = emojis[b.sport] || '🏟️';
      var cancelBtn = b.status === 'confirmed' ? '<button class="cancel-bk-btn" data-id="' + b.id + '">Cancel</button>' : '';
      html += '<div class="bk-card"><div class="bk-left"><div class="bk-icon">' + emoji + '</div><div><div class="bk-sport">' + b.sport + '</div><h4>' + b.court_name + '</h4><div class="bk-time">📅 ' + b.date + ' &nbsp;·&nbsp; ⏰ ' + b.time_slot + '</div><div class="bk-loc">📍 ' + b.location + '</div></div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px"><span class="status-badge status-' + b.status + '">' + b.status + '</span>' + cancelBtn + '</div></div>';
    }
    list.innerHTML = html;
    document.querySelectorAll('.cancel-bk-btn').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Cancel this booking?')) return;
        await fetch('/api/bookings/' + this.getAttribute('data-id'), { method: 'DELETE' });
        loadBookings();
      });
    });
  } catch(e) { list.innerHTML = '<p style="color:#ef4444;padding:20px">Error loading bookings.</p>'; }
}

async function loadEvents() {
  var list = document.getElementById('events-list');
  list.innerHTML = '<p style="padding:40px;text-align:center;color:#9ca3af">Loading events...</p>';
  try {
    var events = await fetch('/api/events').then(function(r) { return r.json(); });
    if (!events.length) { list.innerHTML = '<div class="empty"><span class="empty-ico">🏆</span><h3>No events yet</h3><p>Check back soon!</p></div>'; return; }
    var html = '';
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      var emoji = emojis[e.sport] || '🏟️';
      var spots = e.max_participants - e.registered_count;
      html += '<div class="ev-card"><div class="ev-top"><div><div class="ev-title">' + emoji + ' ' + e.title + '</div><span class="sp-tag st-' + e.sport + '">' + e.sport + '</span></div><span style="font-size:0.8rem;font-weight:600;color:' + (spots > 0 ? '#16a34a' : '#ef4444') + '">' + (spots > 0 ? spots + ' spots left' : 'Full') + '</span></div><p class="ev-desc">' + e.description + '</p><div class="ev-meta"><span>📅 ' + e.event_date + '</span><span>📍 ' + e.location + '</span><span>👥 ' + e.registered_count + '/' + e.max_participants + '</span></div><div class="ev-foot"><span class="reg-count">' + e.registered_count + ' registered</span>' + (spots > 0 ? '<button class="reg-btn" data-id="' + e.id + '">Register →</button>' : '<button class="reg-btn registered">Full</button>') + '</div></div>';
    }
    list.innerHTML = html;
    document.querySelectorAll('.reg-btn:not(.registered)').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var res = await fetch('/api/events/' + this.getAttribute('data-id') + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_email: currentUser.email, user_name: currentUser.name }) });
        var d = await res.json();
        if (d.success) { alert('Registered successfully!'); loadEvents(); }
        else { alert(d.error); }
      });
    });
  } catch(e) { list.innerHTML = '<p style="color:#ef4444;padding:20px">Error loading events.</p>'; }
}

async function loadLeaderboard(type, btn) {
  if (btn) { document.querySelectorAll('.lb-tabs .chip').forEach(function(b) { b.classList.remove('active'); }); btn.classList.add('active'); }
  var table = document.getElementById('leaderboard-table');
  table.innerHTML = '<p style="padding:40px;text-align:center;color:#9ca3af">Loading...</p>';
  try {
    var url = type === 'overall' ? '/api/leaderboard/overall' : '/api/leaderboard?sport=' + type;
    var leaders = await fetch(url).then(function(r) { return r.json(); });
    if (!leaders.length) { table.innerHTML = '<div class="empty"><span class="empty-ico">🏆</span><h3>No data yet</h3><p>Be the first to play!</p></div>'; return; }
    var medals = ['🥇','🥈','🥉'];
    var html = '<div class="lb-table">';
    for (var i = 0; i < leaders.length; i++) {
      var l = leaders[i];
      var color = colors[i % colors.length];
      html += '<div class="lb-row"><span class="lb-rank">' + (medals[i] || ('#' + (i+1))) + '</span><div class="lb-av" style="background:' + color + '">' + l.user_name.charAt(0).toUpperCase() + '</div><div style="flex:1"><div class="lb-name">' + l.user_name + '</div><div class="lb-email">' + l.user_email + '</div></div><div class="lb-score">' + l.total_sessions + '<span>sessions</span></div></div>';
    }
    html += '</div>';
    table.innerHTML = html;
  } catch(e) { table.innerHTML = '<p style="color:#ef4444;padding:20px">Error loading leaderboard.</p>'; }
}

function loadLocations() {
  var locations = [
    { icon:'🏟️', name:'Sports Complex', desc:'Main sports hub with Tennis and Badminton courts.', sports:['Tennis','Badminton'], address:'Block A & B, Main Road' },
    { icon:'🎯', name:'Recreation Center', desc:'Dedicated facility for Pickleball.', sports:['Pickleball'], address:'Recreation Park, Sector 4' },
    { icon:'⚽', name:'Turf Ground', desc:'Premium artificial and natural turf football fields.', sports:['Football'], address:'Turf Ground, Sector 1 & 2' },
    { icon:'🏠', name:'Indoor Stadium', desc:'Climate-controlled indoor courts.', sports:['Badminton'], address:'Indoor Stadium, Hall 1 & 2' },
    { icon:'🌊', name:'Outdoor Arena', desc:'Beach volleyball and outdoor sports.', sports:['Volleyball'], address:'Outdoor Arena, Beach Road' },
    { icon:'🏃', name:'Sports Hall', desc:'Indoor volleyball and multi-sport facility.', sports:['Volleyball'], address:'Sports Hall, Ground Floor' }
  ];
  document.getElementById('locations-grid').innerHTML = locations.map(function(l) {
    return '<div class="loc-card"><div class="loc-icon">' + l.icon + '</div><h3>' + l.name + '</h3><p>' + l.desc + '</p><p style="font-size:0.78rem;color:#9ca3af;margin-bottom:10px">📍 ' + l.address + '</p><div class="loc-tags">' + l.sports.map(function(s) { return '<span class="loc-tag">' + s + '</span>'; }).join('') + '</div></div>';
  }).join('');
}
