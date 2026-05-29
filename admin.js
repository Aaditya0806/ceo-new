/* ================================================================
   CEO HR Consultancy — Admin (Content Manager)
   ----------------------------------------------------------------
   Auto-renders editable forms for every page from DEFAULT_CONTENT.
   Persists everything in a single JSONB column in Supabase, so
   site visitors see updates within ~1-2 seconds via realtime.
   ================================================================ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/+esm';

const cfg = window.CMS_CONFIG || {};
const TABLE  = cfg.CONTENT_TABLE   || 'site_content';
const ROW_ID = cfg.CONTENT_ROW_ID  || 1;
const BUCKET = cfg.STORAGE_BUCKET  || 'uploads';
const ALLOW  = (cfg.ALLOWED_ADMIN_EMAILS || []).map(e => e.toLowerCase());

const isConfigured =
  cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  cfg.SUPABASE_URL.indexOf('YOUR_PROJECT_ID') === -1 &&
  cfg.SUPABASE_ANON_KEY.indexOf('YOUR_ANON_KEY') === -1;

let supa = null;
if (isConfigured) {
  supa = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}

/* ----------------------------------------------------------------
   Page registry — drives the sidebar & determines which page-keys
   exist in DEFAULT_CONTENT.pages. New pages added to DEFAULT_CONTENT
   that aren't listed here will still appear (under "Other Pages")
   so nothing is silently lost.
   ---------------------------------------------------------------- */
const PAGES = [
  // Top level
  { key: 'home',                     label: 'Home',                          group: 'Top-Level' },
  { key: 'about',                    label: 'About Us',                       group: 'Top-Level' },
  { key: 'industries',               label: 'Industries We Serve',            group: 'Top-Level' },
  { key: 'why_choose_us',            label: 'Why Choose Us',                  group: 'Top-Level' },
  { key: 'team',                     label: 'Our Team',                       group: 'Top-Level' },
  { key: 'testimonial',              label: 'Client & Testimonials',          group: 'Top-Level' },
  { key: 'faq',                      label: 'FAQs',                           group: 'Top-Level' },
  { key: 'contact',                  label: 'Contact',                        group: 'Top-Level' },
  { key: 'service',                  label: 'Services Overview',              group: 'Top-Level' },
  { key: 'free_tool',                label: 'Free Tools',                     group: 'Top-Level' },
  { key: 'hpt_resources_index',      label: 'HPT Resources Index',            group: 'Top-Level' },
  { key: 'privacy_terms',            label: 'Privacy Policy & Terms',         group: 'Top-Level' },

  // Services
  { key: 'service_high_performance_team',  label: 'HPT / Self-Managed Teams',   group: 'Services' },
  { key: 'service_recruitment',            label: 'Recruitment Services',       group: 'Services' },
  { key: 'service_bulk_hiring',            label: 'Bulk Hiring Services',       group: 'Services' },
  { key: 'service_bulk_assessment',        label: 'Bulk Assessment Services',   group: 'Services' },
  { key: 'service_outsourced_hr_msme',     label: 'Outsourced HR for MSMEs',    group: 'Services' },
  { key: 'service_operational_excellence', label: 'Operational Excellence',     group: 'Services' },
  { key: 'service_workplace_insights',     label: 'Workplace Insights',         group: 'Services' },
  { key: 'service_learning_solution',      label: 'Learning Solutions',         group: 'Services' },
  { key: 'service_skill_development',      label: 'Skill Development',          group: 'Services' },
  { key: 'service_er_score_card',          label: 'ER Score Card',              group: 'Services' },
  { key: 'service_accounting',             label: 'Accounting Services',        group: 'Services' },

  // HPT Resources
  { key: 'hpt_what_is',                    label: 'What is HPT',                group: 'HPT Resources' },
  { key: 'hpt_history',                    label: 'History of HPT',             group: 'HPT Resources' },
  { key: 'hpt_principles',                 label: 'HPT Principles',             group: 'HPT Resources' },
  { key: 'hpt_workforce_planning',         label: 'Workforce Planning',         group: 'HPT Resources' },
  { key: 'hpt_org_structure',              label: 'Org Structure',              group: 'HPT Resources' },
  { key: 'hpt_scientific_selection',       label: 'Scientific Selection',       group: 'HPT Resources' },
  { key: 'hpt_cultural_visioning',         label: 'Cultural Visioning',         group: 'HPT Resources' },
  { key: 'hpt_team_formation',             label: 'Team Formation',             group: 'HPT Resources' },
  { key: 'hpt_communication_continuum',    label: 'Communication Continuum',    group: 'HPT Resources' },
  { key: 'hpt_shift_assembly_meeting',     label: 'Shift Assembly Meeting',     group: 'HPT Resources' },
  { key: 'hpt_insights',                   label: 'Insights',                   group: 'HPT Resources' },
  { key: 'hpt_star_caps',                  label: 'STAR Caps',                  group: 'HPT Resources' },
  { key: 'hpt_team_scorecard',             label: 'Team Scorecard',             group: 'HPT Resources' },
  { key: 'hpt_reward_recognition',         label: 'Reward & Recognition',       group: 'HPT Resources' },
  { key: 'hpt_skill_progression',          label: 'Skill-Based Progression',    group: 'HPT Resources' },
  { key: 'hpt_learn_teach_learn',          label: 'Learn-Teach-Learn',          group: 'HPT Resources' },
  { key: 'hpt_empowerment',                label: 'Empowerment',                group: 'HPT Resources' },
  { key: 'hpt_human_value_action',         label: 'Human Value Action Team',    group: 'HPT Resources' },

  // Shared chrome
  { key: 'shared',                         label: 'Header & Footer (shared)',   group: 'Shared' },
];

