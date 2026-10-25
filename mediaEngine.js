/* Bishnoism shared media engine — official embeds only; never bypasses ad delivery. */
(function () {
  'use strict';

  function extractYouTubeId(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw);
      const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
      let id = '';
      if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
      else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
        else {
          const parts = url.pathname.split('/').filter(Boolean);
          if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1] || '';
        }
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : '';
    } catch (_) { return ''; }
  }

  function extractDriveId(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw);
      if (!/(^|\.)drive\.google\.com$/i.test(url.hostname) && !/(^|\.)docs\.google\.com$/i.test(url.hostname)) return '';
      let id = '';
      const match = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/) ||
        url.pathname.match(/\/document\/d\/([A-Za-z0-9_-]+)/) ||
        url.pathname.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/) ||
        url.pathname.match(/\/presentation\/d\/([A-Za-z0-9_-]+)/);
      if (match) id = match[1];
      if (!id) id = url.searchParams.get('id') || '';
      return /^[A-Za-z0-9_-]{10,}$/.test(id) ? id : '';
    } catch (_) { return ''; }
  }

  function drivePreviewUrl(input) {
    const id = extractDriveId(input);
    return id ? 'https://drive.google.com/file/d/' + id + '/preview' : '';
  }

  function normalizePhone(input) {
    const digits = String(input || '').replace(/\D/g, '');
    const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits;
    return /^[6-9]\d{9}$/.test(local) ? local : '';
  }

  function node(tag, attrs, text) {
    const element = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (key === 'className') element.className = value;
      else if (key === 'dataset') Object.assign(element.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2).toLowerCase(), value);
      else element.setAttribute(key, String(value));
    });
    if (text != null) element.textContent = text;
    return element;
  }

  function ensureReader() {
    let modal = document.getElementById('bishnoiMediaReader');
    if (modal) return modal;
    modal = node('div', { id: 'bishnoiMediaReader', className: 'bishnoi-media-reader', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'In-app media reader', hidden: '' });
    const dialog = node('section', { className: 'bishnoi-media-dialog' });
    const toolbar = node('header', { className: 'bishnoi-media-toolbar' });
    const title = node('strong', { id: 'bishnoiMediaTitle' }, 'साहित्य व मीडिया');
    const actions = node('div', { className: 'bishnoi-media-actions' });
    const mini = node('button', { type: 'button', 'aria-label': 'मिनी प्लेयर', id: 'bishnoiMediaMini', className: 'bishnoi-media-tool' }, 'मिनी प्लेयर');
    const close = node('button', { type: 'button', 'aria-label': 'मीडिया बंद करें', className: 'bishnoi-media-tool' }, '✕');
    const body = node('div', { id: 'bishnoiMediaBody', className: 'bishnoi-media-body' });
    mini.addEventListener('click', function () {
      if (!modal.dataset.canMinimize) return;
      modal.classList.add('is-mini');
      modal.hidden = false;
    });
    close.addEventListener('click', closeReader);
    modal.addEventListener('click', function (event) { if (event.target === modal && !modal.classList.contains('is-mini')) closeReader(); });
    actions.append(mini, close);
    toolbar.append(title, actions);
    dialog.append(toolbar, body);
    modal.append(dialog);
    document.body.append(modal);
    return modal;
  }

  function closeReader() {
    const modal = document.getElementById('bishnoiMediaReader');
    const body = document.getElementById('bishnoiMediaBody');
    if (body) body.replaceChildren();
    if (modal) {
      modal.hidden = true;
      modal.classList.remove('is-mini');
      delete modal.dataset.canMinimize;
    }
  }

  function openMedia(item) {
    const modal = ensureReader();
    const body = document.getElementById('bishnoiMediaBody');
    const title = document.getElementById('bishnoiMediaTitle');
    const mini = document.getElementById('bishnoiMediaMini');
    body.replaceChildren();
    title.textContent = String(item.title || 'साहित्य व मीडिया');
    modal.classList.remove('is-mini');
    modal.hidden = false;
    const type = String(item.type || item.category || '').toLowerCase();
    const videoId = item.videoId || extractYouTubeId(item.url || item.rawUrl || item.embedUrl || '');
    const driveUrl = item.previewUrl || drivePreviewUrl(item.url || item.rawUrl || item.embedUrl || '');
    if (type.includes('youtube') || type.includes('video') || videoId) {
      if (!videoId) { body.append(node('p', { className: 'bishnoi-media-error' }, 'यह YouTube लिंक मान्य नहीं है।')); return; }
      const frame = node('iframe', {
        title: item.title || 'YouTube video',
        src: 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&playsinline=1&rel=0',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
        allowfullscreen: '',
        referrerpolicy: 'strict-origin-when-cross-origin'
      });
      body.append(frame);
      modal.dataset.canMinimize = 'true';
      mini.hidden = false;
    } else if (type.includes('audio') || /\.(mp3|m4a|ogg|wav)(\?|#|$)/i.test(item.url || item.rawUrl || '')) {
      const audio = node('audio', { controls: '', autoplay: '', preload: 'metadata', className: 'bishnoi-media-audio' });
      audio.src = item.url || item.rawUrl || '';
      body.append(audio);
      modal.dataset.canMinimize = 'true';
      mini.hidden = false;
    } else {
      const preview = driveUrl || item.url || item.rawUrl || '';
      if (!/^https:\/\//i.test(preview)) { body.append(node('p', { className: 'bishnoi-media-error' }, 'दस्तावेज़ लिंक मान्य नहीं है।')); return; }
      const frame = node('iframe', { title: item.title || 'PDF reader', src: preview, loading: 'lazy', referrerpolicy: 'strict-origin-when-cross-origin' });
      body.append(frame);
      delete modal.dataset.canMinimize;
      mini.hidden = true;
    }
  }

  let mediaItemsCache = [];
  let mediaFilter = 'all';
  const mediaCategoryLabels = { bhajan: 'आरती / भजन', katha: 'कथा / प्रवचन', history: 'इतिहास', literature: 'साहित्य' };

  function renderMediaFeed(container, items) {
    if (!container) return;
    container.replaceChildren();
    const visibleItems = mediaFilter === 'all' ? items : items.filter(item => (item.category || 'literature') === mediaFilter);
    if (!visibleItems.length) {
      container.append(node('p', { className: 'bishnoi-media-empty' }, 'अभी कोई नया साहित्य या वीडियो प्रकाशित नहीं है।'));
      return;
    }
    visibleItems.forEach(item => {
      const card = node('article', { className: 'bishnoi-media-card' });
      const type = String(item.type || item.category || '').toLowerCase();
      const videoId = item.videoId || extractYouTubeId(item.url || item.rawUrl || '');
      const thumb = videoId ? 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg' : '';
      if (thumb) card.append(node('img', { src: thumb, alt: '', loading: 'lazy', className: 'bishnoi-media-thumb' }));
      const heading = node('h3', { className: 'bishnoi-media-card-title' }, item.title || 'शीर्षक उपलब्ध नहीं');
      const category = mediaCategoryLabels[item.category] || (type.includes('youtube') || type.includes('video') ? 'वीडियो' : type.includes('audio') ? 'ऑडियो' : 'साहित्य');
      const badge = node('span', { className: 'bishnoi-media-badge' }, category + ' · ' + (type.includes('youtube') || type.includes('video') ? 'वीडियो' : type.includes('audio') ? 'ऑडियो' : 'PDF'));
      const open = node('button', { type: 'button', className: 'bishnoi-media-open' }, type.includes('youtube') || type.includes('video') ? '▶ ऐप में चलाएँ' : type.includes('audio') ? '♫ सुनें' : '📖 ऐप में पढ़ें');
      open.addEventListener('click', () => openMedia(item));
      card.append(badge, heading, open);
      container.append(card);
    });
  }

  function mediaFirebaseReady() {
    return !!(window.firebase && window.firebase.apps && window.firebase.apps.length);
  }

  async function waitForMediaFirebase(maxAttempts = 20, intervalMs = 250) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (mediaFirebaseReady()) return true;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return mediaFirebaseReady();
  }

  function showMediaFeedError(container, message) {
    const notice = node('div', { className: 'bishnoi-media-empty', role: 'status' });
    notice.append(node('p', {}, message));
    const retry = node('button', {
      type: 'button',
      className: 'bishnoi-media-open',
      'aria-label': 'मीडिया सूची फिर से लोड करें'
    }, 'फिर से प्रयास करें');
    retry.addEventListener('click', () => loadMediaFeed());
    notice.append(retry);
    container.replaceChildren(notice);
  }

  async function loadMediaFeed() {
    const container = document.getElementById('platformMediaFeed');
    if (!container) return;
    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(node('p', { className: 'bishnoi-media-empty', role: 'status' }, 'साहित्य और मीडिया लोड हो रहे हैं…'));
    try {
      // mediaEngine.js may execute before script.js initializes the Firebase app.
      // Wait briefly for the existing initializer instead of leaving the feed blank.
      if (!(await waitForMediaFirebase())) {
        showMediaFeedError(container, 'मीडिया सेवा अभी तैयार नहीं है। कृपया दोबारा प्रयास करें।');
        return;
      }
      const snapshot = await firebase.firestore().collection('platform_media')
        .where('active', '==', true).limit(30).get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a, b) => {
        const toMs = value => value && typeof value.toMillis === 'function' ? value.toMillis() : 0;
        return toMs(b.createdAt) - toMs(a.createdAt);
      });
      mediaItemsCache = items;
      renderMediaFeed(container, mediaItemsCache);
    } catch (error) {
      console.warn('[Bishnoism media] Feed unavailable:', error);
      showMediaFeedError(container, 'मीडिया सूची लोड नहीं हुई। इंटरनेट कनेक्शन जाँचकर फिर प्रयास करें।');
    } finally {
      container.removeAttribute('aria-busy');
    }
  }

  async function saveMediaLink() {
    const status = document.getElementById('mediaLinkStatus');
    const titleInput = document.getElementById('mediaLinkTitle');
    const urlInput = document.getElementById('mediaLinkUrl');
    const typeInput = document.getElementById('mediaLinkType');
    const categoryInput = document.getElementById('mediaLinkCategory');
    const category = categoryInput ? categoryInput.value : 'literature';
    let title = titleInput ? titleInput.value.trim() : '';
    const rawUrl = urlInput ? urlInput.value.trim() : '';
    const type = typeInput ? typeInput.value : 'youtube';
    const setStatus = message => { if (status) status.textContent = message; };
    try {
      if (!window.firebase || !firebase.apps || !firebase.apps.length) throw new Error('Firebase अभी तैयार नहीं है।');
      const user = firebase.auth().currentUser;
      if (!user) throw new Error('पहले Owner Studio में सत्यापित खाते से लॉगिन करें।');
      if (!rawUrl) throw new Error('लिंक भरें।');
      const videoId = type === 'youtube' ? extractYouTubeId(rawUrl) : '';
      const driveId = type === 'pdf' ? extractDriveId(rawUrl) : '';
      if (type === 'youtube' && !videoId) throw new Error('YouTube watch, Shorts या youtu.be लिंक मान्य नहीं है।');
      if (!title && type === 'youtube') {
        try {
          const response = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + videoId));
          if (response.ok) { const metadata = await response.json(); title = String(metadata.title || '').trim(); }
        } catch (_) {}
      }
      if (!title) title = type === 'pdf' ? 'Google Drive साहित्य' : type === 'audio' ? 'भजन / ऑडियो' : 'YouTube वीडियो';
      if (type === 'pdf' && !driveId && !/^https:\/\//i.test(rawUrl)) throw new Error('PDF लिंक HTTPS होना चाहिए।');
      if (type === 'audio' && !/^https:\/\//i.test(rawUrl)) throw new Error('ऑडियो लिंक HTTPS होना चाहिए।');
      const db = firebase.firestore();
      await db.collection('platform_media').add({
        title: title.slice(0, 180),
        type,
        category,
        url: rawUrl,
        ...(videoId ? { videoId } : {}),
        ...(driveId ? { driveId, previewUrl: 'https://drive.google.com/file/d/' + driveId + '/preview' } : {}),
        active: true,
        createdBy: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      if (titleInput) titleInput.value = '';
      if (urlInput) urlInput.value = '';
      setStatus('सामग्री प्रकाशित हो गई। वेबसाइट की साहित्य सूची में दिखने में कुछ क्षण लग सकते हैं।');
      loadMediaFeed();
    } catch (error) {
      console.error('[Bishnoism media] Publish failed:', error);
      setStatus(error.message || 'सामग्री प्रकाशित नहीं हो सकी। Firestore rules जाँचें।');
    }
  }

  window.BishnoiMedia = {
    extractYouTubeId,
    extractDriveId,
    drivePreviewUrl,
    normalizePhone,
    openMedia,
    closeReader,
    loadMediaFeed,
    saveMediaLink
  };

  function boot() {
    const feed = document.getElementById('platformMediaFeed');
    if (feed) {
      const filterBar = node('div', { className: 'bishnoi-media-filters', role: 'group', 'aria-label': 'साहित्य श्रेणी फ़िल्टर' });
      [['all', 'सभी'], ['bhajan', 'आरती / भजन'], ['katha', 'कथा / प्रवचन'], ['history', 'इतिहास'], ['literature', 'साहित्य']].forEach(([key, label]) => {
        const button = node('button', { type: 'button', className: 'bishnoi-media-filter', 'data-media-filter': key }, label);
        button.addEventListener('click', () => {
          mediaFilter = key;
          filterBar.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item.dataset.mediaFilter === key));
          renderMediaFeed(feed, mediaItemsCache);
        });
        filterBar.append(button);
      });
      feed.parentElement.insertBefore(filterBar, feed);
      filterBar.querySelector('[data-media-filter="all"]')?.classList.add('is-active');
      loadMediaFeed();
    }
    const titleField = document.getElementById('mediaLinkTitle');
    if (titleField && !document.getElementById('mediaLinkCategory')) {
      const label = node('label', { className: 'block text-xs font-bold text-stone-700' }, 'श्रेणी');
      const select = node('select', { id: 'mediaLinkCategory', className: 'mt-1 w-full min-h-12 rounded-xl border border-stone-300 bg-white p-3 text-sm' });
      [['bhajan', 'आरती / भजन / साखी'], ['katha', 'कथा / प्रवचन'], ['history', 'ऐतिहासिक वृत्तचित्र'], ['literature', 'साहित्य / धार्मिक ग्रंथ']].forEach(([value, textValue]) => select.append(node('option', { value }, textValue)));
      label.append(select);
      titleField.closest('label')?.insertAdjacentElement('beforebegin', label);
    }
    document.addEventListener('click', event => {
      const link = event.target.closest('#pdfGrid a, #pdfLibrary a, #literatureFiles a');
      if (!link || !link.href || !window.BishnoiMedia) return;
      event.preventDefault();
      const card = link.closest('article');
      const heading = card && card.querySelector('strong, h3, h4');
      openMedia({ type: 'pdf', title: heading ? heading.textContent.trim() : 'साहित्य PDF', url: link.href });
    });
    if (document.getElementById('bishnoiMediaStyles')) return;
    const style = node('style', { id: 'bishnoiMediaStyles' });
    style.textContent = [
      '.bishnoi-media-reader{position:fixed;inset:0;z-index:10050;background:rgba(10,20,14,.78);display:flex;align-items:center;justify-content:center;padding:12px}',
      '.bishnoi-media-reader[hidden]{display:none!important}',
      '.bishnoi-media-dialog{width:min(960px,100%);height:min(84vh,760px);display:flex;flex-direction:column;overflow:hidden;background:#fffdf7;border-radius:18px;box-shadow:0 20px 60px #0005}',
      '.bishnoi-media-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:#143622;color:#fff;min-height:52px}',
      '.bishnoi-media-actions{display:flex;gap:8px;align-items:center}',
      '.bishnoi-media-tool{min-height:40px;padding:8px 12px;border-radius:10px;border:1px solid #ffffff55;background:#ffffff14;color:#fff;font-weight:700}',
      '.bishnoi-media-body{display:flex;align-items:center;justify-content:center;flex:1;min-height:0;background:#f3f1e9}',
      '.bishnoi-media-body iframe{width:100%;height:100%;border:0;background:#fff}',
      '.bishnoi-media-audio{width:min(520px,90%)}',
      '.bishnoi-media-reader.is-mini{inset:auto 12px max(12px,env(safe-area-inset-bottom)) auto;background:transparent;padding:0;display:block;width:min(390px,calc(100vw - 24px));height:auto}',
      '.bishnoi-media-reader.is-mini .bishnoi-media-dialog{height:auto;width:100%;border-radius:14px;box-shadow:0 10px 30px #0006}',
      '.bishnoi-media-reader.is-mini .bishnoi-media-toolbar{min-height:40px;padding:6px 8px;font-size:12px}',
      '.bishnoi-media-reader.is-mini .bishnoi-media-tool{min-height:34px;padding:5px 8px;font-size:11px}',
      '.bishnoi-media-reader.is-mini .bishnoi-media-body{height:190px;flex:none}',
      '.bishnoi-media-reader.is-mini .bishnoi-media-body iframe{height:190px}',
      '.bishnoi-media-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}',
      '.bishnoi-media-filter{min-height:44px;padding:8px 12px;border:1px solid #d6d3d1;border-radius:999px;background:#fff;color:#143622;font-size:12px;font-weight:800}',
      '.bishnoi-media-filter.is-active{background:#143622;color:#fff;border-color:#143622}',
      '.bishnoi-media-card{display:flex;flex-direction:column;gap:10px;border:1px solid #e7e5e4;border-radius:16px;background:#fff;padding:14px;box-shadow:0 4px 12px #1436220a}',
      '.bishnoi-media-thumb{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;background:#f1f5f9}',
      '.bishnoi-media-card-title{font-weight:800;color:#143622;overflow-wrap:anywhere}',
      '.bishnoi-media-badge{font-size:11px;font-weight:800;color:#8a4b10}',
      '.bishnoi-media-open{min-height:48px;margin-top:auto;padding:10px 12px;border-radius:10px;background:#143622;color:white;font-weight:800}',
      '.bishnoi-media-empty,.bishnoi-media-error{padding:16px;border-radius:12px;background:#fff;border:1px solid #e7e5e4;color:#57534e;font-size:13px}',
      '@media(max-width:640px){.bishnoi-media-dialog{height:88dvh;border-radius:14px}.bishnoi-media-reader{padding:8px}.bishnoi-media-reader.is-mini{inset:auto 8px max(8px,env(safe-area-inset-bottom)) 8px;width:auto}.bishnoi-media-reader.is-mini .bishnoi-media-body{height:180px}.bishnoi-media-reader.is-mini .bishnoi-media-body iframe{height:180px}}'
    ].join('\n');
    document.head.append(style);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();