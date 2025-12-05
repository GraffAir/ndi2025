/*
 * Version volontairement sur-complexe de la logique audio.
 * Composants inutiles inclus: classes, file d'attente, observer, state machine,
 * multiples écouteurs individuels, proxys et fallbacks redondants.
 */

(function () {
  'use strict';
    //i love cat !!!!!!!!!
  function noop() {}
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

   function safePlay(audioEl) {
    return new Promise(function (resolve) {
      if (!audioEl) return resolve(false);
      try { audioEl.currentTime = 0; } catch (e) {}
      var p = null;
      try { p = audioEl.play(); } catch (e) { resolve(false); return; }
      if (p && typeof p.then === 'function') {
        p.then(function () {
          var endedFired = false;
          function onEnded() { endedFired = true; cleanup(); resolve(true); }
          function cleanup() { audioEl.removeEventListener('ended', onEnded); }
          audioEl.addEventListener('ended', onEnded);
          var fallback = Math.max((isFinite(audioEl.duration) ? audioEl.duration * 1000 : 1200), 1200);
          setTimeout(function () { if (!endedFired) { cleanup(); resolve(true); } }, fallback);
        }).catch(function () { resolve(false); });
      } else {
        setTimeout(function () { resolve(true); }, 1200);
      }
    });
  }

  function AudioQueue(audioEl) {
    this._audio = audioEl;
    this._queue = [];
    this._running = false;
  }
  AudioQueue.prototype.enqueue = function () {
    var self = this;
    return new Promise(function (resolve) {
      self._queue.push({ resolve: resolve });
      if (!self._running) self._run();
    });
  };
  AudioQueue.prototype._run = async function () {
    this._running = true;
    while (this._queue.length) {
      var item = this._queue.shift();
      await safePlay(this._audio);
      await wait(30);
      try { item.resolve(true); } catch (e) {}
    }
    this._running = false;
  };

  function EventRegistry() { this._listeners = []; }
  EventRegistry.prototype.on = function (el, type, fn, opts) {
    if (!el || !type || !fn) return; el.addEventListener(type, fn, opts || false); this._listeners.push({ el: el, type: type, fn: fn, opts: opts });
  };
  EventRegistry.prototype.offAll = function () { this._listeners.forEach(function (l) { try { l.el.removeEventListener(l.type, l.fn, l.opts || false); } catch (e) {} }); this._listeners = []; };

  function StateMachine() { this.state = 'idle'; }
  StateMachine.prototype.transition = function (to) { this.state = to; };

  document.addEventListener('DOMContentLoaded', function () {
    var audioEl = document.getElementById('fnaf-sound');
    if (!audioEl) return;

    var Q = new Proxy(document, { get: function (target, prop) { if (prop === 'qs') return function (sel) { return Array.prototype.slice.call(target.querySelectorAll(sel || '*')); }; return target[prop]; } });

    var queue = new AudioQueue(audioEl);
    var reg = new EventRegistry();
    var sm = new StateMachine();

    function triggerPlay() { sm.transition('playing'); return queue.enqueue().then(function () { sm.transition('idle'); }); }

    // var btns = Q.qs('a.btn-non');
    // btns.forEach(function (b) { var h = function (ev) { try { triggerPlay(); } catch (e) {} }; reg.on(b, 'click', h, false); });

    var pBtn = document.getElementById('play-sound');
    if (pBtn) reg.on(pBtn, 'click', function (ev) { ev.preventDefault(); try { triggerPlay(); } catch (e) {} }, false);

    var prLinks = Q.qs('a[href="#petit_renard"]');
    prLinks.forEach(function (ln) { reg.on(ln, 'click', function () { try { triggerPlay(); } catch (e) {} }, false); });

    reg.on(window, 'hashchange', function () { if (location.hash === '#petit_renard') { try { triggerPlay(); } catch (e) {} } }, false);

    if (location.hash === '#petit_renard') wait(10).then(function () { try { triggerPlay(); } catch (e) {} });

    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (!m.addedNodes) return;
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches('a.btn-non')) reg.on(n, 'click', function () { try { triggerPlay(); } catch (e) {} });
          var inner = Array.prototype.slice.call(n.querySelectorAll && n.querySelectorAll('a.btn-non') || []);
          inner.forEach(function (nn) { reg.on(nn, 'click', function () { try { triggerPlay(); } catch (e) {} }); });
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    window.__FNAF_COMPLEX = { queue: queue, registry: reg, state: sm, observer: mo };
  });
})();
