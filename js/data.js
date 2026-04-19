// ============================================================
// Data loader — fetches JSON bundle, exposes O(1) lookups.
// Mirrors ShlxRepository.kt in shape.
// ============================================================
(function (root) {
  const D = { loaded: false };

  async function fetchJson(name) {
    // Some bundled JSONs have trailing commas (Kotlin's parser tolerates
    // them). Use a lenient cleanup before JSON.parse so we don't have to
    // rewrite the source files.
    const res = await fetch(`data/${name}.json`);
    if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (_) {
      // strip ",}" and ",]" style trailing commas
      const cleaned = text.replace(/,(\s*[}\]])/g, "$1");
      return JSON.parse(cleaned);
    }
  }

  async function load() {
    if (D.loaded) return D;
    const [
      licenses, tests, questions,
      signs, signTypes, tips, maps, chapters,
    ] = await Promise.all([
      fetchJson("licenses"),
      fetchJson("tests"),
      fetchJson("questions"),
      fetchJson("signs"),
      fetchJson("signTypes"),
      fetchJson("tips"),
      fetchJson("maps"),
      fetchJson("chapters"),
    ]);

    D.licenses = licenses;
    D.tests = tests;
    D.questions = questions;
    D.signs = signs;
    D.signTypes = signTypes;
    D.tips = tips;
    D.maps = maps;
    D.chapters = chapters;

    D.questionsById = {};
    for (const q of questions) D.questionsById[q.id] = q;
    D.testsById = {};
    for (const t of tests) D.testsById[t.id] = t;
    D.licenseById = {};
    D.licenseByName = {};
    for (const l of licenses) {
      D.licenseById[l.id] = l;
      D.licenseByName[l.name] = l;
    }

    D.loaded = true;
    return D;
  }

  // ── Convenience queries (mirror Kotlin ShlxRepository) ──────────

  function license(id) { return D.licenseById[id]; }
  function licenseByName(name) { return D.licenseByName[name]; }
  function question(id) { return D.questionsById[id]; }
  function test(id) { return D.testsById[id]; }

  /** Tests for a license (practice tests, size<=60, match by licenseID name). */
  function testsFor(lic) {
    return D.tests.filter(t =>
      t.licenseID === lic.name &&
      Array.isArray(t.questionIDs) &&
      t.questionIDs.length > 0 &&
      t.questionIDs.length <= 60
    );
  }

  function testsForLicenseId(id) {
    const lic = license(id);
    return lic ? testsFor(lic) : [];
  }

  function questionsForTest(t) {
    const qs = [];
    for (const id of t.questionIDs) {
      const q = D.questionsById[id];
      if (q) qs.push(q);
    }
    return qs;
  }

  function signsOfType(typeId) {
    return D.signs.filter(s => s.type === typeId);
  }

  function getQuestions(levelName, cat) {
    const pools = window.QuestionPools.catsExFor(levelName);
    const ids = pools[cat] || [];
    return ids.map(id => D.questionsById[id]).filter(Boolean);
  }

  /** Maps (Sa hình) — the iOS app filters by `rank` matching license. */
  function mapsForLevel(levelName) {
    // The bundled maps.json uses `rank` optionally; if missing, show all.
    const withRank = D.maps.filter(m => m && m.rank);
    if (withRank.length === 0) return D.maps;
    // Accept any map whose `rank` contains this level name.
    return D.maps.filter(m => !m.rank || String(m.rank).toUpperCase().includes(levelName));
  }

  root.Data = {
    load, state: D,
    license, licenseByName, question, test,
    testsFor, testsForLicenseId, questionsForTest,
    signsOfType, getQuestions, mapsForLevel,
  };
})(window);
