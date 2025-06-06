let activities = JSON.parse(localStorage.getItem("activities")) || [];
let tableData = JSON.parse(localStorage.getItem("tableData")) || [];
let currentActivity = null; //Gambiarra
let currentActivityIndex = tableData.findIndex((entry) => !entry.endTime);

let appConfig = JSON.parse(localStorage.getItem("appConfig")) || {
  analysisName: "",
  analyst: "",
  bank: "",
  segment: "",
  interviewee: "",
  intervieweeRole: "",
  layoutSideBySide: false,
};

const requiredFields = [
  "analyst",
  "bank",
  "segment",
  "interviewee",
  "intervieweeRole",
];

requiredFields.forEach((field) => {
  document.getElementById(field).addEventListener("input", checkRequiredFields);
});

const fieldTranslations = {
  analyst: "Analista",
  bank: "Banco/Setor",
  segment: "Segmento",
  interviewee: "Entrevistado",
};

if (currentActivityIndex !== -1) {
  const activeEntry = tableData[currentActivityIndex];

  setTimeout(() => {
    startLiveTimer(activeEntry.startTimestamp);
  }, 50);
}

// Funções básicas de persistência
function saveActivities() {
  localStorage.setItem("activities", JSON.stringify(activities));
  loadActivities();
}

function saveTable() {
  localStorage.setItem("tableData", JSON.stringify(tableData));
  loadTable();
  updateMetrics();
}