/* ----------------------------------------------------------------
   DEFAULT_CONTENT — full text extracted from existing HTML so the
   admin is never blank, even on first run.
   ---------------------------------------------------------------- */
const DEFAULT_CONTENT = {
  shared: {
    contact: {
      phone1:  '+91 4449006000',
      phone2:  '+91 8939983080',
      email:   'info@ceohrconsultancy.com',
      address: '9, Pe Ve Plazza, 2nd Floor, Arcot Road, Porur, Chennai, Tamil Nadu, India – 600116'
    },
    social: {
      linkedin:  'https://www.linkedin.com/company/136419/',
      twitter:   'https://twitter.com/CEO_GROUPS',
      youtube:   'https://www.youtube.com/channel/UC4nRMVsjaPXH3qt0HP22zEA',
      instagram: 'https://www.instagram.com/ceo_hr_consultancy/'
    },
    footer: {
      logoImage:  '/assets/logo.png',
      tagline:    'Transforming Businesses, Empowering Teams, Driving Excellence.',
      quickLinksTitle: 'Quick Links',
      exploreTitle:    'Explore',
      contactTitle:    'Contact Us',
      copyright:  '© Copyright 2025 - CEO HR Consultancy. All Right Reserved'
    },
    consultationModal: {
      heading:    'Request Consultation',
      btnText:    'Submit',
      placeholderName: 'Your Name',
      placeholderEmail: 'Your Email',
      placeholderPhone: 'Your Phone Number',
      placeholderCompany: 'Company Name',
      placeholderDescription: 'Describe Your Requirement'
    }
  },

  pages: {
    home: {
      meta: {
        title:       'Transform HR Processes | Build High-Performance Teams',
        description: 'Streamline HR processes and build High-Performance Teams with expert solutions. Trusted by global brands since 1999',
        keywords:    'High-Performance Teams, HR solutions for MSMEs, Organizational development services, Recruitment and bulk hiring, Outsourced HR management'
      },
      hero: {
        heading:     'Transforming Businesses, Empowering Teams, Driving Excellence',
        paragraph:   'Your trusted partner in building High-Performance Teams, streamlining HR processes, and achieving organizational transformation since 1999.',
        primaryBtnText: 'Explore Our Services',
        primaryBtnLink: '/service.html',
        secondaryBtnText: 'Get in Touch',
        secondaryBtnLink: '/contact.html',
        bgImage:    '/assets/img/bg/hero1-main-bg.png',
        mainImage:  '/assets/deen.png',
        reviewImage:'/assets/review-img.png',
        reviewLink: '/team.html'
      },
      stats: [
        { number: '25',   suffix: '+', label: 'Years Experience',  icon: '/assets/img/icons/choose1-icon3.png' },
        { number: '500',  suffix: '+', label: 'Clients',           icon: '/assets/img/icons/choose1-icon2.png' },
        { number: '150',  suffix: '+', label: 'Professionals',     icon: '/assets/img/icons/choose1-icon1.png' },
        { number: '1999', suffix: '',  label: 'Since',             icon: '/assets/img/icons/choose1-icon3.png' }
      ],
      whoWeAre: {
        eyebrow:   'About Us',
        heading:   'Who We Are',
        paragraph: 'With 25+ years of expertise, 500+ clients across six countries, and a team of 150+ professionals, we specialize in',
        bullets: [
          'Organizational Development',
          'Recruitment & Bulk Hiring',
          'Outsourced HR Management for MSMEs'
        ],
        btnText: 'About US',
        btnLink: 'about.html'
      },
      whyChooseUs: {
        heading: 'Why Choose Us',
        cards: [
          { icon: '/assets/resources/service2-iocn1.png', text: 'Proven track record in building High-Performance Teams (HPT).' },
          { icon: '/assets/resources/service2-iocn2.png', text: 'Comprehensive, end-to-end HR solutions tailored for MSMEs.' },
          { icon: '/assets/resources/service2-iocn3.png', text: 'Trusted by global brands for delivering measurable results.' }
        ]
      },
      coreServices: {
        heading: 'Our Core Services',
        cards: [
          { icon: 'assets/img/icons/work1-icon1.png',          title: 'High-Performance Teams/Self-Managed Teams', description: 'Empower your team with proven strategies for productivity and accountability.', link: '/services/High-Performance-Team-and-self-managed.html' },
          { icon: 'assets/img/icons/work1-icon3.png',          title: 'Outsourced HR Management for MSMEs',         description: 'Streamline your HR processes from onboarding to exit, allowing you to focus on your core business.', link: '/services/Outsourced-HR-Management-for-MSME.html' },
          { icon: 'assets/resources/solution4-icon2 (1).png',  title: 'Operational Excellence & Employee Engagement', description: 'Drive efficiency, enhance employee satisfaction, and achieve your organizational goals.', link: '/services/Operational-Excellence-Services.html' },
          { icon: 'assets/resources/solution4-icon3 (1).png',  title: 'Recruitment & Bulk Hiring',                   description: 'Identify and onboard top talent, from GETs to CEOs, with precision and speed.', link: '/services/Recruitment-service.html' },
          { icon: 'assets/all-icons/analytic.png',             title: 'Learning & Skill Development Solutions',      description: 'Equip your workforce with targeted training and leadership development programs.', link: '/services/Operational-Excellence-Services.html' }
        ]
      },
      whyWorkWithUs: {
        heading:   'Why Work With Us',
        subheading:'Delivering Results That Matter',
        cards: [
          { icon: '/assets/img/icons/mission-icon1.png', text: 'Empowered 25,000+ underprivileged students with job opportunities.' },
          { icon: '/assets/img/icons/mission-icon2.png', text: 'Partnered with leading brands, including GE, Strides Pharma, and PepsiCo.' },
          { icon: '/assets/img/icons/mission-icon3.png', text: 'Delivered measurable ROI through innovative HR and organizational solutions' }
        ]
      },
      successPriority: {
        heading: 'Your Success, Our Priority',
        cards: [
          { image: '/assets/home/laptop.png', text: 'Custom solutions for diverse industries' },
          { image: '/assets/home/review.png', text: 'Decades of experience in transforming organizations' },
          { image: '/assets/home/deal.png',   text: 'Commitment to excellence, ethics, and compliance.' }
        ]
      },
      testimonials: {
        eyebrow:  'Testimonial',
        heading:  'What Our Clients Say',
        items: [
          {
            quote:  '“High-Performance Teams have been our game changer. The expertise and dedication of the team at CEO HR Consultancy have made a remarkable impact on our operations.”',
            name:   'Mr. K Sitaram',
            role:   'Director, GE Supply Chain'
          }
        ],
        readMoreText: 'Read More Testimonials',
        readMoreLink: '/testimonial.html'
      },
      cta: {
        heading:   'Ready to Transform Your Business?',
        paragraph: 'Let us help you build a stronger, more efficient, and motivated workforce.',
        btnText:   'Schedule a Consultation',
        btnLink:   '/contact.html'
      },
      faq: {
        heading: 'FAQs',
        items: [
          { question: '1. What are High-Performance Teams (HPT)?',  answer: 'High-Performance Teams are self-managed groups designed to enhance productivity, accountability, and organizational success.' },
          { question: '2. What industries do you serve?',           answer: 'We work with a diverse range of industries, including manufacturing, healthcare, retail, and technology.' },
          { question: '3. How can Outsourced HR Management help MSMEs?', answer: 'Our tailored HR solutions manage everything from recruitment to exit, enabling MSMEs to focus on their core business operations.' }
        ]
      }
    }

    /* Other pages will be auto-seeded by `extractStubsFromDom()` if they
       are missing.  Once each page is wired with data-cms attributes,
       its true defaults can be added here for richer admin labels.    */
  }
};

