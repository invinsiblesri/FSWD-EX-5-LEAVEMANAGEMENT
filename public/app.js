/* =========================================================
   LeaveFlow — leave management (front-end demo)
   Data lives in localStorage so the deployed page needs no server.
   ========================================================= */

const $ = (id) => document.getElementById(id);

const KEYS = {
  profile: "leaveflow-profile-v1",
  requests: "leaveflow-requests-v1",
};

const TOTALS = { Casual: 12, Medical: 8 };

const TYPES = {
  Casual: { label: "Casual leave", icon: "🌴" },
  Medical: { label: "Medical leave", icon: "🩺" },
};

const DAY = 86400000;

let profile = readJSON(KEYS.profile);
let requests = readJSON(KEYS.requests);
let filter = "All";
let toastTimer = null;

/* ---------- storage helpers ---------- */
function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode - the page still works for this visit */
  }
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `r_${Date.now()}_${Math.random().toString(16).slice(2)}`;

/* ---------- date helpers ---------- */
const toISO = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const parseISO = (value) => {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d);
};

const daysBetween = (from, to) =>
  Math.round((parseISO(to) - parseISO(from)) / DAY) + 1;

const shiftDays = (offset) => toISO(new Date(Date.now() + offset * DAY));

const pretty = (iso) =>
  parseISO(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const rangeLabel = (from, to) =>
  from === to ? pretty(from) : `${pretty(from)} → ${pretty(to)}`;

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char];
  });

/* ---------- demo data ---------- */
function seedRequests() {
  return [
    {
      id: uid(),
      type: "Casual",
      from: shiftDays(-26),
      to: shiftDays(-25),
      days: 2,
      reason: "Family function at hometown",
      status: "Approved",
      createdAt: new Date(Date.now() - 30 * DAY).toISOString(),
    },
    {
      id: uid(),
      type: "Medical",
      from: shiftDays(-9),
      to: shiftDays(-9),
      days: 1,
      reason: "Dental appointment",
      status: "Approved",
      createdAt: new Date(Date.now() - 12 * DAY).toISOString(),
    },
    {
      id: uid(),
      type: "Casual",
      from: shiftDays(6),
      to: shiftDays(7),
      days: 2,
      reason: "Short trip with friends",
      status: "Pending",
      createdAt: new Date(Date.now() - 2 * DAY).toISOString(),
    },
    {
      id: uid(),
      type: "Medical",
      from: shiftDays(-72),
      to: shiftDays(-70),
      days: 3,
      reason: "Viral fever, doctor advised rest",
      status: "Rejected",
      createdAt: new Date(Date.now() - 76 * DAY).toISOString(),
    },
  ];
}

/* ---------- derived numbers ---------- */
const committedDays = (type) =>
  requests
    .filter((item) => item.type === type && item.status !== "Rejected")
    .reduce((sum, item) => sum + item.days, 0);

const approvedDays = (type) =>
  requests
    .filter((item) => item.type === type && item.status === "Approved")
    .reduce((sum, item) => sum + item.days, 0);

const availableDays = (type) =>
  Math.max(0, TOTALS[type] - committedDays(type));

const statusCount = (status) =>
  requests.filter((item) => item.status === status).length;

/* ---------- rendering ---------- */
function showAuth() {
  $("authView").classList.remove("hidden");
  $("appView").classList.add("hidden");
}

