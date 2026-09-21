(function () {
  const grid = document.getElementById("scheduleGrid");
  if (!grid) return;

  const STORAGE_KEY = "ln-schedule-v2";

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const SLOTS = [
    { key: "s1", label: "11:00–12:00" },
    { key: "s2", label: "12:00–13:00" },
    { key: "s3", label: "13:00–14:00" },
    { key: "s4", label: "14:00–15:00" },
    { key: "s5", label: "15:00–16:00" },
    { key: "s6", label: "16:00–17:00" },
    { key: "s7", label: "17:00–18:00" },
    { key: "s8", label: "18:00–19:00" },
    { key: "s9", label: "19:00–20:00" },
    { key: "s10", label: "20:00–21:00" },
    { key: "s11", label: "21:00–22:00" },
    { key: "s12", label: "22:00–23:00" },
  ];

  const HOURS_PER_SLOT = 1;

  const GOALS = {
    excel: { label: "Excel Mastery", css: "goal-excel" },
    ai: { label: "Learning AI", css: "goal-ai" },
    projects: { label: "My Projects", css: "goal-projects" },
    techjobs: { label: "Tech Job Applications", css: "goal-techjobs" },
    csjobs: { label: "Customer Service Applications", css: "goal-csjobs" },
    sourcing: { label: "Job Sourcing", css: "goal-sourcing" },
    describe: { label: "Describing My Projects", css: "goal-describe" },
    csnet: { label: "CS & C#/.NET", css: "goal-csnet" },
    dataeng: { label: "Data Engineering & Analytics", css: "goal-dataeng" },
  };

  const GOAL_ORDER = [
    "sourcing",
    "techjobs",
    "csjobs",
    "excel",
    "ai",
    "projects",
    "describe",
    "csnet",
    "dataeng",
  ];

  // Every day: 1h job sourcing, 1h tech applications, 1h customer service
  // applications, plus daily project work and interview prep (describing
  // projects). Each day focuses on exactly ONE study topic for a solid
  // 3-hour block instead of splitting attention, rotating through the week
  // so every topic gets real, uninterrupted depth.
  // Monday's Excel session got skipped (job search only that day), so the
  // rest of the week's rotation shifts forward one day to absorb it instead
  // of dropping it: Tue picks up the makeup Excel session, then AI/CS.NET/
  // Data Eng each slide back a day.
  const STUDY_ROTATION = ["excel", "excel", "ai", "csnet", "dataeng", "excel", "ai"];

  function dayPlan(studyTopic) {
    return {
      s1: "sourcing", s2: "techjobs", s3: "csjobs", s4: "projects", s5: "describe",
      s6: studyTopic, s7: studyTopic, s8: studyTopic,
      s9: "projects", s10: "describe",
    };
  }

  const SUGGESTED_PLAN = {};
  DAYS.forEach((day, i) => {
    SUGGESTED_PLAN[day] = dayPlan(STUDY_ROTATION[i]);
  });

  function loadSchedule() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore corrupt storage */
    }
    return JSON.parse(JSON.stringify(SUGGESTED_PLAN));
  }

  function saveSchedule() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
    } catch (e) {
      /* storage unavailable — plan just won't persist */
    }
  }

  let schedule = loadSchedule();
  let openMenu = null;

  function closeMenu() {
    if (openMenu) {
      openMenu.remove();
      openMenu = null;
    }
  }

  document.addEventListener("click", (e) => {
    if (openMenu && !openMenu.contains(e.target) && !e.target.closest(".slotCell")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", closeMenu);

  function setAssignment(day, slotKey, goalKey) {
    if (!schedule[day]) schedule[day] = {};
    if (goalKey) schedule[day][slotKey] = goalKey;
    else delete schedule[day][slotKey];
    saveSchedule();
    render();
  }

  function openCellMenu(cell, day, slotKey) {
    closeMenu();
    const menu = document.createElement("div");
    menu.className = "cellMenu";
    menu.style.position = "fixed";

    GOAL_ORDER.forEach((key) => {
      const goal = GOALS[key];
      const btn = document.createElement("button");
      btn.type = "button";
      const dot = document.createElement("span");
      dot.className = "legendDot " + goal.css;
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(goal.label));
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        setAssignment(day, slotKey, key);
        closeMenu();
      });
      menu.appendChild(btn);
    });

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "cellMenu__clear";
    clearBtn.textContent = "Clear block";
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setAssignment(day, slotKey, null);
      closeMenu();
    });
    menu.appendChild(clearBtn);

    document.body.appendChild(menu);
    positionMenu(menu, cell);
    openMenu = menu;
  }

  function positionMenu(menu, cell) {
    const rect = cell.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 8;

    let left = rect.left + rect.width / 2 - menuRect.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));

    let top = rect.bottom + margin;
    if (top + menuRect.height > window.innerHeight - margin) {
      top = rect.top - menuRect.height - margin;
    }
    top = Math.max(margin, top);

    menu.style.left = left + "px";
    menu.style.top = top + "px";
  }

  function computeHours() {
    const totals = {};
    GOAL_ORDER.forEach((k) => (totals[k] = 0));
    let scheduledSlots = 0;
    DAYS.forEach((day) => {
      SLOTS.forEach((slot) => {
        const goalKey = schedule[day] && schedule[day][slot.key];
        if (goalKey && totals[goalKey] !== undefined) {
          totals[goalKey] += HOURS_PER_SLOT;
          scheduledSlots += 1;
        }
      });
    });
    return { totals, scheduledSlots };
  }

  function renderStats() {
    const statGrid = document.getElementById("statGrid");
    const totalLabel = document.getElementById("totalHoursLabel");
    if (!statGrid) return;

    const { totals, scheduledSlots } = computeHours();
    statGrid.innerHTML = "";

    GOAL_ORDER.forEach((key) => {
      const goal = GOALS[key];
      const item = document.createElement("div");
      item.className = "statItem";
      item.innerHTML =
        '<span class="legendDot ' + goal.css + '"></span>' +
        '<span class="statItem__label">' + goal.label + '</span>' +
        '<span class="statItem__hours">' + totals[key] + 'h</span>';
      statGrid.appendChild(item);
    });

    const totalSlots = DAYS.length * SLOTS.length;
    if (totalLabel) {
      totalLabel.textContent =
        scheduledSlots * HOURS_PER_SLOT + " / " + totalSlots * HOURS_PER_SLOT + " hrs scheduled";
    }
  }

  function renderGrid() {
    grid.innerHTML = "";
    grid.style.setProperty("--day-count", DAYS.length);

    const corner = document.createElement("div");
    corner.className = "scheduleGrid__corner";
    grid.appendChild(corner);

    DAYS.forEach((day) => {
      const head = document.createElement("div");
      head.className = "scheduleGrid__dayHead";
      head.textContent = day;
      grid.appendChild(head);
    });

    SLOTS.forEach((slot) => {
      const timeLabel = document.createElement("div");
      timeLabel.className = "scheduleGrid__timeLabel";
      timeLabel.textContent = slot.label;
      grid.appendChild(timeLabel);

      DAYS.forEach((day) => {
        const goalKey = schedule[day] && schedule[day][slot.key];
        const cell = document.createElement("div");
        cell.className = "slotCell" + (goalKey ? " " + GOALS[goalKey].css : "");
        cell.setAttribute("role", "button");
        cell.setAttribute("tabindex", "0");
        cell.title = goalKey ? GOALS[goalKey].label : "Unassigned — click to set focus";

        if (goalKey) {
          const label = document.createElement("span");
          label.className = "slotCell__label";
          label.textContent = GOALS[goalKey].label;
          cell.appendChild(label);
        } else {
          const label = document.createElement("span");
          label.className = "slotCell__label slotCell__label--empty";
          label.textContent = "+";
          cell.appendChild(label);
        }

        cell.addEventListener("click", (e) => {
          e.stopPropagation();
          openCellMenu(cell, day, slot.key);
        });

        grid.appendChild(cell);
      });
    });
  }

  function render() {
    renderGrid();
    renderStats();
  }

  const loadSuggestedBtn = document.getElementById("loadSuggestedBtn");
  if (loadSuggestedBtn) {
    loadSuggestedBtn.addEventListener("click", () => {
      schedule = JSON.parse(JSON.stringify(SUGGESTED_PLAN));
      saveSchedule();
      render();
    });
  }

  const clearAllBtn = document.getElementById("clearAllBtn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      schedule = {};
      DAYS.forEach((d) => (schedule[d] = {}));
      saveSchedule();
      render();
    });
  }

  render();
})();