function saveAppConfig() {
  localStorage.setItem("appConfig", JSON.stringify(appConfig));

  const fields = document.querySelectorAll(".config-field");
  fields.forEach((field) => {
    const input = field.querySelector("input");
    field.classList.toggle("filled", input.value.trim() !== "");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Carregar configurações
  document.getElementById("analysisName").value = appConfig.analysisName;
  document.getElementById("analyst").value = appConfig.analyst;
  document.getElementById("bank").value = appConfig.bank;
  document.getElementById("segment").value = appConfig.segment;
  document.getElementById("interviewee").value = appConfig.interviewee;
  document.getElementById("intervieweeRole").value = appConfig.intervieweeRole;

  const configFields = [
    "analysisName",
    "analyst",
    "bank",
    "segment",
    "interviewee",
    "intervieweeRole",
  ];

  configFields.forEach((field) => {
    document.getElementById(field).addEventListener("input", (e) => {
      appConfig[field] = e.target.value;
      saveAppConfig();
      updateExportButtonState();
      checkRequiredFields();
    });
  });

  // --- LÓGICA DO SWITCH DE LAYOUT (COM PERSISTÊNCIA) ---
  const layoutSwitch = document.getElementById("layoutSwitch");
  const analysisContentWrapper = document.getElementById(
    "analysisContentWrapper"
  );

  layoutSwitch.checked = appConfig.layoutSideBySide || false;
  analysisContentWrapper.classList.toggle("side-by-side", layoutSwitch.checked);

  layoutSwitch.addEventListener("change", () => {
    analysisContentWrapper.classList.toggle("side-by-side", layoutSwitch.checked);
    appConfig.layoutSideBySide = layoutSwitch.checked;
    saveAppConfig();
  });

  // --- LÓGICA DE DRAG AND DROP OTIMIZADA (COM DETECÇÃO DIRETA) ---
  function addDragAndDropListeners(container) {
    container.addEventListener("dragstart", (e) => {
      if (e.target.matches("li")) {
        e.target.classList.add("dragging");
      }
    });

    container.addEventListener("dragend", (e) => {
      if (e.target.matches("li")) {
        e.target.classList.remove("dragging");

        const liElements = [...container.querySelectorAll("li")];
        const nameOrder = liElements.map((li) => {
          const textElement =
            li.querySelector("label") || li.querySelector("span");
          return textElement.textContent.trim().replace(/^\d+\.\s*/, "");
        });

        activities.sort(
          (a, b) => nameOrder.indexOf(a.name) - nameOrder.indexOf(b.name)
        );
        saveActivities();
      }
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();

      const draggingItem = document.querySelector(".dragging");
      if (!draggingItem) return;
        
      // OTIMIZAÇÃO: Lógica de Auto-Scroll
      const scrollableParent = container.parentElement;
      const parentStyle = window.getComputedStyle(scrollableParent);
      if (parentStyle.overflowY === "auto" || parentStyle.overflowY === "scroll") {
        const scrollBounds = scrollableParent.getBoundingClientRect();
        const scrollThreshold = 50;
        const scrollSpeed = 10;

        if (e.clientY < scrollBounds.top + scrollThreshold) {
          scrollableParent.scrollTop -= scrollSpeed;
        } else if (e.clientY > scrollBounds.bottom - scrollThreshold) {
          scrollableParent.scrollTop += scrollSpeed;
        }
      }

      // OTIMIZAÇÃO: Lógica de reorganização baseada no elemento sob o cursor
      const overElement = document.elementFromPoint(e.clientX, e.clientY)?.closest('li:not(.dragging)');

      if (overElement) {
        const box = overElement.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;

        if (offset < 0) {
          container.insertBefore(draggingItem, overElement);
        } else {
          container.insertBefore(draggingItem, overElement.nextSibling);
        }
      }
    });
  }

  addDragAndDropListeners(document.getElementById("selectedActivities"));
  addDragAndDropListeners(document.getElementById("activitiesList"));

  // --- CARREGAMENTO INICIAL E OUTROS LISTENERS ---
  const intervieweeRoleSelect = document.getElementById("intervieweeRole");
  const otherRoleContainer = document.getElementById("otherRoleContainer");
  const otherRoleInput = document.getElementById("otherRoleInput");

  intervieweeRoleSelect.addEventListener("change", function () {
    if (this.value === "Outros") {
      otherRoleContainer.style.display = "block";
      otherRoleInput.required = true;
      intervieweeRoleSelect.removeAttribute("id");
      otherRoleInput.setAttribute("id", "intervieweeRole");
      otherRoleInput.addEventListener("input", (e) => {
        appConfig.intervieweeRole = e.target.value;
        saveAppConfig();
        updateExportButtonState();
      });
    } else {
      otherRoleContainer.style.display = "none";
      otherRoleInput.required = false;
      otherRoleInput.value = "";
      otherRoleInput.removeAttribute("id");
      intervieweeRoleSelect.setAttribute("id", "intervieweeRole");
      appConfig.intervieweeRole = this.value;
      saveAppConfig();
      updateExportButtonState();
    }
  });

  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", updateFilledStatus);
  });

  document.querySelectorAll(".input-container input").forEach((input) => {
    input.addEventListener("input", updateRequiredLabels);
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    document.querySelector(".spinner-circle").style.animation =
      "spin 0.8s linear infinite";
  });

  document.addEventListener("click", (e) => {
    if (e.target.name === "activity") {
      checkRequiredFields();
    }
  });

  document.getElementById("newActivity").addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const newActivity = e.target.value.trim().toLowerCase();

      if (
        activities.some(
          (activity) => activity.name.toLowerCase() === newActivity
        )
      ) {
        alert("Atividade já existe!");
        e.target.value = "";
        return;
      }
      activities.push({ name: newActivity });
      e.target.value = "";
      saveActivities();
    }
  });

  // Carregamento inicial de dados e UI
  loadActivities();
  loadTable();
  updateMetrics();
  updateExportButtonState();
  updateFilledStatus();
  updateRequiredLabels();
});

function updateFilledStatus() {
  document
    .querySelectorAll(
      ".input-group .config-input, .input-container input, .input-container select"
    )
    .forEach((input) => {
      const parent = input.closest(".input-group")
        ? input.closest(".config-label")
        : input.closest(".input-container");
      if (input.value.trim() !== "") {
        parent.classList.add("filled");
      } else {
        parent.classList.remove("filled");
      }
    });
}

