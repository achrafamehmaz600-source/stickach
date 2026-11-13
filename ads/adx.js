/* ============================================================
   Adsterra loader — event-driven, one isolated frame per banner.
   Exact tags:
     300x250 532a8b458bacf8c43b9f30d2db0c718c
     320x50  fce890e7f5a5b22e397e0694f82567d9
     728x90  be51c8f486a1005b28d10933b31fc038
   Native container is rendered by its own async script in each page.

   Slots start collapsed. They are revealed only when the ad markup
   actually exists. No fixed failure timeouts are used.
   ============================================================ */
(function () {
  'use strict';

  if (window.__adxLoader) return;
  window.__adxLoader = true;

  var DESKTOP_MIN = 800;

  var FORMATS = {
    '320x50': {
      width: 320,
      height: 50,
      key: 'fce890e7f5a5b22e397e0694f82567d9'
    },
    '728x90': {
      width: 728,
      height: 90,
      key: 'be51c8f486a1005b28d10933b31fc038'
    },
    '300x250': {
      width: 300,
      height: 250,
      key: '532a8b458bacf8c43b9f30d2db0c718c'
    }
  };

  var slotSeq = 0;
  var pendingFrames = {};
  var fitObservers = [];

  function isDesktop() {
    return window.matchMedia('(min-width: ' + DESKTOP_MIN + 'px)').matches;
  }

  function pickFormat(slot) {
    var name = isDesktop()
      ? slot.getAttribute('data-adx-desktop')
      : slot.getAttribute('data-adx-mobile');

    if (!name || !FORMATS[name]) return null;
    return { name: name, cfg: FORMATS[name] };
  }

  function setState(slot, state) {
    slot.setAttribute('data-adx-state', state);
  }

  function markFilled(slot) {
    if (!slot || slot.getAttribute('data-adx-state') === 'filled') return;
    setState(slot, 'filled');
    slot.classList.add('is-filled');
    slot.removeAttribute('aria-hidden');

    /* The filled slot can be wider than its collapsed state. Refit
       synchronously so the creative is never left scaled down. */
    if (slot.__adxFit) slot.__adxFit();
  }

  function fit(frame, stage, width, height) {
    if (!frame || !stage) return;
    var available = frame.clientWidth || width;
    var scale = Math.min(1, available / width);

    stage.style.width = width + 'px';
    stage.style.height = height + 'px';
    stage.style.transform = scale < 1 ? 'scale(' + scale.toFixed(4) + ')' : '';
    frame.style.height = Math.ceil(height * scale) + 'px';
  }

  /* Runs inside the banner's srcdoc document. It reports back only
     when real ad markup exists, or when the ad script fails. */
  function adBridge(token, key) {
    var done = false;

    function notify(state) {
      if (done) return;
      done = true;
      try {
        parent.postMessage({ adxToken: token, adxState: state }, '*');
      } catch (err) {}
    }

    function hasVisibleMarkup(root) {
      if (!root) return false;
      if (root.querySelector('iframe,img,ins,object,embed,video')) return true;

      var clone = root.cloneNode(true);
      var junk = clone.querySelectorAll('script,style,noscript,template');
      for (var i = 0; i < junk.length; i++) {
        if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
      }

      return (clone.textContent || '').replace(/\s+/g, ' ').trim().length > 2;
    }

    function hasDirectMarkup(root) {
      if (!root) return false;
      if (root.querySelector('img,ins,object,embed,video')) return true;

      var clone = root.cloneNode(true);
      var junk = clone.querySelectorAll('script,style,noscript,template');
      for (var i = 0; i < junk.length; i++) {
        if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
      }

      return (clone.textContent || '').replace(/\s+/g, ' ').trim().length > 2;
    }

    function directAd() {
      if (!document.body) return false;
      return hasDirectMarkup(document.body);
    }

    function watchFrame(frame) {
      if (frame.__adxWatched) return;
      frame.__adxWatched = true;

      var doc = null;

      try {
        doc = frame.contentDocument;
      } catch (err) {
        /* A cross-origin frame that actually navigated is treated as filled. */
        notify('filled');
        return;
      }

      if (!doc) {
        notify('filled');
        return;
      }

      if (hasVisibleMarkup(doc.body)) {
        notify('filled');
        return;
      }

      try {
        var observer = new MutationObserver(function () {
          if (hasVisibleMarkup(doc.body)) notify('filled');
        });
        observer.observe(doc.documentElement || doc, { childList: true, subtree: true });
      } catch (err) {}

      frame.addEventListener('load', function () {
        try {
          if (hasVisibleMarkup(frame.contentDocument && frame.contentDocument.body)) {
            notify('filled');
          }
        } catch (err) {
          notify('filled');
        }
      });
    }

    function check() {
      if (done) return;

      if (directAd()) {
        notify('filled');
        return;
      }

      var frames = document.querySelectorAll('iframe');
      for (var i = 0; i < frames.length; i++) {
        watchFrame(frames[i]);
      }
    }

    try {
      new MutationObserver(check).observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    } catch (err) {}

    window.addEventListener('load', check);

    var script = document.createElement('script');
    script.src = 'https://bauval.org/22/' + key;
    script.onerror = function () { notify('error'); };
    document.body.appendChild(script);

    check();
  }

  function adDocument(cfg, token) {
    var options = '{"key":' + JSON.stringify(cfg.key) + ',"format":"iframe","height":' +
      cfg.height + ',"width":' + cfg.width + ',"params":{}}';

    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>html,body{margin:0;padding:0;width:100%;height:100%;' +
      'overflow:hidden;background:transparent}' +
      'iframe{display:block;border:0;margin:0;padding:0}</style></head><body>' +
      '<script>atOptions = ' + options + ';<\/script>' +
      '<script>(' + adBridge.toString() + ')(' + JSON.stringify(token) + ',' +
      JSON.stringify(cfg.key) + ');<\/script>' +
      '</body></html>';
  }

  function loadBanner(slot) {
    var frame = slot.querySelector('.adx-frame');
    if (!frame || frame.getAttribute('data-adx-loaded') === '1') return;

    var choice = pickFormat(slot);
    if (!choice) {
      setState(slot, 'unfilled');
      return;
    }

    var cfg = choice.cfg;
    var token = 'adx' + (++slotSeq);
    var stage = document.createElement('div');
    stage.className = 'adx-stage';

    var adFrame = document.createElement('iframe');
    adFrame.width = String(cfg.width);
    adFrame.height = String(cfg.height);
    adFrame.scrolling = 'no';
    adFrame.setAttribute('frameborder', '0');
    adFrame.setAttribute('title', 'Advertisement');
    adFrame.setAttribute('aria-label', 'Advertisement');
    adFrame.srcdoc = adDocument(cfg, token);

    stage.appendChild(adFrame);
    frame.appendChild(stage);
    frame.setAttribute('data-adx-loaded', '1');
    fit(frame, stage, cfg.width, cfg.height);

    slot.__adxFit = function () {
      fit(frame, stage, cfg.width, cfg.height);
    };

    pendingFrames[token] = { slot: slot, frame: adFrame };

    if ('ResizeObserver' in window) {
      var observer = new ResizeObserver(function () {
        fit(frame, stage, cfg.width, cfg.height);
      });
      observer.observe(frame);
      fitObservers.push(observer);
    }

    window.addEventListener('resize', function () {
      fit(frame, stage, cfg.width, cfg.height);
    });
  }

  function hasNativeContent(box, container) {
    if (container.querySelector('iframe, img, ins, object, embed, video')) {
      return true;
    }

    var clone = container.cloneNode(true);
    var junk = clone.querySelectorAll('script, style, noscript, template');
    for (var i = 0; i < junk.length; i++) {
      if (junk[i].parentNode) junk[i].parentNode.removeChild(junk[i]);
    }

    var text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 0;
  }

  function watchNative(slot) {
    var box = slot.querySelector('.adx-native-box');
    if (!box) return;

    var container = box.querySelector('[id^="container-"]') || box;

    function apply() {
      if (hasNativeContent(box, container)) {
        markFilled(slot);
        if (observer) observer.disconnect();
      }
    }

    var observer = null;
    if ('MutationObserver' in window) {
      observer = new MutationObserver(apply);
      observer.observe(box, { childList: true, subtree: true });
    }

    apply();
  }

  function init() {
    var slots = document.querySelectorAll('[data-adx]');

    for (var i = 0; i < slots.length; i++) {
      var slot = slots[i];
      setState(slot, 'loading');
      slot.setAttribute('aria-hidden', 'true');

      if (slot.getAttribute('data-adx') === 'native') {
        watchNative(slot);
      } else {
        loadBanner(slot);
      }
    }

    /* Keep the in-grid banner out of filtered search results. */
    var search = document.getElementById('game-search');
    var gridAd = document.querySelector('.adx-grid-break');

    if (search && gridAd) {
      search.addEventListener('input', function () {
        gridAd.hidden = search.value.trim().length > 0;
      });

      search.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          gridAd.hidden = search.value.trim().length > 0;
        }
      });
    }
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || !data.adxToken || !data.adxState) return;

    var pending = pendingFrames[data.adxToken];
    if (!pending) return;
    if (event.source !== pending.frame.contentWindow) return;

    if (data.adxState === 'filled') {
      markFilled(pending.slot);
    } else if (data.adxState === 'error') {
      setState(pending.slot, 'failed');
    }

    delete pendingFrames[data.adxToken];
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
