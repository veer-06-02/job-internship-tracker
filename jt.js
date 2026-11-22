
/* ---------- 1. DATA (LocalStorage) ---------- */
const STORAGE_KEY = "jobTrackerApplications";
const STATUSES = ["Applied", "Interview", "Selected", "Rejected"];
const STATUS_COLORS = { Applied: "#2563eb", Interview: "#ea7a0c", Selected: "#16a34a", Rejected: "#dc2626" };

// Sample records shown the first time the app opens
const SAMPLE_DATA = [
  { id: "s1", company: "Google", role: "Frontend Intern", date: "2026-11-12", type: "Internship", link: "https://careers.google.com", status: "Interview", notes: "Technical round scheduled next week." },
  { id: "s2", company: "Microsoft", role: "Software Engineer", date: "2026-11-05", type: "Full-time", link: "https://careers.microsoft.com", status: "Applied", notes: "Referred by a senior." },
  { id: "s3", company: "Infosys", role: "Systems Engineer Trainee", date: "2026-10-28", type: "Full-time", link: "https://www.infosys.com/careers", status: "Selected", notes: "Offer letter received." },
  { id: "s4", company: "Flipkart", role: "Web Development Intern", date: "2026-10-20", type: "Internship", link: "https://www.flipkartcareers.com", status: "Rejected", notes: "Try again next hiring cycle." },
  { id: "s5", company: "Zoho", role: "Junior Developer", date: "2026-11-15", type: "Full-time", link: "https://www.zoho.com/careers", status: "Applied", notes: "" },
  { id: "s6", company: "Swiggy", role: "UI Design Intern", date: "2026-11-01", type: "Internship", link: "", status: "Interview", notes: "HR call on Monday." },
  { id: "s7", company: "Freshworks", role: "Support Engineer", date: "2026-10-10", type: "Part-time", link: "https://www.freshworks.com/company/careers", status: "Rejected", notes: "" },
  { id: "s8", company: "Razorpay", role: "Backend Intern", date: "2026-11-18", type: "Internship", link: "https://razorpay.com/jobs", status: "Applied", notes: "Submitted portfolio link." }
];

let applications = loadApplications();

// Read from LocalStorage (use samples if nothing is saved yet)
function loadApplications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved);
  } catch (e) { /* corrupted data: fall back to samples */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA));
  return [...SAMPLE_DATA];
}

// Save the current array to LocalStorage, then refresh the UI
function saveApplications() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  renderAll();
}

/* ---------- 2. HELPERS ---------- */
const $ = (id) => document.getElementById(id);

// Escape user text so it can't inject HTML
function esc(text) {
  const d = document.createElement("div");
  d.textContent = text || "";
  return d.innerHTML;
}

function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function badge(status) { return `<span class="badge ${status}">${status}</span>`; }

let toastTimer;
function showToast(message, isError = false) {
  const t = $("toast");
  t.textContent = message;
  t.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = "toast"), 2800);
}

/* ---------- 3. RENDER ---------- */
function renderAll() {
  renderStats();
  renderRecent();
  renderOverview();
  renderTable();
}

function countBy(status) { return applications.filter((a) => a.status === status).length; }

function renderStats() {
  const cards = [["total", "Total Applications", applications.length]]
    .concat(STATUSES.map((s) => [s.toLowerCase(), s, countBy(s)]));
  $("stats").innerHTML = cards
    .map(([cls, label, n]) => `<div class="stat s-${cls}"><span>${label}</span><strong>${n}</strong></div>`)
    .join("");
}

function renderRecent() {
  const recent = [...applications].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  $("recentList").innerHTML = recent.length
    ? recent.map((a) => `
        <li data-view="${a.id}">
          <div class="avatar">${esc(a.company.charAt(0).toUpperCase())}</div>
          <div class="info"><strong>${esc(a.company)}</strong><small>${esc(a.role)} · ${formatDate(a.date)}</small></div>
          ${badge(a.status)}
        </li>`).join("")
    : `<li class="muted">No applications yet. Add your first one!</li>`;
}

