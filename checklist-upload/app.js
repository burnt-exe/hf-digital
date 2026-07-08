const form = document.getElementById("checklistForm");
const checkboxes = Array.from(document.querySelectorAll('input[name="item"]'));
const fileUpload = document.getElementById("fileUpload");
const fileList = document.getElementById("fileList");
const progressPercent = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");
const output = document.getElementById("submissionOutput");
const downloadButton = document.getElementById("downloadJson");

const STORAGE_KEY = "checklist-upload-form-state";
let latestSubmission = null;

function getFiles() {
  return Array.from(fileUpload.files || []).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    lastModified: new Date(file.lastModified).toISOString()
  }));
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function updateFileList() {
  const files = getFiles();
  if (!files.length) {
    fileList.innerHTML = "";
    return;
  }

  fileList.innerHTML = files
    .map((file) => `
      <div class="file-pill">
        <span>${file.name}</span>
        <strong>${formatBytes(file.size)}</strong>
      </div>
    `)
    .join("");
}

function updateProgress() {
  const completed = checkboxes.filter((checkbox) => checkbox.checked).length;
  const total = checkboxes.length;
  const percent = Math.round((completed / total) * 100);
  const degrees = Math.round((percent / 100) * 360);

  progressPercent.textContent = `${percent}%`;
  progressPercent.style.background = `conic-gradient(var(--success) ${degrees}deg, #e5e7eb ${degrees}deg)`;
  progressText.textContent = `${completed} of ${total} items complete`;
}

function collectSubmission() {
  const data = new FormData(form);
  const checkedItems = checkboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  return {
    submitterName: data.get("submitterName") || "",
    email: data.get("email") || "",
    project: data.get("project") || "",
    dueDate: data.get("dueDate") || "",
    checklist: {
      completedCount: checkedItems.length,
      totalCount: checkboxes.length,
      completedItems: checkedItems,
      outstandingItems: checkboxes
        .filter((checkbox) => !checkbox.checked)
        .map((checkbox) => checkbox.value)
    },
    files: getFiles(),
    notes: data.get("notes") || "",
    generatedAt: new Date().toISOString()
  };
}

function saveState() {
  const state = collectSubmission();
  state.checked = checkboxes.map((checkbox) => checkbox.checked);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw);
    form.elements.submitterName.value = state.submitterName || "";
    form.elements.email.value = state.email || "";
    form.elements.project.value = state.project || "";
    form.elements.dueDate.value = state.dueDate || "";
    form.elements.notes.value = state.notes || "";
    if (Array.isArray(state.checked)) {
      checkboxes.forEach((checkbox, index) => {
        checkbox.checked = Boolean(state.checked[index]);
      });
    }
  } catch (error) {
    console.warn("Could not load saved checklist state", error);
  }
}

function renderSubmission(submission) {
  output.innerHTML = `
    <h3>Submission preview</h3>
    <pre>${JSON.stringify(submission, null, 2)}</pre>
  `;
}

function downloadJson() {
  const submission = latestSubmission || collectSubmission();
  const blob = new Blob([JSON.stringify(submission, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeProject = (submission.project || "checklist").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  link.href = url;
  link.download = `${safeProject || "checklist"}-submission.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  latestSubmission = collectSubmission();
  renderSubmission(latestSubmission);
  saveState();
});

form.addEventListener("input", () => {
  updateProgress();
  saveState();
});

form.addEventListener("reset", () => {
  setTimeout(() => {
    localStorage.removeItem(STORAGE_KEY);
    latestSubmission = null;
    fileList.innerHTML = "";
    output.innerHTML = "<h3>Submission preview</h3><p>No submission generated yet.</p>";
    updateProgress();
  }, 0);
});

checkboxes.forEach((checkbox) => checkbox.addEventListener("change", updateProgress));
fileUpload.addEventListener("change", () => {
  updateFileList();
  saveState();
});
downloadButton.addEventListener("click", downloadJson);

loadState();
updateProgress();
updateFileList();
