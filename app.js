const STORAGE_KEY = "bodymini_daily_records_v1";

const fields = [
  "date",
  "sleepTime",
  "wakeTime",
  "sleepQuality",
  "morningEnergy",
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
  "water",
  "trained",
  "trainingDetails",
  "supplements",
  "appetite",
  "energy",
  "focus",
  "bodyFeeling",
  "notes",
];

const labels = {
  date: "日期",
  sleepTime: "入睡时间",
  wakeTime: "起床时间",
  sleepQuality: "睡眠质量",
  morningEnergy: "醒来精神",
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snacks: "加餐 / 饮料 / 零食",
  water: "喝水量",
  trained: "是否训练",
  trainingDetails: "训练内容",
  supplements: "补剂",
  appetite: "胃口",
  energy: "精力",
  focus: "专注度",
  bodyFeeling: "消化 / 身体感受",
  notes: "备注",
};

const form = document.getElementById("record-form");
const historyList = document.getElementById("history-list");
const countEl = document.getElementById("record-count");
const titleEl = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const template = document.getElementById("record-item-template");

let records = loadRecords();
let editingId = null;

function createRecordId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `record_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}


setDefaultDate();
renderHistory();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const record = collectFormData();

  if (editingId) {
    records = records.map((item) => (item.id === editingId ? { ...item, ...record } : item));
    editingId = null;
  } else {
    records.unshift({
      id: createRecordId(),
      createdAt: new Date().toISOString(),
      ...record,
    });
  }

  persistRecords();
  renderHistory();
  resetForm();
});

cancelEditBtn.addEventListener("click", () => {
  editingId = null;
  resetForm();
});

function collectFormData() {
  const data = {};
  fields.forEach((field) => {
    data[field] = form.elements[field].value.trim();
  });
  return data;
}

function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function renderHistory() {
  historyList.innerHTML = "";
  countEl.textContent = `${records.length} 条`;

  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "还没有记录，先保存今天的数据吧。";
    historyList.appendChild(empty);
    return;
  }

  records
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((record) => {
      const node = template.content.cloneNode(true);
      const item = node.querySelector(".record-item");
      const toggle = node.querySelector(".toggle");
      const details = node.querySelector(".record-details");
      const editBtn = node.querySelector(".edit-btn");
      const deleteBtn = node.querySelector(".delete-btn");

      toggle.textContent = `${record.date || "未填写日期"} · 睡眠 ${record.sleepQuality || "-"}/5 · 精力 ${record.energy || "-"}/5`;

      details.innerHTML = fields
        .map((field) => {
          const value = record[field] || "-";
          return `<p><strong>${labels[field]}：</strong>${escapeHtml(value)}</p>`;
        })
        .join("");

      toggle.addEventListener("click", () => {
        details.hidden = !details.hidden;
      });

      editBtn.addEventListener("click", () => {
        editingId = record.id;
        fillForm(record);
      });

      deleteBtn.addEventListener("click", () => {
        const ok = window.confirm(`确定删除 ${record.date || "这条"} 记录吗？`);
        if (!ok) return;

        records = records.filter((itemRecord) => itemRecord.id !== record.id);
        persistRecords();
        renderHistory();

        if (editingId === record.id) {
          editingId = null;
          resetForm();
        }
      });

      historyList.appendChild(item);
    });
}

function fillForm(record) {
  fields.forEach((field) => {
    form.elements[field].value = record[field] || "";
  });

  titleEl.textContent = "编辑记录";
  saveBtn.textContent = "更新记录";
  cancelEditBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  form.reset();
  setDefaultDate();
  titleEl.textContent = "今日记录";
  saveBtn.textContent = "保存记录";
  cancelEditBtn.hidden = true;
}

function setDefaultDate() {
  if (!form.elements.date.value) {
    form.elements.date.value = new Date().toISOString().slice(0, 10);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
