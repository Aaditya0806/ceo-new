/* ------------------------------------------------------------------
   CEO HR Consultancy — Public Site CMS Reader
   ------------------------------------------------------------------
   Fetches content from Supabase, applies it to elements tagged with
   data-cms="path.to.field" and listens for realtime updates so visitors
   see admin edits within ~1-2 seconds without refreshing the page.

   Supported attribute conventions:
     data-cms="page.section.field"          → text content
     data-cms-html="page.section.field"     → innerHTML (use only for trusted/HTML fields)
     data-cms-href="page.section.field"     → set href attribute
     data-cms-src="page.section.field"      → set src attribute
     data-cms-attr="path|attrName"          → set arbitrary attribute
     data-cms-pipe="1"                      → split text by " | " on render
     data-cms-list="page.section.list"      → repeating list container
        (must contain a <template data-cms-template> defining the row)
        Inside the template, child elements use data-cms-field="key" /
        data-cms-field-html / data-cms-field-src / data-cms-field-href.

   The script falls back to existing static markup if Supabase is not
   configured or unreachable.
   ------------------------------------------------------------------ */

(function () {
  const cfg = window.CMS_CONFIG || {};
  const PAGE_KEY = (document.querySelector('meta[name="cms-page"]') || {}).content || 'home';

  // ----- Helpers ----------------------------------------------------
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function getPath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = String(path).split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  // ----- Renderer ---------------------------------------------------
  function setLeadingText(el, value) {
    // If element has no element children, plain textContent is safe.
    if (!el.firstElementChild) { el.textContent = value; return; }
    // Otherwise update the first non-empty text node so we don't wipe
    // child elements like icon <span>s or <i> arrows.
    for (let i = 0; i < el.childNodes.length; i++) {
      const node = el.childNodes[i];
      if (node.nodeType === 3 && node.textContent.trim() !== '') {
        node.textContent = value;
        return;
      }
    }
    // No usable text node — happens when an animation library (e.g.
    // SplitText) has already broken the text into character spans.
    // Overwrite cleanly so we don't duplicate the heading on top of
    // the existing character spans.
    el.textContent = value;
  }

  function applyTextNode(el, value, isHtml, isPipe) {
    if (value == null || value === '') return; // keep static fallback
    if (isPipe && typeof value === 'string') {
      setLeadingText(el, value.split('|').map(s => s.trim()).join(' | '));
      return;
    }
    if (isHtml) {
      el.innerHTML = value; // intentional HTML
    } else {
      setLeadingText(el, value);
    }
  }

  function renderField(root, data) {
    // Plain text
    root.querySelectorAll('[data-cms]').forEach(el => {
      // Skip elements inside list templates (they use data-cms-field)
      if (el.closest('template')) return;
      // Skip if inside a list container that will be rendered separately
      if (el.closest('[data-cms-list]') && el !== el.closest('[data-cms-list]')) {
        const list = el.closest('[data-cms-list]');
        if (list && list.querySelector('template[data-cms-template]')) return;
      }
      const path = el.getAttribute('data-cms');
      const isHtml = el.hasAttribute('data-cms-html-flag') || el.getAttribute('data-cms-html') === '1';
      const isPipe = el.getAttribute('data-cms-pipe') === '1';
      const value = getPath(data, path);
      applyTextNode(el, value, isHtml, isPipe);
    });

    // HTML fields (data-cms-html as the binding attribute)
    root.querySelectorAll('[data-cms-html]:not([data-cms])').forEach(el => {
      if (el.closest('template')) return;
      const v = el.getAttribute('data-cms-html');
      if (v === '1' || v === 'true') return; // it's a flag, not a path
      const value = getPath(data, v);
      if (value != null && value !== '') el.innerHTML = value;
    });

    // href
    root.querySelectorAll('[data-cms-href]').forEach(el => {
      if (el.closest('template')) return;
      const value = getPath(data, el.getAttribute('data-cms-href'));
      if (value != null && value !== '') el.setAttribute('href', value);
    });

    // src
    root.querySelectorAll('[data-cms-src]').forEach(el => {
      if (el.closest('template')) return;
      const value = getPath(data, el.getAttribute('data-cms-src'));
      if (value != null && value !== '') el.setAttribute('src', value);
    });

    // arbitrary attr
    root.querySelectorAll('[data-cms-attr]').forEach(el => {
      if (el.closest('template')) return;
      const spec = el.getAttribute('data-cms-attr');
      if (!spec) return;
      const [path, attrName] = spec.split('|');
      if (!path || !attrName) return;
      const value = getPath(data, path);
      if (value != null && value !== '') el.setAttribute(attrName, value);
    });

    // Lists
    root.querySelectorAll('[data-cms-list]').forEach(container => {
      const path = container.getAttribute('data-cms-list');
      const items = getPath(data, path);
      const tpl = container.querySelector(':scope > template[data-cms-template]');
      if (!tpl || !Array.isArray(items)) return;

      // Remove previously rendered items
      Array.from(container.children).forEach(c => {
        if (c !== tpl && c.dataset && c.dataset.cmsRendered === '1') c.remove();
      });
      // Hide static fallback children once we have data
      Array.from(container.children).forEach(c => {
        if (c !== tpl && c.dataset.cmsRendered !== '1') c.style.display = 'none';
      });

      items.forEach((item, idx) => {
        const node = tpl.content.firstElementChild
          ? tpl.content.firstElementChild.cloneNode(true)
          : document.importNode(tpl.content, true).firstElementChild;
        if (!node) return;
        node.dataset.cmsRendered = '1';

        // text fields
        node.querySelectorAll('[data-cms-field]').forEach(el => {
          const key = el.getAttribute('data-cms-field');
          const v = item[key];
          if (v != null && v !== '') el.textContent = v;
        });
        node.querySelectorAll('[data-cms-field-html]').forEach(el => {
          const key = el.getAttribute('data-cms-field-html');
          const v = item[key];
          if (v != null && v !== '') el.innerHTML = v;
        });
        node.querySelectorAll('[data-cms-field-src]').forEach(el => {
          const key = el.getAttribute('data-cms-field-src');
          const v = item[key];
          if (v != null && v !== '') el.setAttribute('src', v);
        });
        node.querySelectorAll('[data-cms-field-href]').forEach(el => {
          const key = el.getAttribute('data-cms-field-href');
          const v = item[key];
          if (v != null && v !== '') el.setAttribute('href', v);
        });
        node.querySelectorAll('[data-cms-field-attr]').forEach(el => {
          const spec = el.getAttribute('data-cms-field-attr');
          if (!spec) return;
          const [k, attrName] = spec.split('|');
          const v = item[k];
          if (v != null && v !== '' && attrName) el.setAttribute(attrName, v);
        });

        container.appendChild(node);
      });
    });
  }

  function applyContent(fullData) {
    if (!fullData) return;
    const pageData = (fullData.pages && fullData.pages[PAGE_KEY]) || {};
    const sharedData = fullData.shared || {};

    // Build a merged view so paths can be:
    //  - "<field>"               → resolves against current page
    //  - "shared.<field>"        → resolves against shared
    const merged = Object.assign({}, pageData, { shared: sharedData });

    renderField(document, merged);
    document.documentElement.setAttribute('data-cms-loaded', '1');
  }

  // ----- Supabase wiring -------------------------------------------
  async function init() {
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY ||
        cfg.SUPABASE_URL.indexOf('YOUR_PROJECT_ID') !== -1) {
      // Not configured — keep static fallback
      return;
    }
    let createClient;
    try {
      ({ createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.0/+esm'));
    } catch (err) {
      console.warn('[cms-reader] Failed to load Supabase client', err);
      return;
    }

    const supa = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    window.__cmsClient = supa;

    async function load() {
      const { data, error } = await supa
        .from(cfg.CONTENT_TABLE || 'site_content')
        .select('data')
        .eq('id', cfg.CONTENT_ROW_ID || 1)
        .maybeSingle();
      if (error) {
        console.warn('[cms-reader] load error', error);
        return;
      }
      if (data && data.data) applyContent(data.data);
    }

    await load();

    try {
      supa.channel('cms-public')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: cfg.CONTENT_TABLE || 'site_content',
          filter: `id=eq.${cfg.CONTENT_ROW_ID || 1}`
        }, payload => {
          const next = payload.new && payload.new.data;
          if (next) applyContent(next);
        })
        .subscribe();
    } catch (err) {
      console.warn('[cms-reader] realtime subscribe failed', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