function renderOverview() {
  const total = applications.length || 1; // avoid dividing by zero
  $("overview").innerHTML = STATUSES.map((s) => {
    const n = countBy(s);
    return `<div class="bar-row">
      <div class="bar-label"><span>${s}</span><span>${n}</span></div>
      <div class="bar"><i style="width:${(n / total) * 100}%;background:${STATUS_COLORS[s]}"></i></div>
    </div>`;
  }).join("");
}

// Applications table with search, filters and sorting
function renderTable() {
  const q = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const type = $("typeFilter").value;
  const order = $("sortSelect").value;

  const list = applications
    .filter((a) => !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q))
    .filter((a) => !status || a.status === status)
    .filter((a) => !type || a.type === type)
    .sort((a, b) => (order === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));

  $("emptyMsg").hidden = list.length > 0;
  $("tableBody").innerHTML = list.map((a) => `
    <tr>
      <td data-label="Company"><strong>${esc(a.company)}</strong></td>
      <td data-label="Job role">${esc(a.role)}</td>
      <td data-label="Applied">${formatDate(a.date)}</td>
      <td data-label="Type">${esc(a.type)}</td>
      <td data-label="Status">
        <select class="status-select badge ${a.status}" data-status="${a.id}" aria-label="Change status">
          ${STATUSES.map((s) => `<option ${s === a.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td data-label="Actions">
        <div class="actions">
          <button class="act" data-view="${a.id}">View</button>
          <button class="act" data-edit="${a.id}">Edit</button>
          <button class="act del" data-delete="${a.id}">Delete</button>
        </div>
      </td>
    </tr>`).join("");
}

/* ---------- 4. MODALS & FORM ---------- */
const form = $("appForm");
const fields = ["company", "role", "date", "type", "link", "status", "notes"];

function openModal(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
function closeModals() {
  document.querySelectorAll(".modal").forEach((m) => (m.hidden = true));
  document.body.style.overflow = "";
}

// Open the form empty (add) or filled (edit)
function openForm(id = null) {
  form.reset();
  clearErrors();
  $("appId").value = id || "";
  if (id) {
    const a = applications.find((x) => x.id === id);
    fields.forEach((f) => ($(f).value = a[f]));
    $("formTitle").textContent = "Edit application";
    $("saveBtn").textContent = "Update application";
  } else {
    $("date").value = new Date().toISOString().slice(0, 10);
    $("status").value = "Applied";
    $("formTitle").textContent = "Add application";
    $("saveBtn").textContent = "Save application";
  }
  closeModalsKeepScroll();
  openModal("formModal");
  $("company").focus();
}
function closeModalsKeepScroll() { document.querySelectorAll(".modal").forEach((m) => (m.hidden = true)); }

function clearErrors() {
  document.querySelectorAll(".err").forEach((e) => (e.textContent = ""));
  fields.forEach((f) => $(f).classList.remove("invalid"));
}

function setError(field, message) {
  document.querySelector(`.err[data-for="${field}"]`).textContent = message;
  $(field).classList.add("invalid");
}

// Check required fields; returns true when the form is valid
function validateForm() {
  clearErrors();
  let ok = true;
  const required = { company: "Company name is required.", role: "Job role is required.", date: "Select the application date.", type: "Select a job type.", status: "Select a status." };
  for (const f in required) {
    if (!$(f).value.trim()) { setError(f, required[f]); ok = false; }
  }
  const link = $("link").value.trim();
  if (link && !/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(link)) {
    setError("link", "Enter a valid website or job link.");
    ok = false;
  }
  return ok;
}

// Submit: add a new record or replace the existing one
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateForm()) { showToast("Please fix the highlighted fields.", true); return; }

  const record = {
    id: $("appId").value || "app_" + Date.now(),
    company: $("company").value.trim(),
    role: $("role").value.trim(),
    date: $("date").value,
    type: $("type").value,
    link: $("link").value.trim(),
    status: $("status").value,
    notes: $("notes").value.trim()
  };

  const index = applications.findIndex((a) => a.id === record.id);
  if (index > -1) {
    applications[index] = record; // update: replaces the old record
    showToast("Application updated successfully.");
  } else {
    applications.push(record);
    showToast("Application added successfully.");
  }
  saveApplications();
  form.reset();
  clearErrors();
  closeModals();
});

// Details popup
function openDetails(id) {
  const a = applications.find((x) => x.id === id);
  if (!a) return;
  const href = a.link ? (/^https?:\/\//i.test(a.link) ? a.link : "https://" + a.link) : "";
  $("detailBody").innerHTML = `
    <div class="detail-grid">
      <div><small>Company</small><strong>${esc(a.company)}</strong></div>
      <div><small>Job role</small><strong>${esc(a.role)}</strong></div>
      <div><small>Applied on</small>${formatDate(a.date)}</div>
      <div><small>Job type</small>${esc(a.type)}</div>
      <div><small>Status</small>${badge(a.status)}</div>
      <div><small>Link</small>${href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(a.link)}</a>` : "—"}</div>
      <div class="full"><small>Notes</small>${esc(a.notes) || "No notes added."}</div>
    </div>`;
  $("detailEdit").dataset.id = id;
  openModal("detailModal");
}

/* ---------- 5. ACTIONS (clicks on table / recent list) ---------- */
document.addEventListener("click", (e) => {
  const view = e.target.closest("[data-view]");
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");
  if (view) openDetails(view.dataset.view);
  if (edit) openForm(edit.dataset.edit);
  if (del) {
    const a = applications.find((x) => x.id === del.dataset.delete);
    if (a && confirm(`Delete the application to ${a.company}?`)) {
      applications = applications.filter((x) => x.id !== a.id);
      saveApplications();
      showToast("Application deleted.");
    }
  }
  if (e.target.closest("[data-close]")) closeModals();
  if (e.target.classList.contains("modal")) closeModals(); // click on backdrop
});

// Change status directly from the table
$("tableBody").addEventListener("change", (e) => {
  if (!e.target.dataset.status) return;
  const a = applications.find((x) => x.id === e.target.dataset.status);
  a.status = e.target.value;
  saveApplications();
  showToast(`Status changed to ${a.status}.`);
});

// Search / filter / sort controls
["searchInput", "statusFilter", "typeFilter", "sortSelect"].forEach((id) =>
  $(id).addEventListener("input", renderTable));
$("clearFilters").addEventListener("click", () => {
  $("searchInput").value = $("statusFilter").value = $("typeFilter").value = "";
  $("sortSelect").value = "desc";
  renderTable();
});

$("detailEdit").addEventListener("click", (e) => openForm(e.target.dataset.id));
["topAddBtn", "quickAddBtn", "navAdd"].forEach((id) =>
  $(id).addEventListener("click", () => { openForm(); closeSidebar(); }));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

/* ---------- 6. NAVIGATION ---------- */
const TITLES = { dashboard: "Dashboard", applications: "My Applications", settings: "Settings" };

function showPage(name) {
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + name));
  document.querySelectorAll(".nav-item[data-page]").forEach((n) => n.classList.toggle("active", n.dataset.page === name));
  $("pageTitle").textContent = TITLES[name];
  closeSidebar();
  window.scrollTo(0, 0);
}
document.querySelectorAll(".nav-item[data-page]").forEach((btn) =>
  btn.addEventListener("click", () => showPage(btn.dataset.page)));
$("viewAllBtn").addEventListener("click", () => showPage("applications"));

// Mobile sidebar
function closeSidebar() { $("sidebar").classList.remove("open"); }
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
$("overlay").addEventListener("click", closeSidebar);

/* ---------- 7. SETTINGS ---------- */
$("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(applications, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "job-applications.json";
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Data exported.");
});
$("resetBtn").addEventListener("click", () => {
  if (!confirm("Replace all current data with sample applications?")) return;
  applications = [...SAMPLE_DATA];
  saveApplications();
  showToast("Sample data loaded.");
});
$("clearBtn").addEventListener("click", () => {
  if (!confirm("Delete ALL applications? This cannot be undone.")) return;
  applications = [];
  saveApplications();
  showToast("All applications deleted.");
});

/* ---------- 8. INIT ---------- */
renderAll();
