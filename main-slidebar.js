(function () {
  'use strict';

  function installMainSlidebar() {
    if (document.getElementById('mainSlidebar')) return;

    const headerActions = document.querySelector('header .max-w-6xl > div > div:last-child');
    if (headerActions && !document.getElementById('mainSlidebarTrigger')) {
      const trigger = document.createElement('button');
      trigger.id = 'mainSlidebarTrigger';
      trigger.type = 'button';
      trigger.className = 'icon-btn-slidebar';
      trigger.setAttribute('aria-label', 'मेन्यू एवं त्वरित सेवाएँ खोलें');
      trigger.setAttribute('aria-controls', 'mainSlidebar');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.textContent = '☰';
      trigger.addEventListener('click', () => window.toggleMainSlidebar(true));
     const bell = document.getElementById('notificationBellButton');
const insertBeforeNode = bell && bell.parentNode === headerActions
  ? bell
  : headerActions.firstChild;

headerActions.insertBefore(trigger, insertBeforeNode);
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'slidebarBackdrop';
    backdrop.className = 'slidebar-backdrop';
    backdrop.addEventListener('click', () => window.toggleMainSlidebar(false));

    const drawer = document.createElement('aside');
    drawer.id = 'mainSlidebar';
    drawer.className = 'main-slidebar';
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('aria-label', 'मेन्यू एवं त्वरित सेवाएँ');
    drawer.innerHTML = `
      <div class="slidebar-header">
        <div class="brand-title"><span aria-hidden="true">🌿</span><h2>मेन्यू एवं त्वरित सेवाएँ</h2></div>
        <button type="button" class="btn-close-drawer" data-slidebar-close aria-label="मेन्यू बंद करें">×</button>
      </div>
      <div class="slidebar-scroll-area">
        <section class="drawer-group">
          <p class="drawer-group-label">दैनिक साधना</p>
          <button type="button" class="drawer-action-card" data-drawer-action="mala"><span class="drawer-icon">📿</span><span class="details"><strong>डिजिटल जप माला</strong><small>108 मनके और दैनिक गिनती</small></span></button>
          <button type="button" class="drawer-action-card" data-drawer-action="amavasya"><span class="drawer-icon">📅</span><span class="details"><strong>अमावस्या एवं पंचांग</strong><small>आगामी तिथि और दैनिक संदेश</small></span></button>
        </section>
        <section class="drawer-group">
          <p class="drawer-group-label">भाषा एवं प्रदर्शन</p>
          <button type="button" class="drawer-action-card" data-drawer-action="language"><span class="drawer-icon">🌐</span><span class="details"><strong>ENG / हिन्दी</strong><small id="drawerLanguageStatus">भाषा बदलें · अभी हिन्दी</small></span><span aria-hidden="true">↔</span></button>
          <button type="button" id="drawerOwnerStudioLink" class="drawer-action-card" data-drawer-action="owner-studio" aria-label="Owner Studio — Dharmveer Godara"><span class="drawer-icon">🛡️</span><span class="details"><strong>Owner Studio</strong><small>Dharmveer Godara · परीक्षा और वेबसाइट प्रबंधन</small></span><span aria-hidden="true">↗</span></button>
          <button type="button" class="drawer-action-card" data-drawer-action="literature"><span class="drawer-icon">📖</span><span class="details"><strong>29 नियम एवं साहित्य</strong><small>साहित्य अनुभाग खोलें</small></span></button>
        </section>
        <section class="drawer-group">
          <p class="drawer-group-label">तीर्थ एवं सहायता</p>
          <button type="button" class="drawer-action-card" data-drawer-action="map"><span class="drawer-icon">📍</span><span class="details"><strong>तीर्थ दर्शिका</strong><small>मुकाम, समराथल और धाम खोजें</small></span></button>
          <button type="button" class="drawer-action-card" data-drawer-action="notifications"><span class="drawer-icon">🔔</span><span class="details"><strong>सूचनाएँ</strong><small>परीक्षा और मंच अपडेट</small></span></button>
        </section>
      </div>`;

    document.body.append(backdrop, drawer);

    // Keep Owner Studio discoverable in the mobile drawer for every visitor.
    // The Owner Studio page itself verifies the signed-in account and role.
    const languageStatus = document.getElementById('drawerLanguageStatus');
    const syncDrawerLanguage = () => {
      if (languageStatus) languageStatus.textContent = 'भाषा बदलें · अभी ' + (document.documentElement.lang === 'en' ? 'English' : 'हिन्दी');
    };
    syncDrawerLanguage();
    document.addEventListener('bishnoism:languagechange', syncDrawerLanguage);

    drawer.querySelector('[data-slidebar-close]').addEventListener('click', () => window.toggleMainSlidebar(false));
    drawer.addEventListener('click', event => {
      const action = event.target.closest('[data-drawer-action]')?.dataset.drawerAction;
      if (!action) return;
      window.toggleMainSlidebar(false);
      if (action === 'mala') {
        window.switchTab?.('mala');
        document.getElementById('tab-mala')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (action === 'amavasya') {
        window.switchTab?.('home');
        document.getElementById('amavasyaCountdownBox')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (action === 'language') {
        const currentLanguage = document.documentElement.lang === 'en' ? 'en' : 'hi';
        if (window.BishnoismLanguage?.set) window.BishnoismLanguage.set(currentLanguage === 'hi' ? 'en' : 'hi');
        else document.querySelector('[data-language-toggle]')?.click();
      } else if (action === 'owner-studio') {
        window.location.href = './owner-studio.html';
      } else if (action === 'literature') {
        window.switchTab?.('library');
        document.getElementById('tab-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (action === 'map') {
        window.open('https://www.google.com/maps/search/Bishnoi+temples+Mukam+Samrathal+Dham/', '_blank', 'noopener,noreferrer');
      } else if (action === 'notifications') {
        window.toggleNotificationPanel?.(true);
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && drawer.classList.contains('open')) window.toggleMainSlidebar(false);
    });
  }

  window.toggleMainSlidebar = function (open) {
    const drawer = document.getElementById('mainSlidebar');
    const backdrop = document.getElementById('slidebarBackdrop');
    const trigger = document.getElementById('mainSlidebarTrigger');
    if (!drawer || !backdrop) return;
    const shouldOpen = Boolean(open);
    drawer.classList.toggle('open', shouldOpen);
    backdrop.classList.toggle('visible', shouldOpen);
    drawer.setAttribute('aria-hidden', String(!shouldOpen));
    trigger?.setAttribute('aria-expanded', String(shouldOpen));
    document.body.classList.toggle('slidebar-open', shouldOpen);
    if (shouldOpen) drawer.querySelector('[data-slidebar-close]')?.focus();
    else trigger?.focus({ preventScroll: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installMainSlidebar, { once: true });
  else installMainSlidebar();
})();
