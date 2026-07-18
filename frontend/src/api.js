const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const ADMIN_KEY_STORAGE = "cobalt-admin-key";
const ADMIN_EMAIL_STORAGE = "cobalt-admin-email";

function getAdminHeaders() {
  const key = localStorage.getItem(ADMIN_KEY_STORAGE);
  return key ? { "x-admin-key": key } : {};
}

export async function getSiteMeta() {
  const [navigationRes, healthRes] = await Promise.all([
    fetch(`${API_BASE}/api/navigation`),
    fetch(`${API_BASE}/health`),
  ]);

  if (!navigationRes.ok || !healthRes.ok) {
    throw new Error("Failed to load site metadata");
  }

  return {
    navigation: await navigationRes.json(),
    health: await healthRes.json(),
  };
}

export async function getSiteContent() {
  const response = await fetch(`${API_BASE}/api/site-content`);

  if (!response.ok) {
    throw new Error("Failed to load site content");
  }

  return response.json();
}

export async function submitInquiry(payload) {
  const response = await fetch(`${API_BASE}/api/inquiry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Inquiry submission failed");
  }

  return response.json();
}

export function setAdminAccessKey(key) {
  if (!key) {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    localStorage.removeItem(ADMIN_EMAIL_STORAGE);
    return;
  }
  localStorage.setItem(ADMIN_KEY_STORAGE, key);
}

export function getAdminAccessKey() {
  return localStorage.getItem(ADMIN_KEY_STORAGE) || "";
}

export function getAdminEmail() {
  return localStorage.getItem(ADMIN_EMAIL_STORAGE) || "";
}

export async function loginAdmin(email, password) {
  const response = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Admin login failed");
  }

  const payload = await response.json();
  localStorage.setItem(ADMIN_KEY_STORAGE, payload.token);
  localStorage.setItem(ADMIN_EMAIL_STORAGE, payload.email);
  return payload;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY_STORAGE);
  localStorage.removeItem(ADMIN_EMAIL_STORAGE);
}

export async function getAdminSiteContent() {
  const response = await fetch(`${API_BASE}/api/admin/site-content`, {
    headers: {
      ...getAdminHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load admin site content");
  }

  return response.json();
}

export async function saveAdminSiteContent(payload) {
  const response = await fetch(`${API_BASE}/api/admin/site-content`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAdminHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to save admin site content");
  }

  return response.json();
}

export async function uploadAdminImage(imageData, folder = "cobalt-admin") {
  const response = await fetch(`${API_BASE}/api/admin/upload-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAdminHeaders(),
    },
    body: JSON.stringify({ imageData, folder }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Image upload failed");
  }

  return response.json();
}