function updateRequiredLabels() {
  document.querySelectorAll(".input-container").forEach((container) => {
    const input = container.querySelector("input, select");
    const label = container.querySelector("label");

    if (input && label) {
      if (input.value.trim() !== "") {
        label.classList.remove("required-label");
      } else {
        label.classList.add("required-label");
      }
    }
  });
}

function loadActivities() {
  const list = document.getElementById("activitiesList");
  list.innerHTML = activities
    .map(
      (activity, index) => `
        <li draggable="true">
            <span><strong>${index + 1}.</strong> ${activity.name}</span>
            <button onclick="deleteActivity(${index})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </li>
    `
    )
    .join("");

  const analysisList = document.getElementById("selectedActivities");
  analysisList.innerHTML = activities
    .map(
      (activity, index) => `
        <li draggable="true">
            <input type="radio" name="activity" id="activity${index}" value="${
        activity.name
      }">
            <label for="activity${index}"><strong>${
        index + 1
      }.</strong> ${activity.name}</label>
            <button onclick="event.stopPropagation(); deleteActivity(${index})"><i class="fas fa-trash-alt"></i></button>
        </li>
    `
    )
    .join("");

  document.getElementById("activitiesCount").textContent = activities.length;
  document.getElementById("activitiesCount2").textContent = activities.length;
  checkRequiredFields();
}

function handleActivityInput(e) {
  if (e.key === "Enter") {
    const newActivity = e.target.value.trim().toLowerCase();
    if (!newActivity) return;

    if (activities.some((a) => a.name.toLowerCase() === newActivity)) {
      alert("Atividade já existe!");
      e.target.value = "";
      return;
    }

    activities.push({ name: newActivity });
    e.target.value = "";
    saveActivities();
  }
}

function deleteActivity(index) {
  if (
    confirm(
      `Tem certeza que deseja excluir a atividade "${activities[index].name}"?`
    )
  ) {
    activities.splice(index, 1);
    saveActivities();
  }
}

function clearActivities() {
  if (confirm("Tem certeza que deseja limpar TODAS as atividades?")) {
    activities = [];
    saveActivities();
  }
}

function clearAll() {
  if (
    confirm(
      "ATENÇÃO: Isso limpará TODOS os dados da aplicação, incluindo configurações, atividades e a tabela de análise. Deseja continuar?"
    )
  ) {
    activities = [];
    appConfig = {
      analysisName: "",
      analyst: "",
      bank: "",
      segment: "",
      interviewee: "",
      intervieweeRole: "",
      layoutSideBySide: false,
    };
    tableData = [];

    saveActivities();
    saveAppConfig();
    saveTable();

    document.getElementById("analysisName").value = "";
    document.getElementById("analyst").value = "";
    document.getElementById("bank").value = "";
    document.getElementById("segment").value = "";
    document.getElementById("interviewee").value = "";
    document.getElementById("intervieweeRole").value = "Gerente";
    document.getElementById("otherRoleContainer").style.display = "none";

    const layoutSwitch = document.getElementById("layoutSwitch");
    layoutSwitch.checked = false;
    document
      .getElementById("analysisContentWrapper")
      .classList.remove("side-by-side");

    updateFilledStatus();
    updateRequiredLabels();
  }
}

