// ============================================================
// Screens — renders each SPA view into #app-main.
// Port of Compose screens in androidApp/.../ui/*.
// Keeps state in closure-scoped objects per screen (no framework).
// ============================================================
(function (root) {
  const $ = (sel, el = document) => el.querySelector(sel);
  const main = () => document.getElementById("app-main");

  function setTitle(title) {
    const el = document.getElementById("app-title");
    if (el) el.textContent = title;
  }
  function setBack(handler) {
    const btn = document.getElementById("app-back");
    if (!btn) return;
    if (handler) {
      btn.classList.remove("hidden");
      btn.onclick = (e) => { e.preventDefault(); handler(); };
    } else {
      btn.classList.add("hidden");
      btn.onclick = null;
    }
  }
  function setActiveNav(key) {
    document.querySelectorAll(".bottom-nav a").forEach(a =>
      a.classList.toggle("active", a.dataset.nav === key)
    );
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showLoading() {
    main().innerHTML = `<div class="loading"><div class="spinner"></div>Đang tải…</div>`;
  }

  function currentLevelName() {
    const id = Storage.getLevel();
    return QuestionPools.LEVEL_BY_ID[id] || "B";
  }
  function currentLicense() {
    const lic = Data.licenseByName(currentLevelName());
    return lic || Data.state.licenses[0];
  }

  function questionImage(q) {
    if (!q.image) return "";
    return `imgs/questions/${esc(q.image)}`;
  }
  function signImage(sg) {
    return `imgs/signs/sign${esc(sg.image)}.png`;
  }

  // ── Home ────────────────────────────────────────────────────────
  function renderHome() {
    setTitle("sathachlaixe.org");
    setBack(null);
    setActiveNav("home");
    const lic = currentLicense();
    const tiles = [
      { hash: "#/learn",    label: "Học lý thuyết",    sub: "Theo chương", ico: "ebook", bg: "#E8F0FF", fg: "#3A8DFF" },
      { hash: "#/tests",    label: "Bộ đề thi thử",    sub: "Theo hạng",   ico: "exam",  bg: "#E7F7EF", fg: "#2BB673" },
      { hash: "#/exam/exam",label: "Thi mô phỏng",     sub: "Bấm giờ",     ico: "tests", bg: "#FDE9E4", fg: "#EC3C1A" },
      { hash: "#/signs",    label: "Biển báo",         sub: "Tra cứu",     ico: "sign",  bg: "#FFF7DF", fg: "#D99400" },
      { hash: "#/maps",     label: "Sa hình",          sub: "11 bài",      ico: "road",  bg: "#F0ECFF", fg: "#6E5AE6" },
      { hash: "#/tips",     label: "Mẹo ghi nhớ",      sub: "Tổng hợp",    ico: "idea",  bg: "#EAF2FF", fg: "#1F73E3" },
      { hash: "#/stats",    label: "Thống kê",         sub: "Tiến độ",     ico: "license", bg: "#E7F7EF", fg: "#2BB673" },
      { hash: "#/wrong",    label: "Câu sai",          sub: "Ôn lại",      ico: "car",   bg: "#FDE9E4", fg: "#EC3C1A" },
      { hash: "#/licenses", label: "Chọn hạng GPLX",   sub: "15 hạng",     ico: "moto",  bg: "#F6F8FB", fg: "#1F2A36" },
    ];

    main().innerHTML = `
      <section class="home-hero">
        <h2>${esc(lic.title || lic.name)}</h2>
        <p>${esc(lic.detail || "").split("\\n")[0] || "Sẵn sàng ôn thi GPLX 2026."}</p>
        <button class="level-switch" id="home-switch-level">
          Đổi hạng (${esc(lic.name)}) →
        </button>
      </section>

      <h3 style="margin:14px 4px 8px">Chọn hoạt động</h3>
      <div class="grid-3">
        ${tiles.map(t => `
          <a class="home-tile" href="${t.hash}">
            <div class="tile-ico" style="background:${t.bg};color:${t.fg}">
              <img src="imgs/icons/${t.ico}.svg" width="22" height="22" alt="" />
            </div>
            <strong>${esc(t.label)}</strong>
            <small>${esc(t.sub)}</small>
          </a>
        `).join("")}
      </div>
    `;

    const btn = $("#home-switch-level");
    if (btn) btn.addEventListener("click", (e) => {
      e.preventDefault();
      Router.go("#/licenses");
    });
  }

  // ── License picker ──────────────────────────────────────────────
  function renderLicenses() {
    setTitle("Chọn hạng GPLX");
    setBack(() => history.back());
    setActiveNav("home");
    const cur = Storage.getLevel();
    const rows = Data.state.licenses.map(l => `
      <div class="level-row ${l.id === cur ? "active" : ""}" data-id="${l.id}">
        <div class="level-name">${esc(l.name)}</div>
        <div class="grow">
          <strong>${esc(l.title || l.name)}</strong>
          <div class="level-detail">${esc(l.detail || "").split("\\n")[0]}</div>
        </div>
        <div class="badge-gray">${l.total || ""} câu</div>
      </div>
    `).join("");
    main().innerHTML = `<div class="card" style="padding:6px">${rows}</div>`;
    main().querySelectorAll(".level-row").forEach(el => {
      el.addEventListener("click", () => {
        const id = Number(el.dataset.id);
        Storage.setLevel(id);
        Router.go("#/home");
      });
    });
  }

  // ── Learn (chapter list) ────────────────────────────────────────
  function renderLearn() {
    setTitle("Câu hỏi lý thuyết");
    setBack(() => Router.go("#/home"));
    setActiveNav("learn");
    const level = currentLevelName();
    const pools = QuestionPools.catsExFor(level);
    const types = QuestionPools.TYPES;
    const rows = types.map((title, cat) => {
      const ids = pools[cat] || [];
      const total = ids.length;
      const answered = Storage.correctCountIn(ids);
      const color = cat === 0 ? "#43CD87" : cat === 1 ? "#EC3C1A" : "#C1C1C1";
      const pct = total === 0 ? 0 : Math.round((answered / total) * 100);
      return `
        <div class="list-item" data-cat="${cat}">
          <div class="circle" style="background:${color}">${cat + 1}</div>
          <div class="grow">
            <div class="title">${esc(title)}</div>
            <div class="progress-bar"><span style="width:${pct}%"></span></div>
          </div>
          <div class="pill">${answered}/${total}</div>
        </div>`;
    }).join("");

    main().innerHTML = rows;
    main().querySelectorAll(".list-item").forEach(el => {
      el.addEventListener("click", () => {
        Router.go(`#/learn/${el.dataset.cat}`);
      });
    });
  }

  // ── Quiz (DoScreen) ─────────────────────────────────────────────
  //   mode: "learn" — no timer, commits chooseLearn on every tap
  //   mode: "test"  — per-test timer, scores on submit
  //   mode: "exam"  — simulation exam using TestGenerator
  //   mode: "wrong" — ôn lại câu sai
  function renderQuiz(ctx) {
    const { mode, questionIds, title, timeLimitSec, testId } = ctx;
    setTitle(title);
    setBack(() => { if (confirm("Rời màn làm bài? Tiến độ phiên này có thể mất.")) history.back(); });
    setActiveNav(null);

    const state = {
      ids: questionIds,
      index: 0,
      choices: new Map(),           // qId -> 1..4
      submitted: mode !== "learn" ? false : null, // learn never "submits"
      deadline: timeLimitSec ? Date.now() + timeLimitSec * 1000 : null,
      timerHandle: null,
    };

    function currentQ() { return Data.question(state.ids[state.index]); }

    function choicesTo(q) {
      if (state.submitted === true || mode === "learn" || mode === "wrong") {
        // reveal correct/wrong instantly in learn, or on submission
        return state.choices.get(q.id) || Storage.qstat(q.id).choose || 0;
      }
      return state.choices.get(q.id) || 0;
    }

    function render() {
      const q = currentQ();
      if (!q) {
        main().innerHTML = `<div class="card">Không có câu hỏi.</div>`;
        return;
      }
      const chose = state.choices.get(q.id) || 0;
      const answer = q.answer;
      const showResult = mode === "learn" || mode === "wrong" || state.submitted === true;

      // grid + timer bar
      let timerHtml = "";
      if (state.deadline) {
        const remain = Math.max(0, Math.round((state.deadline - Date.now()) / 1000));
        const mm = String(Math.floor(remain / 60)).padStart(2, "0");
        const ss = String(remain % 60).padStart(2, "0");
        timerHtml = `<div class="timer" id="quiz-timer">${mm}:${ss}</div>`;
      }

      const grid = state.ids.map((id, i) => {
        let cls = "q-cell";
        const stat = Storage.qstat(id);
        if (showResult) {
          const userChoice = mode === "learn"
            ? (state.choices.get(id) ?? stat.choose) || 0
            : (state.choices.get(id) || 0);
          const qObj = Data.question(id);
          if (userChoice) {
            cls += userChoice === qObj.answer ? " correct" : " wrong";
          }
        } else if (state.choices.get(id)) {
          cls += " answered";
        }
        if (i === state.index) cls += " current";
        return `<div class="${cls}" data-i="${i}">${i + 1}</div>`;
      }).join("");

      const options = [1, 2, 3, 4].map((n) => {
        const text = q[`option${n}`];
        if (!text) return "";
        let cls = "option";
        if (showResult) {
          if (n === answer) cls += " correct";
          else if (chose === n) cls += " wrong";
        } else if (chose === n) {
          cls += " chosen";
        }
        return `
          <div class="${cls}" data-opt="${n}">
            <span class="letter">${String.fromCharCode(64 + n)}</span>
            <span>${esc(text)}</span>
          </div>`;
      }).join("");

      const imgHtml = q.image
        ? `<img src="${questionImage(q)}" alt="" onerror="this.style.display='none'">`
        : "";
      const dieBadge = q.die ? `<span class="badge-red" style="margin-left:8px">ĐIỂM LIỆT</span>` : "";

      const explHtml = showResult && q.explanation
        ? `<div class="explanation"><strong>Giải thích:</strong> ${esc(q.explanation)}</div>`
        : "";

      const nav = `
        <div class="quiz-nav">
          <button class="btn btn-ghost" id="q-prev" ${state.index === 0 ? "disabled" : ""}>← Câu trước</button>
          <div class="grow center muted">${state.index + 1} / ${state.ids.length}</div>
          ${state.index === state.ids.length - 1 && !showResult && mode !== "learn"
            ? `<button class="btn btn-primary" id="q-submit">Nộp bài</button>`
            : `<button class="btn btn-primary" id="q-next" ${state.index === state.ids.length - 1 ? "disabled" : ""}>Câu tiếp →</button>`
          }
        </div>`;

      main().innerHTML = `
        ${timerHtml || mode !== "learn" ? `<div class="quiz-topbar">
          ${timerHtml}
          <div class="grow"><strong>${esc(title)}</strong></div>
          ${mode === "test" || mode === "exam"
            ? `<button class="btn btn-ghost btn-compact" id="q-submit-top">Nộp bài</button>`
            : ""}
        </div>` : ""}
        <div class="q-grid">${grid}</div>
        <div class="quiz-q">
          <span class="q-idx">Câu ${state.index + 1}${dieBadge}</span>
          <div class="q-content">${esc(q.content)}</div>
          ${imgHtml}
          ${options}
          ${explHtml}
        </div>
        ${nav}
      `;

      // wire events
      main().querySelectorAll(".q-cell").forEach(el => {
        el.addEventListener("click", () => {
          state.index = Number(el.dataset.i);
          render();
        });
      });
      main().querySelectorAll(".option").forEach(el => {
        el.addEventListener("click", () => {
          const n = Number(el.dataset.opt);
          if (mode === "learn" || mode === "wrong") {
            state.choices.set(q.id, n);
            const correct = n === q.answer;
            Storage.setQuestionChoice(q.id, n, correct);
          } else {
            if (state.submitted) return;
            state.choices.set(q.id, n);
          }
          render();
        });
      });
      const prev = $("#q-prev"); if (prev) prev.onclick = () => { if (state.index > 0) { state.index--; render(); } };
      const next = $("#q-next"); if (next) next.onclick = () => { if (state.index < state.ids.length - 1) { state.index++; render(); } };
      const sub = $("#q-submit");  if (sub) sub.onclick = () => doSubmit();
      const subTop = $("#q-submit-top"); if (subTop) subTop.onclick = () => doSubmit();
    }

    function doSubmit() {
      if (state.submitted) return;
      state.submitted = true;
      if (state.timerHandle) { clearInterval(state.timerHandle); state.timerHandle = null; }

      // record into storage so StatsScreen sees it
      let right = 0, wrong = 0, dieFail = false;
      for (const qid of state.ids) {
        const q = Data.question(qid);
        const c = state.choices.get(qid) || 0;
        if (c === 0) {
          // unanswered → counts as wrong
          if (q.die) dieFail = true;
          wrong++;
          Storage.setQuestionChoice(qid, 0, false);
        } else if (c === q.answer) {
          right++;
          Storage.setQuestionChoice(qid, c, true);
        } else {
          if (q.die) dieFail = true;
          wrong++;
          Storage.setQuestionChoice(qid, c, false);
        }
      }

      // compute pass/fail for tests and exams based on license threshold
      const lic = currentLicense();
      const threshold = lic.no_right || Math.ceil(state.ids.length * 0.8);
      const passed = right >= threshold && !dieFail;

      if (mode === "test" && testId != null) {
        Storage.recordTestAttempt(testId, right, passed, state.ids.length);
      }

      // jump to result screen
      const resultCtx = {
        mode, title, testId,
        total: state.ids.length, right, wrong,
        dieFail, threshold, passed,
        questionIds: state.ids.slice(),
        choices: Array.from(state.choices.entries()),
      };
      window.__lastResult = resultCtx;
      Router.go("#/result");
    }

    function startTimer() {
      if (!state.deadline) return;
      state.timerHandle = setInterval(() => {
        const remain = Math.max(0, Math.round((state.deadline - Date.now()) / 1000));
        const el = document.getElementById("quiz-timer");
        if (el) {
          const mm = String(Math.floor(remain / 60)).padStart(2, "0");
          const ss = String(remain % 60).padStart(2, "0");
          el.textContent = `${mm}:${ss}`;
        }
        if (remain <= 0) {
          clearInterval(state.timerHandle);
          state.timerHandle = null;
          if (!state.submitted) doSubmit();
        }
      }, 1000);
    }

    render();
    startTimer();
  }

  // ── Learn: DoScreen in LEARN mode ───────────────────────────────
  function renderLearnCat({ cat }) {
    const level = currentLevelName();
    const pools = QuestionPools.catsExFor(level);
    const ids = pools[Number(cat)] || [];
    const titles = QuestionPools.TYPES;
    if (ids.length === 0) {
      main().innerHTML = `<div class="card">Không có câu hỏi.</div>`;
      setTitle("Ôn tập"); setBack(() => Router.go("#/learn"));
      return;
    }
    renderQuiz({
      mode: "learn",
      title: titles[Number(cat)] || "Ôn tập",
      questionIds: ids,
      timeLimitSec: null,
    });
    setBack(() => Router.go("#/learn"));
  }

  // ── Tests list ──────────────────────────────────────────────────
  function renderTests() {
    setTitle("Bộ đề thi thử");
    setBack(() => Router.go("#/home"));
    setActiveNav("tests");
    const lic = currentLicense();
    const tests = Data.testsFor(lic);
    if (!tests.length) {
      main().innerHTML = `<div class="card">Chưa có đề thi cho hạng này.</div>`;
      return;
    }
    const rows = tests.map((t, i) => {
      const st = Storage.tstat(t.id);
      const badge = st.attempts === 0
        ? `<span class="badge-gray">Chưa thi</span>`
        : (st.lastScore >= (lic.no_right || 0) && (st.lastTotal || 0) > 0
            ? `<span class="badge-green">Đậu</span>`
            : `<span class="badge-red">Trượt</span>`);
      return `
        <div class="list-item" data-id="${t.id}">
          <div class="circle" style="background:#3A8DFF">${i + 1}</div>
          <div class="grow">
            <div class="title">Đề ${i + 1}</div>
            <div class="sub">${t.questionIDs.length} câu · ${lic.duration || 20} phút · cần đúng ${lic.no_right || 27}</div>
          </div>
          ${badge}
        </div>`;
    }).join("");
    main().innerHTML = `<div class="card" style="background:#EAF2FF;border-color:#CFE0FF;margin-bottom:10px">
      <strong>Hạng ${esc(lic.name)}</strong><br>
      <small class="muted">Cấu trúc đề: ${lic.no_in_test || 30} câu · cần đúng ${lic.no_right || 27} · thời gian ${lic.duration || 20} phút</small>
    </div>${rows}`;
    main().querySelectorAll(".list-item").forEach(el => {
      el.addEventListener("click", () => Router.go(`#/quiz/${el.dataset.id}`));
    });
  }

  // ── Quiz by test id ─────────────────────────────────────────────
  function renderQuizById({ testId }) {
    const t = Data.test(Number(testId));
    if (!t) {
      main().innerHTML = `<div class="card">Đề không tồn tại.</div>`;
      setBack(() => Router.go("#/tests"));
      return;
    }
    const lic = Data.licenseByName(t.licenseID) || currentLicense();
    renderQuiz({
      mode: "test",
      title: `Đề ${t.id} — Hạng ${t.licenseID}`,
      questionIds: t.questionIDs.slice(),
      timeLimitSec: (lic.duration || 20) * 60,
      testId: t.id,
    });
    setBack(() => Router.go("#/tests"));
  }

  // ── Exam (simulation) ───────────────────────────────────────────
  function renderExam({ mode }) {
    const level = currentLevelName();
    const lic = currentLicense();
    const format = QuestionPools.formatFor(level);
    const diePool = QuestionPools.diePoolFor(level);
    const exPools = QuestionPools.nonDiePoolsFor(level);
    // Build a 1-test generation using iOS format
    // Total = no_in_test from license — enforce by padding/truncating.
    const batch = TestGenerator.generate(1, format, diePool, exPools)[0] || [];
    const ids = batch.length >= (lic.no_in_test || 25) ? batch.slice(0, lic.no_in_test) : batch;
    if (!ids.length) {
      main().innerHTML = `<div class="card">Không tạo được đề thi.</div>`;
      return;
    }
    renderQuiz({
      mode: "exam",
      title: `Thi mô phỏng — Hạng ${lic.name}`,
      questionIds: ids,
      timeLimitSec: (lic.duration || 20) * 60,
    });
    setBack(() => Router.go("#/home"));
  }

  // ── Wrong questions (câu sai) ───────────────────────────────────
  function renderWrong() {
    const ids = Storage.wrongQuestionIds().filter(id => Data.question(id));
    if (!ids.length) {
      setTitle("Câu sai"); setBack(() => Router.go("#/home")); setActiveNav("stats");
      main().innerHTML = `<div class="card center">
        <h3>Không có câu sai nào</h3>
        <p class="muted">Rất tốt! Hãy ôn thêm các bộ đề để kiểm tra kiến thức.</p>
      </div>`;
      return;
    }
    renderQuiz({
      mode: "wrong",
      title: `Ôn lại ${ids.length} câu sai`,
      questionIds: ids,
      timeLimitSec: null,
    });
    setBack(() => Router.go("#/stats"));
  }

  // ── Result ──────────────────────────────────────────────────────
  function renderResult() {
    setActiveNav(null);
    const r = window.__lastResult;
    if (!r) { Router.go("#/home"); return; }
    setTitle("Kết quả");
    setBack(() => Router.go("#/home"));

    const passed = r.passed;
    const heroClass = passed ? "result-hero" : "result-hero fail";
    const reason = passed ? "Chúc mừng! Bạn đã đạt mức đậu." : "Chưa đạt — ôn thêm nhé.";

    main().innerHTML = `
      <div class="${heroClass}">
        <h2>${passed ? "ĐẠT" : "CHƯA ĐẠT"}</h2>
        <span class="score">${r.right}/${r.total}</span>
        <div>${esc(reason)}</div>
      </div>
      <div class="result-row"><span>Câu đúng</span><strong>${r.right}</strong></div>
      <div class="result-row"><span>Câu sai</span><strong>${r.wrong}</strong></div>
      <div class="result-row"><span>Ngưỡng đậu</span><strong>≥ ${r.threshold}</strong></div>
      <div class="result-row"><span>Sai câu điểm liệt</span><strong>${r.dieFail ? "Có (trượt)" : "Không"}</strong></div>
      <div class="spacer-16"></div>
      <div class="row">
        <button class="btn btn-ghost grow" id="r-review">Xem đáp án</button>
        <button class="btn btn-primary grow" id="r-retry">Làm lại</button>
      </div>
      <div class="spacer-16"></div>
      <a href="#/home" class="btn btn-ghost" style="display:block;text-align:center">Về trang chủ</a>
    `;
    $("#r-review").onclick = () => renderQuizReview(window.__lastResult);
    $("#r-retry").onclick = () => {
      if (r.mode === "test" && r.testId != null) Router.go(`#/quiz/${r.testId}`);
      else if (r.mode === "exam") Router.go(`#/exam/exam`);
      else Router.go("#/home");
    };
  }

  // Render quiz with all answers pre-filled and submitted.
  function renderQuizReview(ctx) {
    setTitle("Xem lại bài");
    setBack(() => Router.go("#/result"));
    const state = {
      ids: ctx.questionIds.slice(),
      index: 0,
      choices: new Map(ctx.choices),
      submitted: true,
      deadline: null,
    };

    function render() {
      const q = Data.question(state.ids[state.index]);
      const chose = state.choices.get(q.id) || 0;
      const grid = state.ids.map((id, i) => {
        const userC = state.choices.get(id) || 0;
        const qO = Data.question(id);
        let cls = "q-cell";
        if (userC) cls += userC === qO.answer ? " correct" : " wrong";
        if (i === state.index) cls += " current";
        return `<div class="${cls}" data-i="${i}">${i + 1}</div>`;
      }).join("");
      const options = [1, 2, 3, 4].map((n) => {
        const text = q[`option${n}`];
        if (!text) return "";
        let cls = "option";
        if (n === q.answer) cls += " correct";
        else if (chose === n) cls += " wrong";
        return `<div class="${cls}"><span class="letter">${String.fromCharCode(64 + n)}</span><span>${esc(text)}</span></div>`;
      }).join("");
      const imgHtml = q.image ? `<img src="${questionImage(q)}" alt="" onerror="this.style.display='none'">` : "";
      const explHtml = q.explanation ? `<div class="explanation"><strong>Giải thích:</strong> ${esc(q.explanation)}</div>` : "";
      main().innerHTML = `
        <div class="q-grid">${grid}</div>
        <div class="quiz-q">
          <span class="q-idx">Câu ${state.index + 1}${q.die ? ' <span class="badge-red">ĐIỂM LIỆT</span>' : ""}</span>
          <div class="q-content">${esc(q.content)}</div>
          ${imgHtml}${options}${explHtml}
        </div>
        <div class="quiz-nav">
          <button class="btn btn-ghost" id="r-prev" ${state.index === 0 ? "disabled" : ""}>← Câu trước</button>
          <div class="grow center muted">${state.index + 1} / ${state.ids.length}</div>
          <button class="btn btn-ghost" id="r-next" ${state.index === state.ids.length - 1 ? "disabled" : ""}>Câu tiếp →</button>
        </div>`;
      main().querySelectorAll(".q-cell").forEach(el => el.addEventListener("click", () => {
        state.index = Number(el.dataset.i); render();
      }));
      $("#r-prev").onclick = () => { if (state.index > 0) { state.index--; render(); } };
      $("#r-next").onclick = () => { if (state.index < state.ids.length - 1) { state.index++; render(); } };
    }
    render();
  }

  // ── Sign types / Signs ──────────────────────────────────────────
  function renderSigns() {
    setTitle("Biển báo");
    setBack(() => Router.go("#/home"));
    setActiveNav("signs");
    const rows = Data.state.signTypes.map(t => `
      <div class="list-item" data-id="${t.id}">
        <img src="imgs/sign_types/${t.id}.png" width="52" height="52" alt=""
             style="object-fit:contain;background:var(--bg-soft);border-radius:8px"
             onerror="this.style.display='none'">
        <div class="grow">
          <div class="title">${esc(t.title)}</div>
          <div class="sub">${esc(t.shape || "")}</div>
        </div>
      </div>`).join("");
    main().innerHTML = rows;
    main().querySelectorAll(".list-item").forEach(el => {
      el.addEventListener("click", () => Router.go(`#/signs/${el.dataset.id}`));
    });
  }
  function renderSignsOfType({ typeId }) {
    const id = Number(typeId);
    const type = Data.state.signTypes.find(t => t.id === id);
    setTitle(type ? type.title : "Biển báo");
    setBack(() => Router.go("#/signs"));
    setActiveNav("signs");
    const list = Data.signsOfType(id);
    const rows = list.map(s => `
      <div class="sign-card">
        <img src="${signImage(s)}" alt="" onerror="this.src='imgs/icons/sign.svg'">
        <div class="grow">
          <div class="s-code">${esc(s.code || "")}</div>
          <div class="s-title">${esc(s.title || "")}</div>
          ${s.more ? `<div class="s-more">${esc(s.more)}</div>` : ""}
        </div>
      </div>`).join("");
    main().innerHTML = rows || `<div class="card">Chưa có biển báo trong nhóm này.</div>`;
  }

  // ── Maps (Sa hình) ──────────────────────────────────────────────
  function renderMaps() {
    setTitle("Sa hình");
    setBack(() => Router.go("#/home"));
    setActiveNav(null);
    const level = currentLevelName();
    const list = Data.mapsForLevel(level);
    const rows = list.map(m => `
      <div class="map-card">
        <h3>${esc(m.title || "")}</h3>
        ${m.image ? `<img src="imgs/maps/${esc(m.image)}.png" alt="" onerror="this.style.display='none'">` : ""}
        ${m.content ? `<p>${esc(m.content)}</p>` : ""}
      </div>`).join("");
    main().innerHTML = rows || `<div class="card">Chưa có nội dung sa hình.</div>`;
  }

  // ── Tips ────────────────────────────────────────────────────────
  function renderTips() {
    setTitle("Mẹo ghi nhớ");
    setBack(() => Router.go("#/home"));
    setActiveNav(null);
    const rows = Data.state.tips.map((t, i) => `
      <div class="tip-card">
        <strong style="color:var(--blue)">Mẹo ${i + 1}</strong>
        <p>${esc(t.content || "")}</p>
      </div>`).join("");
    main().innerHTML = rows;
  }

  // ── Stats ───────────────────────────────────────────────────────
  function renderStats() {
    setTitle("Thống kê");
    setBack(() => Router.go("#/home"));
    setActiveNav("stats");

    const level = currentLevelName();
    const pools = QuestionPools.catsExFor(level);
    const allIds = pools[0] || [];
    const dieIds = pools[1] || [];
    const stats = Storage.qstatsAll();

    let answered = 0, correct = 0;
    for (const id of allIds) {
      const s = stats[id];
      if (s && s.choose) {
        answered++;
        const q = Data.question(id);
        if (q && s.choose === q.answer) correct++;
      }
    }
    const wrong = Storage.wrongQuestionIds().length;
    const tstats = Storage.tstatsAll();
    const attempts = Object.values(tstats).reduce((a, v) => a + (v.attempts || 0), 0);
    const passed = Object.values(tstats).reduce((a, v) => a + (v.passed || 0), 0);

    main().innerHTML = `
      <div class="grid-3" style="margin-bottom:12px">
        <div class="stat-tile"><strong>${correct}</strong><small>Câu đúng</small></div>
        <div class="stat-tile"><strong>${answered}</strong><small>Đã trả lời</small></div>
        <div class="stat-tile"><strong>${allIds.length}</strong><small>Tổng câu</small></div>
      </div>
      <div class="grid-2">
        <div class="stat-tile"><strong>${passed}/${attempts || 0}</strong><small>Lần đậu / tổng lần</small></div>
        <div class="stat-tile"><strong>${wrong}</strong><small>Câu sai (cần ôn)</small></div>
      </div>
      <div class="spacer-16"></div>
      <a href="#/wrong" class="btn btn-primary" style="display:block;text-align:center">Ôn lại câu sai</a>
      <div class="spacer-16"></div>
      <button class="btn btn-ghost" id="clear-stats" style="display:block;width:100%">Xoá toàn bộ tiến độ</button>
    `;
    $("#clear-stats").onclick = () => {
      if (confirm("Xoá toàn bộ tiến độ học tập? Không thể hoàn tác.")) {
        Storage.clearAll();
        renderStats();
      }
    };
  }

  // ── Settings ────────────────────────────────────────────────────
  function renderSettings() {
    setTitle("Cài đặt");
    setBack(() => Router.go("#/home"));
    setActiveNav(null);
    const lic = currentLicense();
    main().innerHTML = `
      <div class="card">
        <div class="row">
          <div class="grow">
            <strong>Hạng GPLX đang ôn</strong>
            <div class="muted">${esc(lic.name)} — ${esc(lic.title || "")}</div>
          </div>
          <a class="btn btn-ghost btn-compact" href="#/licenses">Đổi</a>
        </div>
      </div>
      <div class="card">
        <div class="row">
          <div class="grow">
            <strong>Liên hệ / Góp ý</strong>
            <div class="muted">Email nhà phát triển</div>
          </div>
          <a class="btn btn-ghost btn-compact" href="mailto:sathachlaixe.gtvtvn@gmail.com">Gửi email</a>
        </div>
      </div>
      <div class="card">
        <div class="row">
          <div class="grow">
            <strong>Tải app di động</strong>
            <div class="muted">Phiên bản Android / iOS</div>
          </div>
        </div>
        <div class="row" style="margin-top:10px">
          <a class="store-badge" href="#" rel="nofollow" style="padding:8px 12px">
            <span><small>Google</small><strong>Play</strong></span>
          </a>
          <a class="store-badge" href="#" rel="nofollow" style="padding:8px 12px">
            <span><small>App</small><strong>Store</strong></span>
          </a>
        </div>
      </div>
      <div class="card">
        <div class="row">
          <div class="grow"><strong>Xoá toàn bộ tiến độ</strong>
            <div class="muted">Xoá câu đã làm, thống kê, lần thi</div>
          </div>
          <button class="btn btn-danger btn-compact" id="reset-all">Xoá</button>
        </div>
      </div>
      <div class="center muted" style="margin-top:12px;font-size:12px">
        sathachlaixe.org · Phiên bản Web 1.0 · © 2026
      </div>
    `;
    $("#reset-all").onclick = () => {
      if (confirm("Xoá toàn bộ tiến độ?")) { Storage.clearAll(); renderSettings(); }
    };
  }

  root.Screens = {
    renderHome, renderLearn, renderLearnCat,
    renderTests, renderQuizById, renderExam, renderWrong,
    renderResult, renderLicenses,
    renderSigns, renderSignsOfType,
    renderMaps, renderTips, renderStats, renderSettings,
    showLoading,
  };
})(window);
