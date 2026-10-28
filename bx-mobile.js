/* Bishnoism mobile kit logic. Set the WebView UA suffix to " BishnoiApp".
   Storage is a local prototype only; wire BX.load/BX.save to an owner-authorized
   Firestore service before using profile visibility settings across accounts. */
(function () {
  'use strict';
  const DEFAULTS = {
    sections: { exams:true, personal:true, security:true, actions:true, favourites:true },
    exam: { portalButton:true, enrollment:true, admitCard:true, results:true },
    notice: ''
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const safeConfig = value => {
    const remote = isPlainObject(value) ? value : {};
    return {
      sections: { ...DEFAULTS.sections, ...(isPlainObject(remote.sections) ? remote.sections : {}) },
      exam: { ...DEFAULTS.exam, ...(isPlainObject(remote.exam) ? remote.exam : {}) },
      notice: typeof remote.notice === 'string' ? remote.notice.slice(0, 140) : ''
    };
  };
  const BX = window.BX = {
    config: clone(DEFAULTS),
    async load() {
      try {
        const value = window.localStorage.getItem('bx-profile-config');
        return value ? JSON.parse(value) : clone(DEFAULTS);
      } catch (_) { return clone(DEFAULTS); }
    },
    async save(config) {
      window.localStorage.setItem('bx-profile-config', JSON.stringify(safeConfig(config)));
    },
    async init() {
      if (/BishnoiApp/.test(navigator.userAgent)) document.body.classList.add('bx-app');
      const remote = await BX.load();
      BX.config = safeConfig(remote);
      BX.apply();
    },
    apply() {
      const config = BX.config;
      document.querySelectorAll('[data-bx-section]').forEach(element => {
        const hidden = config.sections[element.dataset.bxSection] === false;
        if (hidden) element.setAttribute('data-bx-hidden', '1');
        else element.removeAttribute('data-bx-hidden');
      });
      document.querySelectorAll('[data-bx-item]').forEach(element => {
        const hidden = config.exam[element.dataset.bxItem] === false;
        if (hidden) element.setAttribute('data-bx-hidden', '1');
        else element.removeAttribute('data-bx-hidden');
      });
      const notice = document.getElementById('bx-notice');
      if (notice) {
        notice.textContent = config.notice;
        notice.hidden = !config.notice;
      }
    },
    renderControls(container) {
      if (!container) return;
      const rows = [
        ['sections','exams','परीक्षा कार्ड'], ['sections','personal','व्यक्तिगत जानकारी'],
        ['sections','security','खाता सुरक्षा'], ['sections','actions','खाता विकल्प'],
        ['sections','favourites','पसंदीदा सामग्री'], ['exam','portalButton','परीक्षा पोर्टल बटन'],
        ['exam','enrollment','पंजीकरण'], ['exam','admitCard','प्रवेश-पत्र'], ['exam','results','परिणाम']
      ];
      container.replaceChildren();
      rows.forEach(([group,key,labelText]) => {
        const label = document.createElement('label');
        label.className = 'bx-switch';
        const text = document.createElement('span');
        text.textContent = labelText;
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = BX.config[group][key] !== false;
        input.dataset.g = group;
        input.dataset.k = key;
        input.setAttribute('aria-label', labelText);
        label.append(text,input);
        container.append(label);
      });
      const noticeLabel = document.createElement('label');
      noticeLabel.className = 'bx-switch';
      noticeLabel.style.display = 'block';
      const noticeText = document.createElement('span');
      noticeText.textContent = 'सभी सदस्यों के लिए संदेश';
      const noticeInput = document.createElement('input');
      noticeInput.type = 'text';
      noticeInput.id = 'bx-notice-in';
      noticeInput.maxLength = 140;
      noticeInput.value = BX.config.notice;
      noticeInput.style.cssText = 'width:100%;min-height:44px;margin-top:6px';
      noticeLabel.append(noticeText,noticeInput);
      container.append(noticeLabel);
      let saveButton = container.querySelector('[data-bx-save]');
      if (!saveButton) {
        saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.className = 'bx-btn';
        saveButton.dataset.bxSave = '1';
        saveButton.textContent = 'सेटिंग सहेजें';
        container.append(saveButton);
      }
      if (container.dataset.bxBound === '1') return;
      container.dataset.bxBound = '1';
      let pending = false;
      saveButton.addEventListener('click', async () => {
        if (pending) return;
        pending = true;
        saveButton.disabled = true;
        try {
          container.querySelectorAll('input[data-g][data-k]').forEach(input => {
            BX.config[input.dataset.g][input.dataset.k] = input.checked;
          });
          const notice = container.querySelector('#bx-notice-in');
          BX.config.notice = notice ? notice.value.trim().slice(0,140) : '';
          await BX.save(BX.config);
          BX.apply();
          saveButton.textContent = 'सहेज दिया (इस डिवाइस पर)';
        } catch (error) {
          console.error('Mobile profile settings could not be saved.', error);
          saveButton.textContent = 'सहेजना विफल';
        } finally {
          pending = false;
          saveButton.disabled = false;
          window.setTimeout(() => { saveButton.textContent = 'सेटिंग सहेजें'; }, 1800);
        }
      });
    }
  };

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const opener = target.closest('[data-bx-open]');
    const closer = target.closest('[data-bx-close]');
    if (opener) {
      const panel = document.getElementById(opener.dataset.bxOpen);
      if (panel) {
        panel.classList.add('open');
        if (panel.classList.contains('bx-sheet')) panel.setAttribute('aria-modal','true');
      }
    }
    if (closer) {
      const panel = document.getElementById(closer.dataset.bxClose);
      if (panel) {
        panel.classList.remove('open');
        panel.removeAttribute('aria-modal');
      }
    }
    if (target.classList.contains('bx-sheet')) {
      target.classList.remove('open');
      target.removeAttribute('aria-modal');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.bx-search.open, .bx-sheet.open').forEach(panel => {
      panel.classList.remove('open');
      panel.removeAttribute('aria-modal');
    });
  });
  document.addEventListener('DOMContentLoaded', () => { BX.init(); });
  if (document.readyState !== 'loading') BX.init();
})();