// Funções da tabela
function startActivity() {
  const missingFields = requiredFields.filter((field) => {
    const el = document.getElementById(field);
    return !el || !el.value.trim();
  });

  if (missingFields.length > 0) {
    const translatedFields = missingFields.map(
      (field) => fieldTranslations[field] || field
    );
    alert(
      `Preencha todos os campos obrigatórios: ${translatedFields.join(", ")}`
    );
    return;
  }

  if (currentActivityIndex !== -1) {
    alert("Finalize a atividade atual antes de iniciar uma nova!");
    const activeEntry = tableData[currentActivityIndex];
    startLiveTimer(activeEntry.startTimestamp);
    return;
  }

  const activity = document.querySelector('input[name="activity"]:checked');
  if (!activity) {
    alert("Selecione uma atividade!");
    return;
  }

  const now = new Date();
  const newEntry = {
    bank: document.getElementById("bank").value,
    segment: document.getElementById("segment").value,
    interviewee: document.getElementById("interviewee").value,
    intervieweeRole: document.getElementById("intervieweeRole").value,
    activityName: activity.value,
    date: now.toLocaleDateString("pt-BR"),
    startTime: now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    startTimestamp: now.getTime(),
    endTime: null,
    endTimestamp: null,
    duration: 0,
    durationDisplay: '<span id="liveDuration">00:00:00</span>',
    analyst: document.getElementById("analyst").value,
    activity: activity.value,
    rework: 0,
    observation: "",
  };

  tableData.push(newEntry);
  saveTable();
  updateExportButtonState();
  checkRequiredFields();
  currentActivityIndex = tableData.length - 1;
  loadTable();
  startLiveTimer(newEntry.startTimestamp);
}

function finishActivity() {
  const lastEntry = tableData.find((entry) => !entry.endTime);
  if (!lastEntry) return;

  const endTime = new Date();
  const startTime = new Date(lastEntry.startTimestamp);
  const durationMs = endTime - startTime;

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  lastEntry.endTime = endTime.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  lastEntry.endTimestamp = endTime.getTime();
  lastEntry.duration = durationMs;
  lastEntry.durationDisplay =
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;

  const previousEntries = tableData.filter(
    (entry) =>
      entry.activity === lastEntry.activity &&
      entry.interviewee === lastEntry.interviewee &&
      entry.bank == lastEntry.bank &&
      entry !== lastEntry
  );

  lastEntry.rework = previousEntries.length > 0 ? 1 : 0;
  saveTable();
  updateExportButtonState();
  currentActivityIndex = -1;
  stopLiveTimer();
}

let liveTimerInterval = null;

function startLiveTimer(startTimestamp) {
  stopLiveTimer();
  function update() {
    const now = new Date().getTime();
    const elapsed = now - startTimestamp;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    const display =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;
    const span = document.getElementById("liveDuration");
    if (span) {
      span.textContent = display;
    }
  }
  update();
  liveTimerInterval = setInterval(update, 1000);
}

function stopLiveTimer() {
  clearInterval(liveTimerInterval);
  liveTimerInterval = null;
}

function deleteLastRow() {
  if (tableData.length > 0) {
    if (confirm("Tem certeza que deseja excluir a última linha da tabela?")) {
      const lastEntry = tableData[tableData.length - 1];
      if (!lastEntry.endTime) {
        stopLiveTimer();
        currentActivityIndex = -1;
      }
      tableData.pop();
      saveTable();
      updateExportButtonState();
    }
  }
}

function clearTable() {
  if (confirm("Tem certeza que deseja limpar TODA a tabela de análise?")) {
    stopLiveTimer();
    currentActivityIndex = -1;
    tableData = [];
    saveTable();
    updateExportButtonState();
  }
}

function updateExportButtonState() {
  const exportBtn = document.getElementById("exportBtn");
  const analysisName = document.getElementById("analysisName").value.trim();
  exportBtn.disabled = tableData.length === 0 || !analysisName;
}

function checkRequiredFields() {
  const allFields = [
    "analyst",
    "bank",
    "segment",
    "interviewee",
    "intervieweeRole",
  ];
  const isValid = allFields.every(
    (field) =>
      document.getElementById(field) &&
      document.getElementById(field).value.trim() !== ""
  );

  const activitySelected =
    document.querySelector('input[name="activity"]:checked') !== null;
  document.getElementById("startBtn").disabled = !isValid || !activitySelected;
}

