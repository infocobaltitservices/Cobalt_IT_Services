const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const ADMIN_KEY_STORAGE = "cobalt-admin-key";
const ADMIN_EMAIL_STORAGE = "cobalt-admin-email";

function getAdminHeaders() {
  const key = localStorage.getItem(ADMIN_KEY_STORAGE);
  return key ? { "x-admin-key": key } : {};
}

function dataUrlToFile(dataUrl, fileName = "upload.jpg") {
  const [header, base64Data] = String(dataUrl).split(",");
  const mimeMatch = header?.match(/data:([^;]+);base64/);
  const mimeType = mimeMatch?.[1] || "image/jpeg";
  const binaryString = atob(base64Data || "");
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
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
    const error = await response.json().catch(() => ({}));
    const inquiryError = new Error(error.message || "Inquiry submission failed");
    inquiryError.fields = error.fields || {};
    throw inquiryError;
  }

  return response.json();
}

export async function getAdminInquiries() {
  const response = await fetch(`${API_BASE}/api/admin/inquiries`, {
    headers: {
      ...getAdminHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load admin inquiries");
  }

  return response.json();
}

export async function deleteAdminInquiry(inquiryId) {
  const response = await fetch(`${API_BASE}/api/admin/inquiries/${inquiryId}`, {
    method: "DELETE",
    headers: {
      ...getAdminHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete inquiry");
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
  const file = dataUrlToFile(imageData, `${folder.replaceAll("/", "-")}.jpg`);
  return uploadAdminMedia(file, folder);
}

export async function uploadAdminMedia(file, folder = "cobalt-admin") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("resourceType", file.type.startsWith("video/") ? "video" : "image");

  const sendMediaUpload = (url, body, useFormData) =>
    fetch(url, {
      method: "POST",
      headers: useFormData ? { ...getAdminHeaders() } : { "Content-Type": "application/json", ...getAdminHeaders() },
      body,
    });

  let response = await sendMediaUpload(`${API_BASE}/api/admin/upload-media`, formData, true);

  if (response.status === 404 && file.type.startsWith("image/")) {
    const imageData = await fileToDataUrl(file);
    response = await sendMediaUpload(`${API_BASE}/api/admin/upload-image`, JSON.stringify({ imageData, folder }), false);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Media upload failed");
  }

  return response.json();
}
