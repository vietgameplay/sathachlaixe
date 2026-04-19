// ============================================================
// Hash router — simple stateful SPA.
// Routes:
//   #/home                — home tile grid (default landing inside app)
//   #/learn               — chapter picker (uses selected level)
//   #/learn/:cat          — DoScreen in LEARN mode
//   #/tests               — practice test list
//   #/quiz/:testId        — QUIZ mode (timed)
//   #/exam/:mode          — exam-style (mode: practice|exam)
//   #/result/:kind/:key   — result screen
//   #/signs               — sign type list
//   #/signs/:typeId       — signs of a type
//   #/maps                — sa hình list
//   #/tips                — mẹo list
//   #/stats               — thống kê
//   #/wrong               — câu sai (từ stats)
//   #/licenses            — license picker screen
//   #/settings            — cài đặt
// ============================================================
(function (root) {
  const R = { routes: [], handlers: {} };

  function on(pattern, handler) {
    // "#/learn/:cat" → regex
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/\//g, "\\/").replace(/:(\w+)/g, (_, k) => {
      keys.push(k);
      return "([^/]+)";
    }) + "\\/?$");
    R.routes.push({ re, keys, handler, pattern });
  }

  function currentHash() {
    const h = location.hash || "#/home";
    const [path, query = ""] = h.slice(1).split("?");
    return { path, query };
  }

  function parseQuery(q) {
    const out = {};
    if (!q) return out;
    for (const p of q.split("&")) {
      if (!p) continue;
      const [k, v = ""] = p.split("=");
      out[decodeURIComponent(k)] = decodeURIComponent(v);
    }
    return out;
  }

  async function dispatch() {
    const { path, query } = currentHash();
    const q = parseQuery(query);
    for (const r of R.routes) {
      const m = path.match(r.re);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      try {
        await r.handler(params, q);
      } catch (e) {
        console.error("Route handler error", path, e);
        const main = document.getElementById("app-main");
        if (main) main.innerHTML = `<div class="card"><h3>Lỗi</h3><p>${e.message || e}</p></div>`;
      }
      return;
    }
    // fallback → home
    location.hash = "#/home";
  }

  function start() {
    window.addEventListener("hashchange", dispatch);
    dispatch();
  }

  function go(hash) {
    if (location.hash === hash) dispatch();
    else location.hash = hash;
  }

  root.Router = { on, start, go, currentHash, parseQuery };
})(window);
