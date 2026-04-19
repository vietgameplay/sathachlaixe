// ============================================================
// Storage — localStorage-backed replacement for UserDataRepository.
// Persists: selected level, question stats (chooseLearn + lastFailed),
// test-session attempts (passed count / last score), onboarding flag.
// ============================================================
(function (root) {
  const NS = "shlx:";
  const KEY_LEVEL = NS + "level";
  const KEY_ONBOARD = NS + "onboarded";
  const KEY_QSTATS = NS + "qstats";       // { "<qid>": { choose, fail } }
  const KEY_TSTATS = NS + "tstats";       // { "<testId>": { attempts, passed, lastScore } }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function getLevel() { return read(KEY_LEVEL, 4); /* default "B" */ }
  function setLevel(id) { write(KEY_LEVEL, Number(id) || 4); }

  function isOnboarded() { return read(KEY_ONBOARD, false) === true; }
  function markOnboarded() { write(KEY_ONBOARD, true); }

  // ── Question stats ──────────────────────────────────────────────
  function qstatsAll() { return read(KEY_QSTATS, {}); }
  function qstat(id) { return qstatsAll()[id] || { choose: 0, fail: false }; }
  function setQuestionChoice(id, chosen, correct) {
    const all = qstatsAll();
    const prev = all[id] || { choose: 0, fail: false };
    all[id] = {
      choose: chosen,
      // keep fail sticky once the user got it wrong, unless they later
      // answered it correctly (mirrors iOS chooseLearn/lastFailed logic).
      fail: correct ? false : true,
    };
    write(KEY_QSTATS, all);
  }
  function clearQuestionStats() { write(KEY_QSTATS, {}); }

  function wrongQuestionIds() {
    const all = qstatsAll();
    const out = [];
    for (const [id, s] of Object.entries(all)) if (s.fail) out.push(Number(id));
    return out;
  }

  function correctCountIn(ids) {
    const all = qstatsAll();
    let n = 0;
    for (const id of ids) {
      const s = all[id];
      if (s && s.choose && !s.fail) n++;
    }
    return n;
  }

  // ── Test stats ──────────────────────────────────────────────────
  function tstatsAll() { return read(KEY_TSTATS, {}); }
  function tstat(testId) { return tstatsAll()[testId] || { attempts: 0, passed: 0, lastScore: null }; }
  function recordTestAttempt(testId, score, passed, total) {
    const all = tstatsAll();
    const prev = all[testId] || { attempts: 0, passed: 0, lastScore: null };
    all[testId] = {
      attempts: prev.attempts + 1,
      passed: prev.passed + (passed ? 1 : 0),
      lastScore: score,
      lastTotal: total,
      lastAt: Date.now(),
    };
    write(KEY_TSTATS, all);
  }
  function clearTestStats() { write(KEY_TSTATS, {}); }

  function clearAll() {
    clearQuestionStats();
    clearTestStats();
  }

  root.Storage = {
    getLevel, setLevel,
    isOnboarded, markOnboarded,
    qstat, qstatsAll, setQuestionChoice, clearQuestionStats,
    wrongQuestionIds, correctCountIn,
    tstat, tstatsAll, recordTestAttempt, clearTestStats,
    clearAll,
  };
})(window);
