(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const config = window.SHIMORA_STUDENTS || {};
  const sessionKey = 'shimora.student.session';
  let session = null, student = null, questions = [], teacher = false, email = '';
  let generation = 0;
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(config.url || '') && Boolean(config.publishableKey);
  function message(id, text, error = false) { const el = $(id); el.textContent = text; el.classList.toggle('error', error); }
  function clearSession() {
    generation++;
    session = null; student = null; questions = []; teacher = false;
    try { sessionStorage.removeItem(sessionKey); } catch {}
    $('#dashboard-view').hidden = true; $('#login-view').hidden = false; $('#teacher-view').hidden = true;
    $('#query-list').replaceChildren(); $('#teacher-list').replaceChildren();
    $('#profile-form').reset(); $('#query-form').reset(); $('#code-form').reset();
    $('#code-form').hidden = true; $('#email-form').hidden = false;
  }
  async function request(path, { method = 'GET', body, auth = true, prefer } = {}) {
    if (!configured) throw new Error('Student sign-in is being set up. Please contact SHIMORA for help.');
    if (auth && !session) throw new Error('Please sign in to continue.');
    let response;
    try {
      response = await fetch(config.url.replace(/\/$/, '') + path, {
        method, headers: { apikey: config.publishableKey, 'Content-Type': 'application/json',
          ...(auth ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(prefer ? { Prefer: prefer } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000)
      });
    } catch { throw new Error('Unable to connect. Check your connection and try again.'); }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (auth && response.status === 401) { clearSession(); message('#login-message', 'Your session has expired. Please sign in again.'); }
      if (response.status === 429) throw new Error('Too many attempts. Please wait a little before trying again.');
      if (!auth) throw new Error(path.includes('/verify') ? 'That code is invalid or expired. Please request a new code.' : 'Unable to send a code. Check your email address or contact SHIMORA for account access.');
      throw new Error('We couldn’t complete that request. Please try again or contact SHIMORA.');
    }
    return data;
  }
  function run(form, status, action) {
    form.addEventListener('submit', async event => {
      event.preventDefault(); const button = form.querySelector('button[type="submit"]');
      if (button.disabled) return;
      button.disabled = true; message(status, 'Please wait…');
      try { await action(new FormData(form)); } catch (error) { message(status, error.message, true); }
      finally { button.disabled = false; }
    });
  }
  function textElement(tag, text, className) { const el = document.createElement(tag); el.textContent = text; if (className) el.className = className; return el; }
  function date(value) { return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
  function questionCard(question, forTeacher = false) {
    const card = textElement('article', '', 'question');
    const meta = textElement('div', '', 'question-meta');
    meta.append(textElement('span', `${question.category} · ${date(question.created_at)}`), textElement('span', question.answer ? 'Answered' : 'Waiting for reply', `badge${question.answer ? ' answered' : ''}`));
    card.append(meta, textElement('h3', question.subject), textElement('p', question.body));
    if (forTeacher) card.append(textElement('p', `From: ${question.student_name || 'Student'} · ${question.student_email || question.student_id}`, 'small'));
    if (question.answer) {
      const reply = textElement('div', '', 'reply'); reply.append(textElement('strong', 'Your teacher’s reply'), textElement('p', question.answer));
      if (question.answered_at) reply.append(textElement('p', date(question.answered_at), 'small'));
      card.append(reply);
    }
    if (forTeacher) {
      const form = document.createElement('form');
      const label = textElement('label', question.answer ? 'Update reply' : 'Reply to this student');
      const area = document.createElement('textarea'); area.name = 'answer'; area.required = true; area.maxLength = 3000; area.rows = 3; area.value = question.answer || '';
      label.append(area); const button = textElement('button', 'Send reply', 'button button-dark'); button.type = 'submit';
      const status = textElement('p', '', 'message'); status.setAttribute('role', 'status');
      form.append(label, button, status);
      form.addEventListener('submit', async event => {
        event.preventDefault(); if (button.disabled) return;
        if (!area.value.trim()) { status.textContent = 'Please enter a reply.'; return; }
        button.disabled = true; status.textContent = 'Sending…';
        try {
          await request('/rest/v1/rpc/reply_to_student_query', { method: 'POST', body: { query_id: question.id, reply_text: area.value.trim() } });
          status.textContent = 'Reply sent.';
          await loadDashboard();
        } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
      });
      card.append(form);
    }
    return card;
  }
  function renderQuestions() {
    const filter = $('#query-filter').value;
    const filtered = questions.filter(q => filter === 'all' || (filter === 'answered' ? Boolean(q.answer) : !q.answer));
    $('#query-list').replaceChildren(...(filtered.length ? filtered.map(q => questionCard(q)) : [textElement('p', questions.length ? 'No questions match this filter.' : 'No questions yet. Send your first question using the box above.', 'empty-state')]));
    $('#waiting-count').textContent = questions.filter(q => !q.answer).length;
    $('#answered-count').textContent = questions.filter(q => q.answer).length;
  }
  async function loadDashboard() {
    const current = generation;
    const [profiles, enrolments, ownQuestions, roles] = await Promise.all([
      request(`/rest/v1/student_profiles?id=eq.${student.id}&select=display_name,goal`),
      request(`/rest/v1/student_enrolments?student_id=eq.${student.id}&select=programme,schedule`),
      request(`/rest/v1/student_queries?student_id=eq.${student.id}&select=*&order=created_at.desc`),
      request('/rest/v1/student_teachers?select=user_id')
    ]);
    if (current !== generation) return;
    const profile = profiles[0] || {}, enrolment = enrolments[0];
    teacher = roles.some(role => role.user_id === student.id);
    $('#greeting').textContent = profile.display_name ? `Welcome back, ${profile.display_name}.` : 'Welcome to your dashboard.';
    $('#profile-email').textContent = student.email;
    $('#profile-form').elements.display_name.value = profile.display_name || '';
    $('#profile-form').elements.goal.value = profile.goal || '';
    $('#programme').textContent = enrolment?.programme || 'Not assigned yet';
    $('#class-note').textContent = enrolment?.schedule || 'Your teacher will add your class details here.';
    questions = ownQuestions; renderQuestions();
    $('#teacher-view').hidden = !teacher;
    if (teacher) {
      const all = await request('/rest/v1/rpc/teacher_query_inbox', { method: 'POST', body: {} });
      if (current !== generation) return;
      $('#teacher-list').replaceChildren(...(all.length ? all.map(q => questionCard(q, true)) : [textElement('p', 'No student questions yet.', 'empty-state')]));
    }
  }
  async function openDashboard() {
    const user = await request('/auth/v1/user'); student = user;
    $('#login-view').hidden = true; $('#dashboard-view').hidden = false;
    message('#dashboard-message', 'Loading your dashboard…');
    try { await loadDashboard(); message('#dashboard-message', ''); }
    catch (error) { message('#dashboard-message', `${error.message} Use Refresh to try again.`, true); }
  }
  run($('#email-form'), '#login-message', async data => {
    email = data.get('email').trim();
    await request('/auth/v1/otp', { method: 'POST', auth: false, body: { email, create_user: false } });
    $('#email-form').hidden = true; $('#code-form').hidden = false;
    message('#login-message', `If an account exists for ${email}, a code is on its way. Check your inbox and spam folder.`);
    $('#code-form input').focus();
  });
  run($('#code-form'), '#login-message', async data => {
    session = await request('/auth/v1/verify', { method: 'POST', auth: false, body: { email, token: data.get('code').trim(), type: 'email' } });
    if (!session?.access_token) { clearSession(); throw new Error('Sign-in could not be completed. Please request another code.'); }
    // Only a short-lived authentication credential is stored, never student records.
    session = { access_token: session.access_token, expires_at: Math.floor(Date.now() / 1000) + (session.expires_in || 3600) };
    try { sessionStorage.setItem(sessionKey, JSON.stringify(session)); } catch {}
    await openDashboard(); $('#code-form').reset(); message('#login-message', '');
  });
  $('#change-email').addEventListener('click', () => { $('#code-form').hidden = true; $('#email-form').hidden = false; $('#code-form').reset(); message('#login-message', ''); $('#email-form input').focus(); });
  $('#signout').addEventListener('click', async () => {
    const logout = request('/auth/v1/logout', { method: 'POST' }).catch(() => {});
    clearSession(); message('#login-message', 'You’ve signed out on this device.'); await logout;
  });
  run($('#profile-form'), '#profile-message', async data => {
    const display_name = data.get('display_name').trim(); if (!display_name) throw new Error('Please enter your name.');
    await request('/rest/v1/student_profiles?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates', body: { id: student.id, display_name, goal: data.get('goal').trim() } });
    $('#greeting').textContent = `Welcome back, ${display_name}.`; message('#profile-message', 'Your profile is saved.');
  });
  run($('#query-form'), '#query-message', async data => {
    const subject = data.get('subject').trim(), body = data.get('body').trim();
    if (subject.length < 3 || body.length < 10) throw new Error('Please add a subject and a question of at least 10 characters.');
    const submitted = await request('/rest/v1/student_queries', { method: 'POST', prefer: 'return=representation', body: { student_id: student.id, category: data.get('category'), subject, body } });
    questions.unshift(submitted[0]); $('#query-filter').value = 'all'; renderQuestions(); $('#query-form').reset(); message('#query-message', 'Question sent. Your teacher’s reply will appear below.');
  });
  $('#query-filter').addEventListener('change', renderQuestions);
  $('#refresh').addEventListener('click', async () => {
    $('#refresh').disabled = true; message('#dashboard-message', 'Refreshing…');
    try { await loadDashboard(); message('#dashboard-message', 'You’re up to date.'); } catch (error) { message('#dashboard-message', error.message, true); }
    finally { $('#refresh').disabled = false; }
  });
  if (!configured) { $('#email-form button').disabled = true; message('#login-message', 'Student sign-in is being set up. Please contact SHIMORA for access.'); }
  else {
    try { session = JSON.parse(sessionStorage.getItem(sessionKey)); } catch {}
    if (session?.access_token && session.expires_at > Date.now() / 1000) openDashboard().catch(() => { clearSession(); message('#login-message', 'Please sign in again to open your dashboard.'); });
    else clearSession();
  }
})();
