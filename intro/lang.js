/* SwimSync 자동 번역
 * - 처음 방문하면 브라우저 언어를 보고 맞는 언어로 자동 번역해요(한국어 브라우저는 그대로).
 * - 오른쪽 위 언어 선택으로 언제든 바꿀 수 있고, 고른 언어는 다음 방문에도 유지돼요.
 * - 번역은 구글 번역(웹사이트 번역)을 써요. 한국어가 아닐 때만 번역 스크립트를 불러와요.
 */
(function () {
  var LANGS = [
    ['ko', '한국어'], ['en', 'English'], ['ja', '日本語'], ['zh-CN', '简体中文'],
    ['zh-TW', '繁體中文'], ['vi', 'Tiếng Việt'], ['th', 'ไทย'], ['es', 'Español']
  ];
  var KEY = 'swimsync-lang';

  function store(v) { try { if (v === undefined) return localStorage.getItem(KEY); localStorage.setItem(KEY, v); } catch (e) { return null; } }
  function cookieLang() { var m = document.cookie.match(/(?:^|;\s*)googtrans=\/ko\/([^;]+)/); return m ? decodeURIComponent(m[1]) : 'ko'; }
  function writeCookie(lang) {
    var host = location.hostname, past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    if (lang === 'ko') {
      document.cookie = 'googtrans=; expires=' + past + '; path=/';
      document.cookie = 'googtrans=; expires=' + past + '; path=/; domain=' + host;
      document.cookie = 'googtrans=; expires=' + past + '; path=/; domain=.' + host;
    } else {
      document.cookie = 'googtrans=/ko/' + lang + '; path=/';
      document.cookie = 'googtrans=/ko/' + lang + '; path=/; domain=' + host;
    }
  }
  function fromBrowser() {
    var list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'ko']);
    var l = String(list[0] || 'ko').toLowerCase();
    if (l.indexOf('ko') === 0) return 'ko';
    if (l.indexOf('ja') === 0) return 'ja';
    if (l === 'zh-tw' || l === 'zh-hk' || l.indexOf('zh-hant') === 0) return 'zh-TW';
    if (l.indexOf('zh') === 0) return 'zh-CN';
    if (l.indexOf('vi') === 0) return 'vi';
    if (l.indexOf('th') === 0) return 'th';
    if (l.indexOf('es') === 0) return 'es';
    return 'en';
  }
  function setLang(lang) {
    store(lang); writeCookie(lang);
    location.reload();
  }

  // 1) 처음 방문: 브라우저 언어로 자동 선택
  var saved = store();
  if (!saved) {
    saved = fromBrowser();
    store(saved);
    if (saved !== 'ko' && cookieLang() !== saved) { writeCookie(saved); }
  }
  var current = saved || 'ko';
  if (cookieLang() !== current) writeCookie(current);

  // 2) 한국어가 아니면 구글 번역 불러오기
  if (current !== 'ko') {
    window.googleTranslateElementInit = function () {
      new window.google.translate.TranslateElement({ pageLanguage: 'ko', autoDisplay: false }, 'ss-gt');
    };
    var holder = document.createElement('div'); holder.id = 'ss-gt'; holder.style.display = 'none';
    document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(holder); });
    var s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true; document.head.appendChild(s);
  }

  // 3) 구글 번역 막대 숨기기 + 언어 선택 모양
  var css = document.createElement('style');
  css.textContent =
    '.goog-te-banner-frame,.skiptranslate>iframe,#goog-gt-tt,.goog-te-balloon-frame,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf{display:none!important}' +
    'body{top:0!important;position:static!important}' +
    '.goog-text-highlight{background:none!important;box-shadow:none!important}' +
    '.ss-lang{position:relative;display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 10px;border:1px solid var(--line,#E6E8F0);border-radius:10px;color:var(--soft,#4A4F66);font-size:14px;font-weight:500;background:transparent}' +
    '.ss-lang svg{width:16px;height:16px;flex:none}' +
    '.ss-lang select{all:unset;cursor:pointer;padding-right:2px;font:inherit;color:inherit}' +
    '.ss-lang select option{color:#0F1222;background:#fff}' +
    '.ss-lang:focus-within{outline:3px solid var(--brand,#0063EC);outline-offset:2px}';
  document.head.appendChild(css);

  // 4) 언어 선택 상자 그리기: <span data-lang-picker></span> 자리에 들어가요
  function mount() {
    document.querySelectorAll('[data-lang-picker]').forEach(function (slot) {
      var wrap = document.createElement('label');
      wrap.className = 'ss-lang notranslate'; wrap.setAttribute('translate', 'no');
      wrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
      var sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Language / 언어');
      LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = l[1]; if (l[0] === current) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () { setLang(sel.value); });
      wrap.appendChild(sel);
      slot.replaceWith(wrap);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
