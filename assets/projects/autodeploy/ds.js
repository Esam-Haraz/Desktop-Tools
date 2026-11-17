/* ============================================================================
   DESIGN SYSTEM v1.1 + AUTODEPLOY INTERACTIVE ENGINE (ZERO DEPENDENCIES)
   Author: Esam Haraz
   Path: AutoDeploy/assets/ds.js
   ============================================================================ */

document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js-enabled");

(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    currentSiteId: "autodeploy",
    siteDeployUrl: "https://Esam-Haraz.github.io/AutoDeploy/",
    hubContactUrl: "https://Esam-Haraz.github.io/hub/#contact",
    sitesGraph: [
      { id: "hub",        labelEn: "Services Hub",  labelAr: "المركز الرئيسي", url: "https://Esam-Haraz.github.io/hub/" },
      { id: "autodeploy", labelEn: "AutoDeploy",    labelAr: "AutoDeploy",     url: "./" },
      { id: "data",       labelEn: "Data Analysis", labelAr: "تحليل البيانات", url: "https://Esam-Haraz.github.io/Data-Analysis/" },
      { id: "portfolio",  labelEn: "Portfolio",     labelAr: "معرض الأعمال",   url: "https://Esam-Haraz.github.io/portfolio/" }
    ],
    githubRepoUrl: "https://github.com/Esam-Haraz/AutoDeploy",
    githubIssuesUrl: "https://github.com/Esam-Haraz/AutoDeploy/issues",
    githubApiLatestUrl: "https://api.github.com/repos/Esam-Haraz/AutoDeploy/releases/latest",
    directDownloadUrl: "https://github.com/Esam-Haraz/AutoDeploy/releases/latest/download/AutoDeploy.exe",
    email: "esamv20@gmail.com",
    whatsappNumber: ""
  };

  function getCfg() {
    return Object.assign({}, DEFAULT_CONFIG, window.SITE_CONFIG || {});
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* --------------------------------------------------------------------------
     1. SHARED DESIGN SYSTEM ENGINE (DS)
     -------------------------------------------------------------------------- */
  const DS = (() => {
    const STORAGE_LANG_KEY = "esam_ds_lang_v1";
    const STORAGE_THEME_KEY = "esam_ds_theme_v1";

    let currentLang = "en";
    let isWiping = false;
    let toastTimer = null;

    function prefersReducedMotion() {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    /* Theme Management (Unified labels: Dark / Light & داكن / فاتح) */
    function initTheme() {
      let saved = null;
      try {
        saved = localStorage.getItem(STORAGE_THEME_KEY) || localStorage.getItem("eh_ds_theme");
      } catch (_) {}

      if (saved === "dark" || saved === "light") {
        setTheme(saved, false);
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark", false);
      } else {
        setTheme("light", false);
      }
    }

    function setTheme(mode, persist = true) {
      const normalized = mode === "dark" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", normalized);
      if (persist) {
        try {
          localStorage.setItem(STORAGE_THEME_KEY, normalized);
        } catch (_) {}
      }
      updateThemeLabel();
    }

    function toggleTheme() {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next, true);
    }

    function updateThemeLabel() {
      const btn = document.getElementById("ds-theme-toggle");
      const lbl = document.querySelector("[data-theme-label]") || document.getElementById("ds-theme-label");
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";

      if (btn) {
        btn.setAttribute("aria-pressed", String(isDark));
        btn.setAttribute(
          "aria-label",
          currentLang === "ar"
            ? (isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن")
            : (isDark ? "Switch to light mode" : "Switch to dark mode")
        );
      }

      if (lbl) {
        if (currentLang === "ar") {
          lbl.textContent = isDark ? "فاتح" : "داكن";
        } else {
          lbl.textContent = isDark ? "Light" : "Dark";
        }
      }
    }

    /* Mini Node-Graph Navigation & Mobile (<480px) Dropdown */
    function hydrateMiniGraph() {
      const cfg = getCfg();
      const nav = document.getElementById("ds-mini-graph");
      const dropdownMenu = document.getElementById("ds-nav-dropdown-menu");
      const dropdownBtn = document.getElementById("ds-nav-dropdown-btn");

      if (nav && Array.isArray(cfg.sitesGraph)) {
        nav.innerHTML = cfg.sitesGraph
          .map((node, idx) => {
            const isCur = node.id === cfg.currentSiteId;
            const label = currentLang === "ar" ? node.labelAr : node.labelEn;
            const edge = idx < cfg.sitesGraph.length - 1 ? '<span class="ds-mini-edge" aria-hidden="true"></span>' : "";
            return `
              <a href="${escapeHtml(node.url)}"
                 class="ds-mini-node ${isCur ? "is-current" : ""}"
                 ${isCur ? 'aria-current="page"' : ""}>
                <span class="ds-mini-dot" aria-hidden="true"></span>
                <span>${escapeHtml(label)}</span>
              </a>${edge}
            `;
          })
          .join("");
      }

      if (dropdownMenu && Array.isArray(cfg.sitesGraph)) {
        dropdownMenu.innerHTML = cfg.sitesGraph
          .map((node) => {
            const isCur = node.id === cfg.currentSiteId;
            const label = currentLang === "ar" ? node.labelAr : node.labelEn;
            return `
              <a href="${escapeHtml(node.url)}"
                 class="${isCur ? "is-current" : ""}"
                 ${isCur ? 'aria-current="page"' : ""}>
                <span>${escapeHtml(label)}</span>
                <span aria-hidden="true">${isCur ? "●" : "↗"}</span>
              </a>
            `;
          })
          .join("");
      }

      if (dropdownBtn) {
        dropdownBtn.textContent = "Deploy ▾";
      }
    }

    function setupMobileNavDropdown() {
      const btn = document.getElementById("ds-nav-dropdown-btn");
      const menu = document.getElementById("ds-nav-dropdown-menu");
      if (!btn || !menu) return;

      function closeMenu() {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const willOpen = !menu.classList.contains("is-open");
        menu.classList.toggle("is-open", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
      });

      document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && e.target !== btn) {
          closeMenu();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && menu.classList.contains("is-open")) {
          closeMenu();
          btn.focus();
        }
      });
    }

    /* Bilingual Switcher (Unified labels: عربي / EN) + Circular Wipe */
    function initLanguage(dictionary, onLangChange) {
      let savedLang = null;
      try {
        savedLang = localStorage.getItem(STORAGE_LANG_KEY) || localStorage.getItem("eh_ds_lang");
      } catch (_) {}

      if (savedLang === "ar" || savedLang === "en") {
        currentLang = savedLang;
      } else {
        currentLang = "en";
      }
      applyLanguageDOM(currentLang, dictionary, onLangChange);
    }

    function applyLanguageDOM(lang, dictionary, onLangChange) {
      currentLang = lang === "ar" ? "ar" : "en";
      const isAr = currentLang === "ar";
      document.documentElement.lang = currentLang;
      document.documentElement.dir = isAr ? "rtl" : "ltr";
      if (document.body) {
        document.body.dir = isAr ? "rtl" : "ltr";
      }

      const langBtn = document.getElementById("ds-lang-toggle");
      if (langBtn) {
        langBtn.textContent = isAr ? "EN" : "عربي";
        langBtn.setAttribute(
          "aria-label",
          isAr ? "Switch language to English" : "التبديل إلى اللغة العربية"
        );
      }

      if (dictionary && dictionary[currentLang]) {
        const dict = dictionary[currentLang];
        document.querySelectorAll("[data-i18n]").forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (dict[key] !== undefined) {
            el.innerHTML = dict[key];
          }
        });
      }

      hydrateMiniGraph();
      updateThemeLabel();
      if (typeof onLangChange === "function") onLangChange(currentLang);
    }

    function switchLanguage(btnEl) {
      if (isWiping) return;
      const targetLang = currentLang === "en" ? "ar" : "en";
      try {
        localStorage.setItem(STORAGE_LANG_KEY, targetLang);
      } catch (_) {}

      const curtain = document.getElementById("ds-lang-curtain");
      if (!curtain || prefersReducedMotion()) {
        applyLanguageDOM(targetLang, window.PAGE_I18N, window.onPageLanguageChange);
        return;
      }

      isWiping = true;
      const trigger = btnEl || document.getElementById("ds-lang-toggle") || document.body;
      const rect = trigger.getBoundingClientRect();
      const x = Math.round(((rect.left + rect.width / 2) / Math.max(window.innerWidth, 1)) * 100);
      const y = Math.round(((rect.top + rect.height / 2) / Math.max(window.innerHeight, 1)) * 100);

      const sub = document.getElementById("ds-curtain-sub");
      if (sub) {
        sub.textContent = targetLang === "ar" ? "التحويل إلى العربية (RTL)" : "SWITCHING TO ENGLISH (LTR)";
      }

      curtain.style.transition = "none";
      curtain.style.clipPath = `circle(0% at ${x}% ${y}%)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          curtain.style.transition = "clip-path var(--motion-wipe-dur) var(--motion-wipe-ease)";
          curtain.style.clipPath = `circle(150% at ${x}% ${y}%)`;

          setTimeout(() => {
            applyLanguageDOM(targetLang, window.PAGE_I18N, window.onPageLanguageChange);
            const oppX = 100 - x;
            curtain.style.clipPath = `circle(0% at ${oppX}% 96%)`;
            setTimeout(() => {
              isWiping = false;
            }, 560);
          }, 560);
        });
      });
    }

    /* Scroll Pipeline Rail Tracker */
    function initScrollRail(sectionIds) {
      const updateRail = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        document.documentElement.style.setProperty("--scroll-progress", pct.toFixed(3));

        const nodes = document.querySelectorAll(".ds-rail-node");
        sectionIds.forEach((id, idx) => {
          const el = document.getElementById(id);
          if (el && nodes[idx]) {
            const rect = el.getBoundingClientRect();
            nodes[idx].classList.toggle("is-reached", rect.top <= window.innerHeight * 0.45);
          }
        });
      };
      window.addEventListener("scroll", updateRail, { passive: true });
      updateRail();
    }

    function showToast(htmlMsg) {
      const toast = document.getElementById("ds-toast");
      if (!toast) return;
      toast.innerHTML = htmlMsg;
      toast.classList.add("is-visible");
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    }

    return {
      initTheme,
      toggleTheme,
      initLanguage,
      switchLanguage,
      initScrollRail,
      setupMobileNavDropdown,
      showToast,
      prefersReducedMotion,
      getLang: () => currentLang
    };
  })();

  window.DS = DS;

  /* --------------------------------------------------------------------------
     2. INTERACTIVE AUTODEPLOY SIMULATOR ENGINE
     -------------------------------------------------------------------------- */
  const SIM_SILENT_ITEMS = [
    { name: "Revo Uninstaller Pro (v5.4.5)", path: "D:\\Windows Programs\\Silent\\RevoUninProSetup.exe", ext: "EXE", checked: true, steps: 1, stepInfo: "COPY: revouninstallerpro5.lic ➔ C:\\ProgramData\\VS Revo Group\\Revo Uninstaller Pro" },
    { name: "qBittorrent (v5.1.4)", path: "D:\\Windows Programs\\Silent\\qbittorrent_x64_setup.exe", ext: "EXE", checked: true, steps: 1, stepInfo: "OS BACKUP RESTORE: qBittorrent ➔ %APPDATA%\\qBittorrent" },
    { name: "Visual C++ Redistributable All-in-One • [Auto Quote & No-Pause]", path: "D:\\Windows Programs\\Silent\\vcredist\\install_all.bat", ext: "BAT", checked: true, steps: 0, stepInfo: "" },
    { name: "FastCopy (v5.8.1) • [Auto Switch: /SILENT]", path: "D:\\Windows Programs\\Silent\\FastCopy.exe", ext: "EXE", checked: true, steps: 0, stepInfo: "" }
  ];

  const SIM_CUSTOM_ITEMS = [
    { name: "Discord (v1.0.90)", path: "D:\\Windows Programs\\Custom\\DiscordSetup.exe", ext: "EXE", checked: true, steps: 1, stepInfo: "RUN & WAIT: Launch VencordInstaller.exe after setup & wait until closed" },
    { name: "Git (v2.52.0)", path: "D:\\Windows Programs\\Custom\\Git-64-bit.exe", ext: "EXE", checked: true, steps: 0, stepInfo: "" },
    { name: "Disable Bing Search in Start Menu • [Registry Tweak]", path: "D:\\Windows Programs\\Tweaks\\disable_bing.reg", ext: "REG", checked: true, steps: 0, stepInfo: "" }
  ];

  let currentSimTab = 0;
  let simTimer = null;

  function switchSimTab(tabIdx) {
    currentSimTab = tabIdx;
    const bar = document.getElementById("sim-tabs-bar");
    if (bar) bar.style.setProperty("--active-tab", tabIdx);

    for (let i = 0; i < 3; i++) {
      const btn = document.getElementById(`sim-tab-${i}`);
      if (btn) {
        btn.classList.toggle("is-active", i === tabIdx);
        btn.setAttribute("aria-selected", i === tabIdx ? "true" : "false");
      }
    }

    const topHint = document.getElementById("sim-top-hint");
    if (topHint) {
      if (tabIdx === 0) {
        topHint.textContent = "Saved in 'AutoDeploy Silent Queue.txt'. Universal silent detector + Desktop shortcut sync.";
      } else if (tabIdx === 1) {
        topHint.textContent = "Saved in 'AutoDeploy Custom Queue.txt'. Uncheck any item to skip it, or inspect 'Additional Steps'.";
      } else {
        const sCount = SIM_SILENT_ITEMS.filter((x) => x.checked).length;
        const cCount = SIM_CUSTOM_ITEMS.filter((x) => x.checked).length;
        topHint.textContent = `Selected: ${sCount}/${SIM_SILENT_ITEMS.length} Silent Setup • ${cCount}/${SIM_CUSTOM_ITEMS.length} Custom Setup [Admin Active]`;
      }
    }

    renderSimStage(!DS.prefersReducedMotion());
  }

  function renderSimStage(animateTicks = false) {
    const stage = document.getElementById("sim-stage");
    if (!stage) return;
    if (simTimer) {
      clearInterval(simTimer);
      simTimer = null;
    }

    if (currentSimTab === 0 || currentSimTab === 1) {
      const isSilent = currentSimTab === 0;
      const list = isSilent ? SIM_SILENT_ITEMS : SIM_CUSTOM_ITEMS;

      stage.innerHTML = list
        .map(
          (item, idx) => `
        <div class="sim-row ${item.checked ? (animateTicks ? "" : "is-active-row") : "is-unchecked"}" id="sim-row-${idx}">
          <button type="button" class="ds-checkbox sim-q-check ${item.checked && !animateTicks ? "is-checked" : ""}"
                  onclick="toggleSimItemCheck(${isSilent}, ${idx})" aria-label="Toggle ${escapeHtml(item.name)}">
            <svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg>
          </button>
          <span class="sim-ext-tag">${escapeHtml(item.ext)}</span>
          <div class="sim-row-info">
            <div class="sim-row-title">${escapeHtml(item.name)}</div>
            <div class="sim-row-path">${escapeHtml(item.path)}</div>
          </div>
          <button type="button" class="sim-step-btn ${item.steps > 0 ? "has-steps" : ""}" onclick="previewSimStepToast(${isSilent}, ${idx})">
            ${item.steps > 0 ? `Steps (${item.steps})` : "Additional Steps"}
          </button>
        </div>
      `
        )
        .join("");

      if (animateTicks) {
        const checks = stage.querySelectorAll(".sim-q-check");
        const rows = stage.querySelectorAll(".sim-row");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            list.forEach((item, i) => {
              if (item.checked) {
                setTimeout(() => {
                  if (checks[i]) checks[i].classList.add("is-checked");
                  if (rows[i]) rows[i].classList.add("is-active-row");
                }, i * 105);
              }
            });
          });
        });
      }
    } else {
      stage.innerHTML = `
        <button type="button" class="ds-btn ds-btn-primary" style="width:100%;padding:0.55rem;" onclick="runSimulatedDeployment()">
          ▶ Start Full Deployment Sequence (Silent Setup ➔ Custom Setup)
        </button>
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--sim-muted);">
          <span id="sim-status-lbl">Status: Ready to deploy</span>
          <span id="sim-pct-lbl" class="ds-mono" style="font-weight:700;color:var(--site-accent);">0%</span>
        </div>
        <div class="ds-progress" id="sim-prog-bar" style="--progress: 0; background:var(--sim-sunken); border-color:var(--sim-rule);">
          <div class="ds-progress-fill"></div>
        </div>
        <div class="ds-mono" id="sim-log-box" style="flex:1;background:var(--sim-sunken);border:1px solid var(--sim-rule);border-radius:var(--radius-sm);padding:0.6rem;font-size:0.68rem;line-height:1.6;color:var(--sim-ink);overflow-y:auto;max-height:155px;">
        </div>
      `;
      runSimulatedDeployment();
    }
  }

  function toggleSimItemCheck(isSilent, idx) {
    const list = isSilent ? SIM_SILENT_ITEMS : SIM_CUSTOM_ITEMS;
    list[idx].checked = !list[idx].checked;
    const row = document.getElementById(`sim-row-${idx}`);
    const chk = row ? row.querySelector(".sim-q-check") : null;
    if (row && chk) {
      const isChecked = list[idx].checked;
      chk.classList.toggle("is-checked", isChecked);
      row.classList.toggle("is-active-row", isChecked);
      row.classList.toggle("is-unchecked", !isChecked);
    } else {
      renderSimStage(false);
    }
  }

  function previewSimStepToast(isSilent, idx) {
    const item = (isSilent ? SIM_SILENT_ITEMS : SIM_CUSTOM_ITEMS)[idx];
    if (item.steps > 0) {
      DS.showToast(
        `<strong>${escapeHtml(item.name.split(" (")[0])}</strong><br><span class="ds-mono" style="font-size:0.75rem;">${escapeHtml(item.stepInfo)}</span>`
      );
    } else {
      DS.showToast(
        `<strong>Additional Steps</strong><br><span style="font-size:0.78rem;">Supports Copy &amp; Replace, Move &amp; Replace, Run &amp; Wait, and OS Snapshot.</span>`
      );
    }
  }

  function runSimulatedDeployment() {
    const logBox = document.getElementById("sim-log-box");
    const progBar = document.getElementById("sim-prog-bar");
    const pctLbl = document.getElementById("sim-pct-lbl");
    const statusLbl = document.getElementById("sim-status-lbl");
    if (!logBox || !progBar) return;

    if (simTimer) clearInterval(simTimer);
    logBox.innerHTML = "";
    progBar.style.setProperty("--progress", "0");
    pctLbl.textContent = "0%";

    const steps = [
      { p: 0.14, pct: "14%", st: "Checking internet & Windows Registry...", log: "• Session started. Administrator privileges verified. Scanning Registry..." },
      { p: 0.30, pct: "30%", st: "Running (Silent Setup): Revo Uninstaller Pro...", log: "⚙ [INSTALLING] Running Silent Setup for 'Revo Uninstaller Pro' (/VERYSILENT)..." },
      { p: 0.46, pct: "46%", st: "Running additional steps for Revo Uninstaller Pro...", log: "&nbsp;&nbsp;↳ [STEP 1 COPIED] 'revouninstallerpro5.lic' ➔ 'C:\\ProgramData\\VS Revo Group\\Revo Uninstaller Pro'" },
      { p: 0.64, pct: "64%", st: "Running (Silent Setup): qBittorrent...", log: "✓ [SUCCESS] 'qBittorrent' completed cleanly. Restoring %APPDATA%\\qBittorrent snapshot..." },
      { p: 0.82, pct: "82%", st: "Running (Silent Setup): install_all.bat...", log: "⚙ [BATCH] Executing 'install_all.bat' (auto-quoting %~dp0 paths & bypassing pause)..." },
      { p: 0.94, pct: "94%", st: "Running (Custom Setup): Discord + Vencord...", log: "↳ [STEP 1 RUN] Launched 'VencordInstaller.exe' — closed cleanly (exit code 0)." },
      { p: 1.00, pct: "100%", st: "All installations and additional steps completed!", log: "<span style='color:var(--site-accent);'>✓ Sequence finished. External log exported: AutoDeploy_Log.txt</span>" }
    ];

    if (DS.prefersReducedMotion()) {
      progBar.style.setProperty("--progress", "1");
      pctLbl.textContent = "100%";
      statusLbl.textContent = `Status: ${steps[steps.length - 1].st}`;
      logBox.innerHTML = steps.map((s) => s.log).join("<br>");
      return;
    }

    let i = 0;
    simTimer = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(simTimer);
        simTimer = null;
        return;
      }
      const s = steps[i];
      progBar.style.setProperty("--progress", s.p);
      pctLbl.textContent = s.pct;
      statusLbl.textContent = `Status: ${s.st}`;
      logBox.innerHTML += s.log + "<br>";
      logBox.scrollTop = logBox.scrollHeight;
      i++;
    }, 360);
  }

  /* --------------------------------------------------------------------------
     3. ORCHESTRATED HERO ENTRY SEQUENCE (< 1.5s, Once per Session, Skippable)
     -------------------------------------------------------------------------- */
  let entryTimers = [];

  function skipHeroOrchestration() {
    entryTimers.forEach((t) => clearTimeout(t));
    entryTimers = [];
    const line = document.getElementById("hero-entry-line");
    if (line) {
      line.style.transition = "none";
      line.style.strokeDashoffset = "0";
    }
    document.querySelectorAll(".sim-q-check").forEach((c) => c.classList.add("is-checked"));
    document.querySelectorAll(".sim-row").forEach((r) => r.classList.add("is-active-row"));
  }

  function runHeroOrchestrationOnce() {
    if (DS.prefersReducedMotion()) return;
    try {
      if (sessionStorage.getItem("autodeploy_entry_played") === "1") return;
      sessionStorage.setItem("autodeploy_entry_played", "1");
    } catch (_) {}

    const line = document.getElementById("hero-entry-line");
    const checks = document.querySelectorAll(".sim-q-check");
    const rows = document.querySelectorAll(".sim-row");
    if (!line || checks.length === 0) return;

    line.style.transition = "none";
    line.style.strokeDashoffset = "600";
    checks.forEach((c) => c.classList.remove("is-checked"));
    rows.forEach((r) => r.classList.remove("is-active-row"));

    const skipHandler = () => {
      skipHeroOrchestration();
      window.removeEventListener("pointerdown", skipHandler);
      window.removeEventListener("keydown", skipHandler);
    };
    window.addEventListener("pointerdown", skipHandler, { once: true });
    window.addEventListener("keydown", skipHandler, { once: true });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        line.style.transition = "stroke-dashoffset var(--motion-connect-dur) var(--motion-connect-ease)";
        line.style.strokeDashoffset = "0";

        checks.forEach((chk, i) => {
          const t = setTimeout(() => {
            chk.classList.add("is-checked");
            if (rows[i]) rows[i].classList.add("is-active-row");
          }, 480 + i * 140);
          entryTimers.push(t);
        });
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. ADDITIONAL STEPS 4-MODE EXPLORER & FAULT -> PATCH MATRIX PULSE
     -------------------------------------------------------------------------- */
  function selectStepMode(idx) {
    for (let i = 0; i < 4; i++) {
      const tab = document.getElementById(`step-tab-${i}`);
      const panel = document.getElementById(`step-panel-${i}`);
      const isCurrent = i === idx;
      if (tab) {
        tab.classList.toggle("is-active", isCurrent);
        tab.setAttribute("aria-selected", isCurrent ? "true" : "false");
      }
      if (panel) {
        panel.classList.toggle("is-active", isCurrent);
        if (isCurrent && !DS.prefersReducedMotion()) {
          const drawLine = panel.querySelector(".pipe-line-draw");
          if (drawLine) {
            drawLine.style.transition = "none";
            drawLine.style.strokeDashoffset = "180";
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                drawLine.style.transition = "stroke-dashoffset var(--motion-connect-dur) var(--motion-connect-ease)";
                drawLine.style.strokeDashoffset = "0";
              });
            });
          }
        }
      }
    }

    const counter = document.getElementById("step-mode-counter");
    const bar = document.getElementById("step-mode-bar");
    if (counter) counter.textContent = `MODE ${idx + 1} / 4`;
    if (bar) bar.style.setProperty("--progress", ((idx + 1) / 4).toFixed(2));
  }

  function pulseMatrixArrow(cardEl) {
    if (DS.prefersReducedMotion()) return;
    const line = cardEl.querySelector(".matrix-arrow-line");
    if (!line) return;
    line.style.transition = "none";
    line.style.strokeDashoffset = "40";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        line.style.transition = "stroke-dashoffset var(--motion-connect-dur) var(--motion-connect-ease)";
        line.style.strokeDashoffset = "0";
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. GITHUB RELEASES API FETCHER (Version, Size & SHA-256 Digest)
     -------------------------------------------------------------------------- */
  let currentSha256 = "Pending GitHub Releases API digest...";

  async function fetchLatestGitHubRelease() {
    const cfg = getCfg();
    const shaEl = document.getElementById("meta-sha256");
    if (!shaEl) return;

    try {
      const resp = await fetch(cfg.githubApiLatestUrl);
      if (!resp.ok) throw new Error("API status " + resp.status);
      const data = await resp.json();

      if (data.tag_name) {
        const ver = data.tag_name.startsWith("v") ? data.tag_name : `v${data.tag_name}`;
        const badge = document.getElementById("nav-ver-badge");
        const verEl = document.getElementById("meta-version");
        if (badge) badge.textContent = ver;
        if (verEl) verEl.textContent = ver;
        document.querySelectorAll(".ds-release-tag").forEach((el) => {
          el.textContent = ver;
        });
      }

      if (Array.isArray(data.assets) && data.assets.length > 0) {
        const exeAsset = data.assets.find((a) => a.name && a.name.toLowerCase().endsWith(".exe")) || data.assets[0];
        if (exeAsset) {
          if (exeAsset.size) {
            const mb = (exeAsset.size / (1024 * 1024)).toFixed(1);
            const sizeEl = document.getElementById("meta-size");
            if (sizeEl) sizeEl.textContent = `${mb} MB`;
          }
          if (exeAsset.browser_download_url) {
            const dlEl = document.getElementById("cta-download");
            if (dlEl) dlEl.href = exeAsset.browser_download_url;
          }
          if (exeAsset.digest) {
            currentSha256 = String(exeAsset.digest).replace(/^sha256:/i, "");
            shaEl.textContent = currentSha256;
            return;
          }
        }
      }

      if (data.body) {
        const match = data.body.match(/\b([a-fA-F0-9]{64})\b/);
        if (match) {
          currentSha256 = match[1];
          shaEl.textContent = currentSha256;
          return;
        }
      }

      currentSha256 = "See GitHub Release page (digest field not published for this asset)";
      shaEl.textContent = currentSha256;
    } catch (_) {
      currentSha256 = "Verify on GitHub Releases";
      shaEl.textContent = currentSha256;
    }
  }

  function copyReleaseSha() {
    if (navigator.clipboard && currentSha256) {
      navigator.clipboard.writeText(currentSha256);
    }
    const isAr = DS.getLang() === "ar";
    DS.showToast(isAr ? "✓ تم نسخ بصمة SHA-256" : "✓ Copied SHA-256 digest to clipboard");
  }

  /* --------------------------------------------------------------------------
     6. CONTACT LINKS & CONDITIONAL WHATSAPP HYDRATION
     -------------------------------------------------------------------------- */
  function initContactRoutes() {
    const cfg = getCfg();
    if (!cfg) return;

    const hubLink = document.getElementById("link-hub-contact");
    if (hubLink && cfg.hubContactUrl) hubLink.href = cfg.hubContactUrl;

    const issuesLink = document.getElementById("link-gh-issues");
    if (issuesLink && cfg.githubIssuesUrl) issuesLink.href = cfg.githubIssuesUrl;

    const emailLink = document.getElementById("link-email");
    if (emailLink && cfg.email) {
      emailLink.href = `mailto:${cfg.email}`;
      const span = emailLink.querySelector("span");
      if (span) span.textContent = cfg.email;
    }

    const cleanWa = (cfg.whatsappNumber || "").replace(/[^0-9]/g, "");
    const existingWa = document.getElementById("link-whatsapp-dynamic");
    if (cleanWa.length >= 8 && !existingWa) {
      const list = document.getElementById("contact-routes-list");
      if (list) {
        const waAnchor = document.createElement("a");
        waAnchor.id = "link-whatsapp-dynamic";
        waAnchor.href = `https://wa.me/${cleanWa}`;
        waAnchor.target = "_blank";
        waAnchor.rel = "noopener";
        waAnchor.className = "contact-route-link";
        waAnchor.innerHTML = `
          <span>WhatsApp</span>
          <span class="ds-mono">Chat ↗</span>
        `;
        list.appendChild(waAnchor);
      }
    }
  }

  /* --------------------------------------------------------------------------
     7. BUILT-IN 1200x630 OG-COVER.PNG GENERATOR (Press Ctrl + Shift + O)
     -------------------------------------------------------------------------- */
  async function generateOgCoverImage() {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#F3F6F4";
    ctx.fillRect(0, 0, 1200, 630);

    ctx.fillStyle = "#0D1F1A";
    ctx.fillRect(56, 56, 1096, 526);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(48, 48, 1096, 526);
    ctx.strokeStyle = "#0D1F1A";
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 48, 1096, 526);

    ctx.fillStyle = "#E6ECE8";
    ctx.fillRect(50, 50, 1092, 54);
    ctx.beginPath();
    ctx.moveTo(48, 104);
    ctx.lineTo(1144, 104);
    ctx.stroke();

    ctx.fillStyle = "#0D1F1A";
    ctx.font = "600 18px 'DM Mono', monospace";
    ctx.fillText("[PIPELINE // AUTODEPLOY v1.2.0 — WINDOWS 10 / 11 DEPLOYMENT UTILITY]", 84, 84);

    const titleText = "AutoDeploy";
    ctx.font = "800 64px 'Bricolage Grotesque', sans-serif";
    const padX = 24;
    const pillW = Math.ceil(ctx.measureText(titleText).width + padX * 2);
    const pillH = 86;

    ctx.fillStyle = "#0D1F1A";
    ctx.fillRect(84 + 4, 142 + 4, pillW, pillH);
    ctx.fillStyle = "#35E08C";
    ctx.fillRect(84, 142, pillW, pillH);
    ctx.strokeRect(84, 142, pillW, pillH);

    ctx.fillStyle = "#0D1F1A";
    ctx.fillText(titleText, 84 + padX, 204);

    ctx.font = "700 32px 'Instrument Sans', sans-serif";
    ctx.fillText("One-Click Windows Post-Format Setup & OS Snapshot Tool", 84, 275);

    const nodes = [
      { code: "01 // SILENT", title: "1. Silent Setup", sub: "Binary Switch Detector" },
      { code: "02 // CUSTOM", title: "2. Custom Setup", sub: "Interactive + Step Chaining" },
      { code: "03 // SNAPSHOT", title: "%APPDATA% Backup", sub: "Portable OS Config Restore" }
    ];

    nodes.forEach((n, i) => {
      const x = 84 + i * 350;
      const y = 335;
      ctx.fillStyle = "#0D1F1A";
      ctx.fillRect(x + 4, y + 4, 320, 135);
      ctx.fillStyle = "#F3F6F4";
      ctx.fillRect(x, y, 320, 135);
      ctx.strokeRect(x, y, 320, 135);

      ctx.fillStyle = "#35E08C";
      ctx.fillRect(x, y, 320, 32);
      ctx.strokeRect(x, y, 320, 32);

      ctx.fillStyle = "#0D1F1A";
      ctx.font = "700 14px 'DM Mono', monospace";
      ctx.fillText(n.code, x + 14, y + 21);

      ctx.font = "800 24px 'Bricolage Grotesque', sans-serif";
      ctx.fillText(n.title, x + 16, y + 76);

      ctx.fillStyle = "#41564F";
      ctx.font = "500 17px 'Instrument Sans', sans-serif";
      ctx.fillText(n.sub, x + 16, y + 108);
    });

    ctx.fillStyle = "#41564F";
    ctx.font = "500 18px 'DM Mono', monospace";
    ctx.fillText("Esam Haraz  •  github.com/Esam-Haraz/AutoDeploy", 84, 532);

    const link = document.createElement("a");
    link.download = "og-cover.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "o") {
      e.preventDefault();
      generateOgCoverImage();
    }
  });

  /* Expose interactive handlers globally */
  window.switchSimTab = switchSimTab;
  window.toggleSimItemCheck = toggleSimItemCheck;
  window.previewSimStepToast = previewSimStepToast;
  window.runSimulatedDeployment = runSimulatedDeployment;
  window.selectStepMode = selectStepMode;
  window.pulseMatrixArrow = pulseMatrixArrow;
  window.copyReleaseSha = copyReleaseSha;

  /* --------------------------------------------------------------------------
     8. BOOTSTRAP ON DOMContentLoaded
     -------------------------------------------------------------------------- */
  function bootstrap() {
    DS.initTheme();
    DS.initLanguage(window.PAGE_I18N);
    DS.setupMobileNavDropdown();
    DS.initScrollRail([
      "hero-section",
      "queues-section",
      "steps-section",
      "challenges-section",
      "changelog-section",
      "contact-section"
    ]);
    initContactRoutes();
    renderSimStage(false);
    setTimeout(runHeroOrchestrationOnce, 180);
    fetchLatestGitHubRelease();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
