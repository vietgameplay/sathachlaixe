// ============================================================
// TestGenerator — port of shared/TestGenerator.kt
// Builds randomized practice-test question ID lists for any license.
// Format layout: [all, die, concept, culture, skill, repair, sign, map]
// ============================================================
(function (root) {
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildPool(pool, needed) {
    if (!pool || pool.length === 0) return [];
    const result = [];
    let bag = pool.slice();
    while (result.length < needed) {
      bag = shuffle(bag);
      const last = result[result.length - 1];
      if (last != null && bag[0] === last && bag.length > 1) {
        const swapIdx = 1 + Math.floor(Math.random() * (bag.length - 1));
        const tmp = bag[0];
        bag[0] = bag[swapIdx];
        bag[swapIdx] = tmp;
      }
      for (const x of bag) result.push(x);
    }
    return result.slice(0, needed);
  }

  /**
   * Generate `numTests` tests.
   * @param {number} numTests
   * @param {number[]} format length 8 — [all, die, concept, culture, skill, repair, sign, map]
   * @param {number[]} diePool pool of điểm-liệt IDs
   * @param {number[][]} exPools six non-die pools in order [concept, culture, skill, repair, sign, map]
   * @returns {number[][]} each inner list is sorted asc
   */
  function generate(numTests, format, diePool, exPools) {
    if (format.length !== 8) throw new Error("format must have length 8");
    if (exPools.length !== 6) throw new Error("exPools must have length 6");

    const dieQuestions = buildPool(diePool, numTests);
    const catLimits = format.slice(2, 8);

    const catBatches = catLimits.map((limit, catIdx) => {
      const pool = exPools[catIdx];
      if (limit === 0 || !pool || pool.length === 0) {
        return Array(numTests).fill(null).map(() => []);
      }
      const poolFull = buildPool(pool, numTests * limit);
      const out = [];
      for (let i = 0; i < numTests; i++) {
        out.push(poolFull.slice(i * limit, i * limit + limit));
      }
      return out;
    });

    const tests = [];
    for (let i = 0; i < numTests; i++) {
      const merged = [dieQuestions[i]];
      for (const batches of catBatches) {
        for (const q of batches[i]) merged.push(q);
      }
      merged.sort((a, b) => a - b);
      tests.push(merged);
    }
    return tests;
  }

  root.TestGenerator = { generate };
})(window);
