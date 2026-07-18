function getAdminSecret() {
  return process.env.ADMIN_ACCESS_KEY || "cobalt-admin-dev-key";
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "admin@cobalt.local",
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

export function assertAdminAccess(req, res, next) {
  const providedKey = req.headers["x-admin-key"];
  if (providedKey && providedKey === getAdminSecret()) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized admin access" });
}

export function createAdminSessionToken() {
  return getAdminSecret();
}