function showApp() {
  $("authView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.name.split(" ")[0];

  $("todayLabel").textContent = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("greeting").textContent = `${greeting}, ${firstName} 👋`;
  $("profileName").textContent = profile.name;
  $("profileMeta").textContent = `${profile.id} · ${profile.dept}`;
  $("avatar").textContent = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  renderStats();
  renderBalances();
  renderRequests();
}

function renderStats() {
  const available = availableDays("Casual") + availableDays("Medical");
  const approved = approvedDays("Casual") + approvedDays("Medical");
  const pending = statusCount("Pending");
  const decided = statusCount("Approved") + statusCount("Rejected");
  const rate = decided
    ? Math.round((statusCount("Approved") / decided) * 100)
    : 0;

  const tiles = [
    {
      icon: "🗓️",
      value: available,
      label: "Days available",
      note: "Casual + medical remaining",
      color: "#4f46e5",
    },
    {
      icon: "✅",
      value: approved,
      label: "Days taken",
      note: "Approved this year",
      color: "#10b981",
    },
    {
      icon: "⏳",
      value: pending,
      label: "Pending requests",
      note: pending ? "Awaiting manager approval" : "Nothing waiting",
      color: "#f59e0b",
    },
    {
      icon: "📈",
      value: `${rate}%`,
      label: "Approval rate",
      note: `${decided} request${decided === 1 ? "" : "s"} decided`,
      color: "#0ea5e9",
    },
  ];

  $("statCards").innerHTML = tiles
    .map(
      (tile) => `
      <article class="stat" style="--tile:${tile.color}">
        <div class="stat-icon" aria-hidden="true">${tile.icon}</div>
        <div class="stat-value">${tile.value}</div>
        <div class="stat-label">${tile.label}</div>
        <div class="stat-note">${tile.note}</div>
      </article>`
    )
    .join("");
}

function ringMarkup(percent, color) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.min(100, percent) / 100) * circumference;

  return `
    <div class="ring" style="--ring:${color}">
      <svg viewBox="0 0 92 92" aria-hidden="true">
        <circle class="track" cx="46" cy="46" r="${radius}"></circle>
        <circle class="bar" cx="46" cy="46" r="${radius}"
          stroke-dasharray="${filled} ${circumference}"></circle>
      </svg>
      <span class="ring-label">${percent}%</span>
    </div>`;
}

function renderBalances() {
  const cards = Object.keys(TYPES).map((type) => {
    const available = availableDays(type);
    const percent = Math.round((available / TOTALS[type]) * 100);
    const color = type === "Casual" ? "#4f46e5" : "#10b981";

    return `
      <article class="balance">
        <div class="balance-info">
          <h3><span aria-hidden="true">${TYPES[type].icon}</span> ${TYPES[type].label}</h3>
          <div class="balance-num">${available}<span> / ${TOTALS[type]} days left</span></div>
          <p class="balance-meta">
            ${committedDays(type)} used or reserved · ${approvedDays(type)} approved
          </p>
        </div>
        ${ringMarkup(percent, color)}
      </article>`;
  });

  $("balanceCards").innerHTML = cards.join("");
}

