const placeholderValues = new Set(["test", "testing", "none", "na", "n/a", "asdf", "qwerty", "demo", "sample"]);

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function hasPlaceholder(value) {
  return placeholderValues.has(cleanText(value).toLowerCase());
}

function isSequentialDigits(digits) {
  if (digits.length < 7) return false;
  const ascending = "01234567890123456789";
  const descending = "98765432109876543210";
  return ascending.includes(digits) || descending.includes(digits);
}

function validateTextField(errors, field, label, value, { min, max, requireLetter = false }) {
  if (!value) {
    errors[field] = `${label} is required.`;
    return;
  }

  if (value.length < min) {
    errors[field] = `${label} must be at least ${min} characters.`;
    return;
  }

  if (value.length > max) {
    errors[field] = `${label} must be ${max} characters or less.`;
    return;
  }

  if (requireLetter && !/[a-z]/i.test(value)) {
    errors[field] = `${label} must include letters.`;
    return;
  }

  if (hasPlaceholder(value)) {
    errors[field] = `Please enter a real ${label.toLowerCase()}.`;
  }
}

function validateEmail(email) {
  if (!email) return "Email is required.";
  if (email.length > 254) return "Email is too long.";
  if (email.includes("..")) return "Please enter a valid email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Please enter a valid email address.";

  const [localPart = "", domain = ""] = email.split("@");
  if (hasPlaceholder(localPart) || placeholderValues.has(domain.split(".")[0])) {
    return "Please enter a real email address.";
  }

  return "";
}

function validatePhone(phone) {
  if (!phone) return "Phone number is required.";
  if (!/^\+?[0-9().\-\s]+$/.test(phone)) return "Phone number can only include digits, spaces, +, -, and brackets.";

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return "Phone number must contain 7 to 15 digits.";
  if (/^(\d)\1+$/.test(digits)) return "Please enter a real phone number.";
  if (isSequentialDigits(digits)) return "Please enter a real phone number.";

  return "";
}

export function validateInquiry(input = {}) {
  const inquiry = {
    name: cleanText(input.name),
    email: cleanText(input.email).toLowerCase(),
    phone: cleanText(input.phone),
    company: cleanText(input.company),
    message: String(input.message || "").trim(),
  };
  const errors = {};

  validateTextField(errors, "name", "Name", inquiry.name, { min: 2, max: 80, requireLetter: true });
  const emailError = validateEmail(inquiry.email);
  if (emailError) errors.email = emailError;
  const phoneError = validatePhone(inquiry.phone);
  if (phoneError) errors.phone = phoneError;
  validateTextField(errors, "company", "Company", inquiry.company, { min: 2, max: 120, requireLetter: true });
  validateTextField(errors, "message", "Message", inquiry.message, { min: 10, max: 5000, requireLetter: true });

  return { inquiry, errors };
}