// Exportação para Excel
function exportToExcel() {
  if (currentActivityIndex !== -1) {
    finishActivity();
  }
  const analysisName = document.getElementById("analysisName").value.trim();
  if (!analysisName) {
    alert("Por favor, preencha o 'Nome da Análise' para exportar.");
    return;
  }

  const loadingOverlay = document.getElementById("loadingOverlay");
  const exportBtn = document.getElementById("exportBtn");

  loadingOverlay.style.display = "flex";
  exportBtn.disabled = true;
  const wsData = XLSX.utils.aoa_to_sheet([
    [
      "Banco/Setor",
      "Segmento",
      "Entrevistado",
      "Cargo Entrevistado",
      "Atividade",
      "Data",
      "Início",
      "Fim",
      "Tempo Total",
      "Analista",
      "Retrabalho",
      "Observação",
    ],
    ...tableData.map((entry) => [
      entry.bank,
      entry.segment,
      entry.interviewee,
      entry.intervieweeRole,
      entry.activity,
      entry.date,
      entry.startTime,
      entry.endTime || "N/A",
      entry.durationDisplay,
      entry.analyst,
      entry.rework ? "1" : "0",
      entry.observation,
    ]),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, "Dados");
  const metrics = calculateMetrics();
  const wsMetrics = XLSX.utils.aoa_to_sheet([
    ["Métrica", "Valor"],
    ["Total de Atividades", metrics.totalActivities],
    ["Tempo Total", metrics.totalTime],
    ["Tempo Médio por Atividade", metrics.averageTime],
    [
      "Atividade Mais Longa",
      `${metrics.longestActivity.name || "-"} (${
        metrics.longestActivity.duration || "-"
      })`,
    ],
    ["Total de Retrabalhos", metrics.totalRework],
    ...metrics.reworkActivities.map((a) => [a.activity, a.count]),
  ]);

  XLSX.utils.book_append_sheet(wb, wsMetrics, "Métricas");

  wsData["!cols"] = [
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 50 },
  ];
  wsMetrics["!cols"] = [{ wch: 25 }, { wch: 20 }];

  const formattedDate = new Date()
    .toLocaleDateString("pt-BR")
    .replace(/\//g, "-");
  const analyst = document.getElementById("analyst").value || "Analista";
  const bank = document.getElementById("bank").value || "Banco";
  const segment = document.getElementById("segment").value || "Segmento";
  const fileName = `${analysisName}_${bank}_${segment}_${formattedDate}_${analyst}.xlsx`;

  XLSX.writeFile(wb, fileName);

  try {
    document.querySelector(".spinner-check").style.opacity = "1";
    document.querySelector(".checkmark").style.animation =
      "check-animation 0.6s ease-out forwards";
  } catch (error) {
    console.error("Erro na animação de exportação:", error);
  }

  setTimeout(() => {
    loadingOverlay.style.display = "none";
    exportBtn.disabled = false;
    document.querySelector(".spinner-check").style.opacity = "0";
    document.querySelector(".checkmark").style.animation = "";
  }, 1200);
}

function updateMetrics() {
  const metrics = calculateMetrics();
  document.getElementById("totalActivities").textContent =
    metrics.totalActivities;
  document.getElementById("averageTime").textContent = metrics.averageTime;
  document.getElementById("longestActivity").innerHTML = metrics
    .longestActivity.name
    ? `${metrics.longestActivity.name}<br><small>${metrics.longestActivity.duration}</small>`
    : "-";
  document.getElementById("totalTime").textContent = metrics.totalTime;
  document.getElementById("totalRework").textContent = metrics.totalRework;
  const reworkList = document.getElementById("reworkActivities");
  reworkList.innerHTML = metrics.reworkActivities
    .map(
      (a) =>
        `<li>Nome: <span class="metric_interviewee">${a.interviewee}</span> </BR> ID/Plataforma: <span class="metric_interviewee">${a.id}</span> </BR> ATV: <span class="metric_interviewee">${a.activity}</span> <span class="metric_number">${a.count}x</span></li>`
    )
    .join("");
}

function calculateMetrics() {
  const completedData = tableData.filter((entry) => entry.endTime);
  if (completedData.length === 0)
    return {
      totalActivities: 0,
      averageTime: "00:00:00",
      longestActivity: {},
      totalTime: "00:00:00",
      totalRework: 0,
      reworkActivities: [],
    };

  const totalMs = completedData.reduce((sum, entry) => sum + entry.duration, 0);
  const totalHours = Math.floor(totalMs / 3600000);
  const totalMinutes = Math.floor((totalMs % 3600000) / 60000);
  const totalSeconds = Math.floor((totalMs % 60000) / 1000);

  const avgMs = totalMs / completedData.length;
  const avgHours = Math.floor(avgMs / 3600000);
  const avgMinutes = Math.floor((avgMs % 3600000) / 60000);
  const avgSeconds = Math.floor((avgMs % 60000) / 1000);

  const longest = completedData.reduce((a, b) =>
    a.duration > b.duration ? a : b
  );

  return {
    totalActivities: completedData.length,
    averageTime: `${String(avgHours).padStart(2, "0")}:${String(
      avgMinutes
    ).padStart(2, "0")}:${String(avgSeconds).padStart(2, "0")}`,
    longestActivity: {
      name: longest.activity,
      duration: longest.durationDisplay,
    },
    totalTime: `${String(totalHours).padStart(2, "0")}:${String(
      totalMinutes
    ).padStart(2, "0")}:${String(totalSeconds).padStart(2, "0")}`,
    totalRework: completedData.reduce((sum, entry) => sum + entry.rework, 0),
    reworkActivities: completedData
      .filter((entry) => entry.rework > 0)
      .reduce((acc, entry) => {
        const key = `${entry.activity}-${entry.interviewee}-${entry.bank}`;
        const existing = acc.find((a) => a.key === key);
        if (existing) {
          existing.count++;
        } else {
          acc.push({
            key: key,
            activity: entry.activity,
            interviewee: entry.interviewee,
            id: entry.bank,
            count: 1,
          });
        }
        return acc;
      }, []),
  };
}

// Controle de abas
function showTab(index) {
  document.querySelectorAll(".tab-content").forEach((tab, i) => {
    tab.classList.toggle("active", i === index);
  });
  document.querySelectorAll(".tab-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });
  if (index === 2) updateMetrics();
}

function loadTable() {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = tableData
    .map(
      (entry, index) => `
        <tr>
            <td>${entry.bank}</td>
            <td class="hidden">${entry.segment}</td>
            <td>${entry.interviewee}</td>
            <td class="hidden">${entry.intervieweeRole}</td>
            <td class="contrast-table">${entry.activity}</td>
            <td class="hidden">${entry.date}</td>
            <td class="hidden">${entry.startTime}</td>
            <td class="hidden">${entry.endTime || "Em andamento"}</td>
            <td>${entry.durationDisplay}</td>
            <td class="hidden">${entry.analyst}</td>
            <td class="contrast-table">${entry.rework ? "Sim" : "Não"}</td>
            <td>
              <textarea oninput="updateObservation(${index}, this.value)">${
        entry.observation || ""
      }</textarea>
            </td>
        </tr>
    `
    )
    .join("");

  document.querySelectorAll("#tableBody textarea").forEach((textarea) => {
    textarea.addEventListener("input", autoResizeTextarea);

    setTimeout(() => {
      autoResizeTextarea({ target: textarea });
    }, 0);
  });

  currentActivityIndex = tableData.findIndex((entry) => !entry.endTime);
  if (currentActivityIndex !== -1) {
    startLiveTimer(tableData[currentActivityIndex].startTimestamp);
  }
}

function autoResizeTextarea(event) {
  const textarea = event.target;
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

function updateObservation(index, value) {
  if (tableData[index]) {
    tableData[index].observation = value;
    localStorage.setItem("tableData", JSON.stringify(tableData));
  }
}