/* ----------------------------------------------------------------
   State
   ---------------------------------------------------------------- */
const state = {
  user: null,
  content: null,           // working copy (live edits)
  remoteContent: null,     // last value loaded from Supabase
  dirty: false,
  currentPage: 'home',
  saving: false
};

/* ----------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------- */
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function escapeText(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function escapeAttr(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isPlainObject(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function clone(v) { return JSON.parse(JSON.stringify(v)); }

function mergeDeep(target, source) {
  if (!isPlainObject(source)) return target;
  Object.keys(source).forEach(k => {
    const sv = source[k];
    const tv = target[k];
    if (isPlainObject(sv) && isPlainObject(tv)) {
      mergeDeep(tv, sv);
    } else if (Array.isArray(sv) && tv === undefined) {
      target[k] = clone(sv);
    } else if (tv === undefined) {
      target[k] = isPlainObject(sv) || Array.isArray(sv) ? clone(sv) : sv;
    }
    // else: keep target value (it overrides defaults)
  });
  return target;
}

function getPath(obj, path) {
  if (!path) return obj;
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    if (cur == null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}
function setPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const nextKey = parts[i + 1];
    const nextIsIdx = /^\d+$/.test(nextKey);
    if (cur[k] == null || (nextIsIdx ? !Array.isArray(cur[k]) : !isPlainObject(cur[k]))) {
      cur[k] = nextIsIdx ? [] : {};
    }
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function prettifyKey(k) {
  return String(k)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

function isImageKey(k) {
  return /(^|_|-)?(image|img|icon|logo|photo|picture|avatar|cover|thumb|bg|background|banner|pic)s?$/i.test(k);
}
function isLinkKey(k) {
  return /(link|href|url)s?$/i.test(k);
}
function isHtmlKey(k) {
  return /(html|markup)$/i.test(k);
}
function isLongString(s) {
  return typeof s === 'string' && (s.length > 80 || s.indexOf('\n') !== -1);
}

/* ----------------------------------------------------------------
   Toast
   ---------------------------------------------------------------- */
let toastT = null;
function toast(msg, kind = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = '';
  if (kind) el.classList.add(kind);
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ----------------------------------------------------------------
   Save status
   ---------------------------------------------------------------- */
function setSaveStatus(kind, text) {
  const el = $('#save-status');
  el.classList.remove('dirty', 'saving');
  if (kind === 'dirty') el.classList.add('dirty');
  if (kind === 'saving') el.classList.add('saving');
  el.textContent = text;
}
function markDirty() {
  if (!state.dirty) {
    state.dirty = true;
    setSaveStatus('dirty', 'Unsaved changes');
  }
}
function markClean() {
  state.dirty = false;
  setSaveStatus('', 'All changes saved');
}

/* ----------------------------------------------------------------
   Auth
   ---------------------------------------------------------------- */
function showLoading() {
  $('#loading').style.display = 'flex';
  $('#login').style.display = 'none';
  $('#app').style.display = 'none';
}
function showLogin() {
  $('#loading').style.display = 'none';
  $('#login').style.display = 'flex';
  $('#app').style.display = 'none';
}
function showApp() {
  $('#loading').style.display = 'none';
  $('#login').style.display = 'none';
  $('#app').style.display = 'block';
}

function loginError(msg) {
  const e = $('#login-error');
  e.textContent = msg;
  e.style.display = 'block';
}
function loginSuccess(msg) {
  const e = $('#login-success');
  e.textContent = msg;
  e.style.display = 'block';
}
function clearLoginMsgs() {
  $('#login-error').style.display = 'none';
  $('#login-success').style.display = 'none';
}

function friendlyAuthError(err) {
  const m = (err && err.message ? err.message : String(err || '')).toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'Email or password is incorrect.';
  if (m.includes('email not confirmed')) return 'This account email is not confirmed yet. Open the Supabase dashboard and turn on “Auto Confirm User”.';
  if (m.includes('rate')) return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('network')) return 'Network problem reaching the server. Check your internet connection.';
  return err && err.message ? err.message : 'Sign-in failed. Please try again.';
}

async function handleLogin(e) {
  e.preventDefault();
  clearLoginMsgs();
  if (!supa) {
    loginError('Supabase is not configured. Edit supabase-config.js first.');
    return;
  }
  const email = $('#login-email').value.trim().toLowerCase();
  const password = $('#login-password').value;
  if (ALLOW.length && !ALLOW.includes(email)) {
    loginError('This email is not authorized to manage content.');
    return;
  }
  const btn = $('#login-btn');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  const { error } = await supa.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = 'Sign in';
  if (error) {
    loginError(friendlyAuthError(error));
    return;
  }
  // onAuthStateChange will run boot()
}

async function handleForgot() {
  clearLoginMsgs();
  if (!supa) { loginError('Supabase is not configured yet.'); return; }
  const email = $('#login-email').value.trim().toLowerCase();
  if (!email) { loginError('Type your email above first, then click "Forgot password".'); return; }
  const { error } = await supa.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/admin.html'
  });
  if (error) loginError(friendlyAuthError(error));
  else loginSuccess('Password reset link sent. Check your inbox.');
}

async function handleLogout() {
  if (state.dirty && !confirm('You have unsaved changes. Logout anyway?')) return;
  if (supa) await supa.auth.signOut();
  state.user = null;
  state.content = null;
  showLogin();
}

/* ----------------------------------------------------------------
   Load / Save
   ---------------------------------------------------------------- */
async function loadContent() {
  if (!supa) return clone(DEFAULT_CONTENT);
  const { data, error } = await supa
    .from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
  if (error && error.code !== 'PGRST116') {
    toast('Could not load content: ' + error.message, 'error');
    return clone(DEFAULT_CONTENT);
  }
  if (!data) {
    // Seed with defaults
    const seed = clone(DEFAULT_CONTENT);
    await supa.from(TABLE).upsert({ id: ROW_ID, data: seed, updated_at: new Date().toISOString() });
    return seed;
  }
  const merged = clone(data.data || {});
  mergeDeep(merged, DEFAULT_CONTENT);   // backfill new fields if defaults grew
  return merged;
}

async function publish() {
  if (!supa) { toast('Supabase not configured', 'error'); return; }
  if (state.saving) return;
  state.saving = true;
  setSaveStatus('saving', 'Publishing…');
  const payload = {
    id: ROW_ID,
    data: state.content,
    updated_at: new Date().toISOString()
  };
  const { error } = await supa.from(TABLE).upsert(payload);
  state.saving = false;
  if (error) {
    setSaveStatus('dirty', 'Unsaved changes');
    toast('Publish failed: ' + error.message, 'error');
    return;
  }
  state.remoteContent = clone(state.content);
  markClean();
  toast('Changes published. Visitors will see them in 1-2 seconds.', 'success');
}

/* ----------------------------------------------------------------
   Image upload
   ---------------------------------------------------------------- */
async function uploadImage(file) {
  if (!supa) throw new Error('Supabase not configured');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 5 * 1024 * 1024)     throw new Error('Image must be smaller than 5 MB.');
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supa.storage.from(BUCKET).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  });
  if (upErr) throw new Error('Upload failed: ' + upErr.message);
  const { data } = supa.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/* ----------------------------------------------------------------
   Sidebar
   ---------------------------------------------------------------- */
function renderSidebar() {
  const sb = $('#sidebar');
  const groups = {};
  // Build groups from PAGES list
  PAGES.forEach(p => {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  });
  // Catch any pages in content that aren't in PAGES
  const known = new Set(PAGES.map(p => p.key));
  if (state.content && state.content.pages) {
    Object.keys(state.content.pages).forEach(k => {
      if (!known.has(k)) {
        if (!groups['Other']) groups['Other'] = [];
        groups['Other'].push({ key: k, label: prettifyKey(k), group: 'Other' });
      }
    });
  }

  const groupOrder = ['Top-Level', 'Services', 'HPT Resources', 'Shared', 'Other'];
  let html = '';
  groupOrder.forEach(g => {
    if (!groups[g]) return;
    html += `<div class="group-title">${escapeText(g)}</div>`;
    groups[g].forEach(p => {
      const cls = p.key === state.currentPage ? 'nav-item active' : 'nav-item';
      html += `<div class="${cls}" data-page="${escapeAttr(p.key)}">${escapeText(p.label)}</div>`;
    });
  });
  sb.innerHTML = html;

  $$('.nav-item', sb).forEach(item => {
    item.addEventListener('click', () => {
      state.currentPage = item.getAttribute('data-page');
      renderSidebar();
      renderPage();
      // close mobile sidebar
      sb.classList.remove('open');
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  });
}

/* ----------------------------------------------------------------
   Form rendering
   ---------------------------------------------------------------- */
function renderPage() {
  const main = $('#main');
  const pageKey = state.currentPage;
  const isShared = pageKey === 'shared';
  const root = isShared ? state.content.shared : (state.content.pages || {})[pageKey];

  const pageMeta = PAGES.find(p => p.key === pageKey) || { label: prettifyKey(pageKey) };

  let html = '';
  html += `<h1 class="page-title">${escapeText(pageMeta.label)}</h1>`;
  html += `<p class="page-sub">${isShared
    ? 'Edit elements that appear on every page (header, footer, contact info, social links).'
    : 'Edit content for this page. Click <b>Publish</b> when you’re happy with the changes.'}</p>`;
  html += `
    <div class="info-banner">
      <b>How publishing works:</b> click <i>Publish</i> in the top-right to push edits live.
      Visitors on your site will see the update within 1–2 seconds.
    </div>`;

  if (root === undefined || root === null) {
    html += `<div class="field-card"><p style="color:#5d6470;margin:0">
      This page hasn't been wired up yet. Once it has <code>data-cms</code> attributes
      and a default block, its editable fields will appear here automatically.
    </p></div>`;
    main.innerHTML = html;
    return;
  }

  if (Array.isArray(root)) {
    html += renderListBlock(isShared ? 'shared' : `pages.${pageKey}`, root, pageKey);
  } else {
    // Object: each top-level key becomes a section
    Object.keys(root).forEach(sectionKey => {
      const sectionVal = root[sectionKey];
      const sectionPath = (isShared ? 'shared.' : `pages.${pageKey}.`) + sectionKey;
      html += `<h2 class="section-title">${escapeText(prettifyKey(sectionKey))}</h2>`;
      html += renderValue(sectionPath, sectionVal, sectionKey, /*topLevelSection*/ true);
    });
  }

  main.innerHTML = html;
  bindFormEvents(main);
}

/* renderValue: dispatches on type */
function renderValue(path, value, keyName, topLevelSection) {
  if (Array.isArray(value)) {
    return renderListBlock(path, value, keyName);
  }
  if (isPlainObject(value)) {
    let html = '';
    if (topLevelSection) html += `<div class="field-card">`;
    Object.keys(value).forEach(k => {
      const childPath = path + '.' + k;
      const childVal = value[k];
      if (isPlainObject(childVal) || Array.isArray(childVal)) {
        // Nested: title + recurse
        html += `<div class="field-card-head" style="margin-top:10px">${escapeText(prettifyKey(k))}</div>`;
        html += renderValue(childPath, childVal, k, false);
      } else {
        html += renderScalarField(childPath, k, childVal);
      }
    });
    if (topLevelSection) html += `</div>`;
    return html;
  }
  // Bare scalar at top — wrap in card
  let html = `<div class="field-card">`;
  html += renderScalarField(path, keyName, value);
  html += `</div>`;
  return html;
}

function renderScalarField(path, keyName, value) {
  if (isImageKey(keyName)) {
    return renderImageField(path, keyName, value);
  }
  const label = prettifyKey(keyName);
  if (isHtmlKey(keyName) || isLongString(value)) {
    return `
      <div class="field">
        <label>${escapeText(label)}</label>
        <textarea data-bind="${escapeAttr(path)}">${escapeText(value == null ? '' : value)}</textarea>
      </div>`;
  }
  const type = isLinkKey(keyName) ? 'url' : 'text';
  return `
    <div class="field">
      <label>${escapeText(label)}</label>
      <input type="${type}" data-bind="${escapeAttr(path)}" value="${escapeAttr(value == null ? '' : value)}" />
    </div>`;
}

function renderImageField(path, keyName, value) {
  const label = prettifyKey(keyName);
  const safeVal = value == null ? '' : value;
  return `
    <div class="field">
      <label>${escapeText(label)}</label>
      <div class="img-field">
        <div class="img-preview" data-preview-for="${escapeAttr(path)}">
          ${safeVal ? `<img src="${escapeAttr(safeVal)}" alt="" />` : 'No image'}
        </div>
        <div class="img-controls">
          <input type="text" data-bind="${escapeAttr(path)}" value="${escapeAttr(safeVal)}" placeholder="https://… or /assets/…" />
          <div class="upload">
            <button class="btn btn-icon" data-act="upload" data-target="${escapeAttr(path)}">Upload from computer</button>
            <span class="upload-status" data-upload-status="${escapeAttr(path)}"></span>
          </div>
        </div>
      </div>
    </div>`;
}

/* List of items (each item is an object or scalar) */
function renderListBlock(path, items, keyName) {
  const label = prettifyKey(keyName || 'Items');
  let html = `<div class="field-card">`;
  html += `<div class="field-card-head">${escapeText(label)} <span style="font-weight:400;color:#8a93a3">(${items.length})</span></div>`;
  html += `<div class="list-wrap" data-list="${escapeAttr(path)}">`;
  if (!items.length) {
    html += `<div class="list-item" style="color:#8a93a3">No items yet. Click "Add item" below.</div>`;
  } else {
    items.forEach((item, idx) => {
      const itemPath = `${path}.${idx}`;
      const titleHint = pickItemTitle(item, idx);
      html += `<div class="list-item" data-list-idx="${idx}">`;
      html += `<div class="list-item-head">
        <div class="list-item-title">${escapeText(titleHint)}</div>
        <div class="list-actions">
          <button class="btn btn-icon" data-act="move-up"   data-list-path="${escapeAttr(path)}" data-idx="${idx}" title="Move up">▲</button>
          <button class="btn btn-icon" data-act="move-down" data-list-path="${escapeAttr(path)}" data-idx="${idx}" title="Move down">▼</button>
          <button class="btn btn-icon btn-danger" data-act="delete"   data-list-path="${escapeAttr(path)}" data-idx="${idx}" title="Delete">✕</button>
        </div>
      </div>`;
      if (isPlainObject(item)) {
        Object.keys(item).forEach(k => {
          const cp = `${itemPath}.${k}`;
          const cv = item[k];
          if (Array.isArray(cv) || isPlainObject(cv)) {
            html += `<div class="field-card-head" style="margin-top:10px">${escapeText(prettifyKey(k))}</div>`;
            html += renderValue(cp, cv, k, false);
          } else {
            html += renderScalarField(cp, k, cv);
          }
        });
      } else {
        html += renderScalarField(itemPath, keyName || 'value', item);
      }
      html += `</div>`;
    });
  }
  html += `</div>`;
  html += `<button class="btn list-add-btn" data-act="add" data-list-path="${escapeAttr(path)}">+ Add item</button>`;
  html += `</div>`;
  return html;
}

function pickItemTitle(item, idx) {
  if (isPlainObject(item)) {
    const candidates = ['title', 'heading', 'name', 'label', 'question', 'quote', 'text'];
    for (const c of candidates) {
      if (typeof item[c] === 'string' && item[c]) {
        return `${idx + 1}. ${item[c].slice(0, 60)}`;
      }
    }
  }
  return `Item ${idx + 1}`;
}

/* ----------------------------------------------------------------
   Form events (delegated)
   ---------------------------------------------------------------- */
function bindFormEvents(root) {
  if (root._bound) return;
  root._bound = true;

  // Input binding
  root.addEventListener('input', e => {
    const t = e.target;
    if (!t.matches('[data-bind]')) return;
    const path = t.getAttribute('data-bind');
    setPath(state.content, path, t.value);
    markDirty();

    // Update preview if image field
    const preview = root.querySelector(`[data-preview-for="${cssEscape(path)}"]`);
    if (preview) {
      preview.innerHTML = t.value
        ? `<img src="${escapeAttr(t.value)}" alt="" />`
        : 'No image';
    }
  });

  // Action buttons
  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    e.preventDefault();
    const act = btn.getAttribute('data-act');

    if (act === 'upload') {
      const path = btn.getAttribute('data-target');
      pickAndUpload(path, btn);
      return;
    }
    if (act === 'add' || act === 'move-up' || act === 'move-down' || act === 'delete') {
      const listPath = btn.getAttribute('data-list-path');
      const idx = parseInt(btn.getAttribute('data-idx') || '0', 10);
      const list = getPath(state.content, listPath);
      if (!Array.isArray(list)) {
        if (act === 'add') {
          // Create empty list
          setPath(state.content, listPath, []);
        } else {
          return;
        }
      }
      const arr = getPath(state.content, listPath);
      if (act === 'add') {
        arr.push(makeBlankItem(arr));
      } else if (act === 'move-up' && idx > 0) {
        [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      } else if (act === 'move-down' && idx < arr.length - 1) {
        [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      } else if (act === 'delete') {
        if (!confirm('Delete this item?')) return;
        arr.splice(idx, 1);
      }
      markDirty();
      renderPage();
      return;
    }
  });
}

function makeBlankItem(existing) {
  if (existing.length && isPlainObject(existing[0])) {
    const sample = existing[0];
    const blank = {};
    Object.keys(sample).forEach(k => {
      const v = sample[k];
      if (Array.isArray(v))      blank[k] = [];
      else if (isPlainObject(v)) blank[k] = {};
      else                       blank[k] = '';
    });
    return blank;
  }
  if (existing.length && Array.isArray(existing[0])) return [];
  return '';
}

function cssEscape(s) {
  return String(s).replace(/(["\\])/g, '\\$1');
}

/* Image picker */
function pickAndUpload(path, btn) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    document.body.removeChild(input);
    if (!file) return;
    const status = $(`[data-upload-status="${cssEscape(path)}"]`);
    const prevText = btn.textContent;
    btn.textContent = 'Uploading…';
    btn.disabled = true;
    if (status) status.textContent = '';
    try {
      const url = await uploadImage(file);
      setPath(state.content, path, url);
      markDirty();
      // Update visible input + preview
      const inputEl = $(`input[data-bind="${cssEscape(path)}"]`);
      if (inputEl) inputEl.value = url;
      const preview = $(`[data-preview-for="${cssEscape(path)}"]`);
      if (preview) preview.innerHTML = `<img src="${escapeAttr(url)}" alt="" />`;
      if (status) status.textContent = 'Uploaded';
      toast('Image uploaded. Don’t forget to Publish.', 'success');
    } catch (err) {
      console.error(err);
      if (status) status.textContent = '';
      toast(err.message || 'Upload failed', 'error');
    } finally {
      btn.textContent = prevText;
      btn.disabled = false;
    }
  });
  input.click();
}

/* ----------------------------------------------------------------
   Boot
   ---------------------------------------------------------------- */
async function loadExtraDefaults() {
  // Each wired page may ship a small JSON file describing its default
  // content (extracted from its static HTML).  This lets the admin
  // render pre-filled forms even before the user has typed anything.
  const keys = PAGES.map(p => p.key).filter(k => k !== 'shared');
  const results = await Promise.all(keys.map(async key => {
    try {
      const res = await fetch(`/cms-defaults/${key}.json`, { cache: 'no-cache' });
      if (!res.ok) return null;
      const json = await res.json();
      return { key, json };
    } catch { return null; }
  }));
  results.forEach(r => {
    if (!r) return;
    DEFAULT_CONTENT.pages = DEFAULT_CONTENT.pages || {};
    if (!DEFAULT_CONTENT.pages[r.key]) {
      DEFAULT_CONTENT.pages[r.key] = r.json;
    } else {
      // Existing defaults take precedence; only backfill missing keys.
      mergeDeep(DEFAULT_CONTENT.pages[r.key], r.json);
    }
  });
}

async function boot() {
  showLoading();

  await loadExtraDefaults();

  state.remoteContent = await loadContent();
  state.content = clone(state.remoteContent);
  markClean();

  // Choose first available page
  if (!state.content.pages || !state.content.pages[state.currentPage]) {
    if (state.content.pages && state.content.pages.home) state.currentPage = 'home';
    else if (state.content.pages) {
      const first = Object.keys(state.content.pages)[0];
      if (first) state.currentPage = first;
    }
  }

  renderSidebar();
  renderPage();
  showApp();
}

/* ----------------------------------------------------------------
   Wire static UI
   ---------------------------------------------------------------- */
$('#login-form').addEventListener('submit', handleLogin);
$('#forgot-link').addEventListener('click', handleForgot);
$('#logout-btn').addEventListener('click', handleLogout);
$('#publish-btn').addEventListener('click', publish);
$('#menu-toggle').addEventListener('click', () => {
  $('#sidebar').classList.toggle('open');
});

// Ctrl/Cmd+S
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    if (state.user && state.dirty) publish();
  }
});

// Warn on close if unsaved
window.addEventListener('beforeunload', e => {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});

// Auth state
if (supa) {
  supa.auth.getSession().then(({ data }) => {
    const session = data && data.session;
    if (session && session.user) {
      const email = (session.user.email || '').toLowerCase();
      if (ALLOW.length && !ALLOW.includes(email)) {
        supa.auth.signOut();
        showLogin();
        loginError('This email is not authorized to manage content.');
        return;
      }
      state.user = session.user;
      boot();
    } else {
      showLogin();
    }
  });

  supa.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session && session.user) {
      const email = (session.user.email || '').toLowerCase();
      if (ALLOW.length && !ALLOW.includes(email)) {
        supa.auth.signOut();
        showLogin();
        loginError('This email is not authorized to manage content.');
        return;
      }
      state.user = session.user;
      if ($('#app').style.display !== 'block') boot();
    } else if (event === 'SIGNED_OUT') {
      state.user = null;
      showLogin();
    }
  });
} else {
  // Not configured — let the user "preview" the admin in offline mode
  showLogin();
  loginError('Supabase is not configured yet. Open supabase-config.js and follow SUPABASE_SETUP.md.');
}