function renderRequests() {
  const list = [...requests]
    .filter((item) => filter === "All" || item.status === filter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  $("reqSummary").textContent = `${requests.length} request${
    requests.length === 1 ? "" : "s"
  } · ${statusCount("Pending")} pending`;

  if (list.length === 0) {
    $("requestList").innerHTML = `
      <div class="empty-state">
        <span class="big" aria-hidden="true">🗂️</span>
        <p>${
          requests.length === 0
            ? "No requests yet — your first one is one click away."
            : `No ${filter.toLowerCase()} requests.`
        }</p>
      </div>`;
    return;
  }

  $("requestList").innerHTML = list
    .map((item) => {
      const meta = TYPES[item.type];
      const when = rangeLabel(item.from, item.to);
      const canCancel = item.status === "Pending";

      return `
        <article class="request">
          <div class="req-main">
            <span class="req-icon ${item.type.toLowerCase()}" aria-hidden="true">${meta.icon}</span>
            <div>
              <div class="req-title">${meta.label} · ${item.days} day${item.days === 1 ? "" : "s"}</div>
              <div class="req-meta">${when}</div>
              <div class="req-reason" title="${esc(item.reason)}">${esc(item.reason)}</div>
            </div>
          </div>
          <span class="status ${item.status}">${item.status}</span>
          ${
            canCancel
              ? `<button class="req-action" data-cancel="${item.id}">Cancel</button>`
              : "<span></span>"
          }
        </article>`;
    })
    .join("");
}

/* ---------- toast ---------- */
function toast(message, type = "success") {
  const el = $("toast");
  el.textContent = message;
  el.className = `toast ${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2800);
}

/* ---------- auth ---------- */
$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("empName").value.trim();
  const id = $("empId").value.trim().toUpperCase();
  const dept = $("empDept").value;

  if (!name || !id) {
    toast("Please fill in your name and employee ID", "error");
    return;
  }

  const previous = profile;
  profile = { name, id, dept };
  writeJSON(KEYS.profile, profile);

  if (!requests || !previous || previous.id !== id) {
    requests = seedRequests();
    writeJSON(KEYS.requests, requests);
  }

  showApp();
  toast(`Welcome, ${name.split(" ")[0]}`);
});

$("signOutBtn").addEventListener("click", () => {
  profile = null;
  writeJSON(KEYS.profile, null);
  showAuth();
  $("empName").value = "";
  $("empId").value = "";
});

/* ---------- filters ---------- */
$("filterChips").addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;

  filter = chip.dataset.filter;

  document
    .querySelectorAll(".chip")
    .forEach((item) => item.classList.toggle("active", item === chip));

  renderRequests();
});

/* ---------- cancel a pending request ---------- */
$("requestList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cancel]");
  if (!button) return;

  const id = button.dataset.cancel;
  const target = requests.find((item) => item.id === id);
  if (!target) return;

  requests = requests.filter((item) => item.id !== id);
  writeJSON(KEYS.requests, requests);

  renderStats();
  renderBalances();
  renderRequests();
  toast("Request cancelled");
});

/* ---------- modal ---------- */
function openModal() {
  const today = toISO(new Date());
  $("leaveFrom").min = today;
  $("leaveTo").min = today;
  $("leaveForm").reset();
  $("daysPreview").textContent = "Pick your dates to see the duration.";
  $("daysPreview").classList.remove("warn");
  $("modal").classList.remove("hidden");
  $("leaveFrom").focus();
}

function closeModal() {
  $("modal").classList.add("hidden");
}

$("openModal").addEventListener("click", openModal);
$("closeModal").addEventListener("click", closeModal);
$("modal").addEventListener("click", (event) => {
  if (event.target === $("modal")) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("modal").classList.contains("hidden")) {
    closeModal();
  }
});

/* ---------- live duration preview ---------- */
function updatePreview() {
  const type = $("leaveType").value;
  const from = $("leaveFrom").value;
  const to = $("leaveTo").value;
  const preview = $("daysPreview");

  preview.classList.remove("warn");

  if (!from || !to) {
    preview.textContent = "Pick your dates to see the duration.";
    return;
  }

  if (parseISO(to) < parseISO(from)) {
    preview.textContent = "The end date cannot be before the start date.";
    preview.classList.add("warn");
    return;
  }

  const days = daysBetween(from, to);
  const available = availableDays(type);

  preview.textContent = `${days} day${days === 1 ? "" : "s"} · ${available} ${type.toLowerCase()} day${
    available === 1 ? "" : "s"
  } available`;

  if (days > available) {
    preview.textContent += " — exceeds your balance";
    preview.classList.add("warn");
  }
}

["leaveType", "leaveFrom", "leaveTo"].forEach((id) => {
  $(id).addEventListener("change", updatePreview);
});

/* ---------- submit a request ---------- */
$("leaveForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const type = $("leaveType").value;
  const from = $("leaveFrom").value;
  const to = $("leaveTo").value;
  const reason = $("leaveReason").value.trim();

  if (!from || !to) {
    toast("Choose the dates for your leave", "error");
    return;
  }

  if (parseISO(to) < parseISO(from)) {
    toast("The end date cannot be before the start date", "error");
    return;
  }

  if (!reason) {
    toast("Add a short reason for the request", "error");
    return;
  }

  const days = daysBetween(from, to);
  const available = availableDays(type);

  if (days > available) {
    toast(`Only ${available} ${type.toLowerCase()} day(s) left`, "error");
    return;
  }

  requests = [
    {
      id: uid(),
      type,
      from,
      to,
      days,
      reason,
      status: "Pending",
      createdAt: new Date().toISOString(),
    },
    ...requests,
  ];

  writeJSON(KEYS.requests, requests);
  closeModal();

  filter = "All";
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === "All");
  });

  renderStats();
  renderBalances();
  renderRequests();
  toast(`Request sent for ${days} day${days === 1 ? "" : "s"}`);
});

/* ---------- reset ---------- */
$("resetBtn").addEventListener("click", () => {
  localStorage.removeItem(KEYS.profile);
  localStorage.removeItem(KEYS.requests);
  profile = null;
  requests = null;
  showAuth();
  toast("Demo data cleared");
});

/* ---------- boot ---------- */
if (requests === null) {
  requests = seedRequests();
  writeJSON(KEYS.requests, requests);
}

if (profile) {
  showApp();
} else {
  showAuth();
}
