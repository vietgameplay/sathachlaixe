// ============================================================
// App entry — wires routes and kicks off data load.
// ============================================================
(async function () {
  Screens.showLoading();
  try {
    await Data.load();
  } catch (e) {
    document.getElementById("app-main").innerHTML =
      `<div class="card"><h3>Không tải được dữ liệu</h3>
      <p>${e.message || e}</p></div>`;
    return;
  }

  // Respect ?level=<id> query on first home load (coming from landing).
  (function applyLevelQuery() {
    const { path, query } = Router.currentHash();
    if (path !== "/home") return;
    const q = Router.parseQuery(query);
    if (q.level) {
      const id = Number(q.level);
      if (id >= 1 && id <= 15) Storage.setLevel(id);
    }
  })();

  Router.on("/home",            () => Screens.renderHome());
  Router.on("/licenses",        () => Screens.renderLicenses());
  Router.on("/learn",           () => Screens.renderLearn());
  Router.on("/learn/:cat",      (p) => Screens.renderLearnCat(p));
  Router.on("/tests",           () => Screens.renderTests());
  Router.on("/quiz/:testId",    (p) => Screens.renderQuizById(p));
  Router.on("/exam/:mode",      (p) => Screens.renderExam(p));
  Router.on("/wrong",           () => Screens.renderWrong());
  Router.on("/result",          () => Screens.renderResult());
  Router.on("/signs",           () => Screens.renderSigns());
  Router.on("/signs/:typeId",   (p) => Screens.renderSignsOfType(p));
  Router.on("/maps",            () => Screens.renderMaps());
  Router.on("/tips",            () => Screens.renderTips());
  Router.on("/stats",           () => Screens.renderStats());
  Router.on("/settings",        () => Screens.renderSettings());

  Router.start();
})();
