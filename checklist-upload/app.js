const checklistItems = [
  ["solution", "Telemedicine solution overview", "Prepare the pitch narrative: problem, proposed platform, target users, core modules, and delivery value."],
  ["implementation", "Implementation plan", "Prepare discovery, design, pilot, rollout, training, support, acceptance criteria, and timeline."],
  ["stakeholders", "Stakeholder map", "List Elvis, Raydo, hospital leads, Department of Health contacts, clinical users, IT, support, and decision makers."],
  ["monitoring", "Monitoring framework", "Define uptime, usage, service health, incident, SLA, adoption, and reporting dashboards."],
  ["risk", "Risk framework", "Prepare project, clinical, operational, integration, cyber, connectivity, and adoption risks with mitigations."],
  ["security", "Data security pack", "Prepare access control, encryption, audit logging, backup, retention, privacy, and breach response controls."],
  ["integration", "Department of Health integration", "Prepare integration assumptions, APIs, data exchange, HL7/FHIR mapping, legacy systems, and reporting approach."],
  ["outcomes", "Expected outcomes", "Define measurable outcomes: access to care, faster medicine fulfilment, better records, improved reporting, and reduced admin load."],
  ["demo", "Demo or screenshots", "Prepare wireframes, screenshots, clickable demo, or process mockups for the meeting."],
  ["commercials", "Commercial and resourcing plan", "Prepare roles, delivery effort, licensing assumptions, hosting assumptions, pricing inputs, and next-step proposal actions."]
];

const RECIPIENT = "raydo@skunkworks.africa";
const form = document.getElementById("checklistForm");
const progressPercent = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");
const uploadText = document.getElementById("uploadText");
const output = document.getElementById("submissionOutput");
const downloadButton = document.getElementById("downloadJson");
const container = document.querySelector(".checklist");
const validationSummary = document.createElement("div");
validationSummary.className = "validation-summary";
form.insertBefore(validationSummary, document.querySelector(".actions"));

container.innerHTML = `<legend>Meeting readiness checklist</legend>${checklistItems.map(([id, title, guidance]) => `
  <article class="check-card" data-item-id="${id}">
    <label class="check-item">
      <input type="checkbox" name="item" value="${title}">
      <span>${title}</span>
    </label>
    <p>${guidance}</p>
    <label class="evidence-label">Required document or evidence upload
      <input type="file" name="file-${id}" required>
    </label>
  </article>
`).join("")}`;

const checkboxes = Array.from(document.querySelectorAll('input[name="item"]'));
const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
const STORAGE_KEY = "telemedicine-rfp-checklist-state";
let latestSubmission = null;

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getEvidence() {
  return checklistItems.map(([id, title]) => {
    const fileInput = document.querySelector(`[name="file-${id}"]`);
    const file = fileInput && fileInput.files[0];
    return {
      id,
      title,
      checked: document.querySelector(`[data-item-id="${id}"] input[type="checkbox"]`).checked,
      fileName: file ? file.name : "",
      fileSize: file ? formatBytes(file.size) : "",
      fileType: file ? (file.type || "unknown") : ""
    };
  });
}

function updateProgress() {
  const checkedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
  const uploadedCount = fileInputs.filter((input) => input.files.length > 0).length;
  const total = checklistItems.length;
  const percent = Math.round(((checkedCount + uploadedCount) / (total * 2)) * 100);
  const degrees = Math.round((percent / 100) * 360);
  progressPercent.textContent = `${percent}%`;
  progressPercent.style.background = `conic-gradient(var(--success) ${degrees}deg, #e5e7eb ${degrees}deg)`;
  progressText.textContent = `${checkedCount} of ${total} checklist items complete`;
  uploadText.textContent = `${uploadedCount} of ${total} evidence uploads attached`;
}

function collectSubmission() {
  const data = new FormData(form);
  const evidence = getEvidence();
  return {
    preparedBy: data.get("submitterName") || "",
    email: data.get("email") || "",
    project: data.get("project") || "Northern Cape Telemedicine Solution RFP",
    dueDate: data.get("dueDate") || "",
    notes: data.get("notes") || "",
    recipient: RECIPIENT,
    evidence,
    completed: evidence.filter((item) => item.checked && item.fileName).length,
    total: evidence.length,
    generatedAt: new Date().toISOString()
  };
}

function validateSubmission() {
  const missing = getEvidence().filter((item) => !item.checked || !item.fileName);
  if (!missing.length) {
    validationSummary.className = "validation-summary success";
    validationSummary.innerHTML = "Ready: all checklist items are checked and all evidence uploads are selected.";
    return true;
  }
  validationSummary.className = "validation-summary error";
  validationSummary.innerHTML = `<strong>Not ready yet.</strong><ul>${missing.map((item) => `<li>${item.title}: ${!item.checked ? "not checked" : "missing upload"}</li>`).join("")}</ul>`;
  return false;
}

function renderSubmission(submission) {
  output.innerHTML = `<h3>Submission preview</h3><pre>${JSON.stringify(submission, null, 2)}</pre>`;
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
    form.elements.submitterName.value = state.preparedBy || "";
    form.elements.email.value = state.email || "";
    form.elements.project.value = state.project || "";
    form.elements.dueDate.value = state.dueDate || "";
    form.elements.notes.value = state.notes || "";
    if (Array.isArray(state.checked)) {
      checkboxes.forEach((checkbox, index) => checkbox.checked = Boolean(state.checked[index]));
    }
  } catch (error) {
    console.warn("Could not load saved state", error);
  }
}

function openEmail(submission) {
  const subject = encodeURIComponent(`Telemedicine RFP readiness pack - ${submission.project}`);
  const body = encodeURIComponent(`Hi Raydo,\n\nThe telemedicine RFP readiness checklist is complete.\n\nCompleted: ${submission.completed}/${submission.total}\n\nEvidence manifest:\n${submission.evidence.map((item) => `- ${item.title}: ${item.fileName}`).join("\n")}\n\nNotes:\n${submission.notes || "None"}\n\nPlease attach the selected evidence files before sending.\n`);
  window.location.href = `mailto:${RECIPIENT}?subject=${subject}&body=${body}`;
}

function downloadJson() {
  const submission = latestSubmission || collectSubmission();
  const blob = new Blob([JSON.stringify(submission, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "telemedicine-rfp-readiness-manifest.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateProgress();
  if (!validateSubmission()) return;
  latestSubmission = collectSubmission();
  renderSubmission(latestSubmission);
  saveState();
  downloadJson();
  openEmail(latestSubmission);
});

form.addEventListener("input", () => { updateProgress(); saveState(); });
form.addEventListener("change", () => { updateProgress(); saveState(); });
form.addEventListener("reset", () => setTimeout(() => { localStorage.removeItem(STORAGE_KEY); validationSummary.innerHTML = ""; output.innerHTML = "<h3>Readiness status</h3><p>Complete all checklist items and upload one evidence file per item.</p>"; updateProgress(); }, 0));
downloadButton.addEventListener("click", downloadJson);

loadState();
updateProgress();
