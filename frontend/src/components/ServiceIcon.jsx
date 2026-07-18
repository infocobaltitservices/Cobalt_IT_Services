import React from "react";

function ServiceIcon({ kind }) {
  if (kind === "gpu") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="11" y="14" width="26" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="16" y="19" width="16" height="10" rx="2.5" fill="currentColor" opacity="0.22" />
        <path d="M15 10v4M21 10v4M27 10v4M33 10v4M15 34v4M21 34v4M27 34v4M33 34v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  if (kind === "marketing") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M12 30l8-8 6 6 10-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 16h8v8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="15" cy="30" r="2.5" fill="currentColor" />
        <circle cx="24" cy="22" r="2.5" fill="currentColor" />
        <circle cx="32" cy="26" r="2.5" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "printing") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M15 18h18l5 6v10H10V24l5-6Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M18 18v-6h12v6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M19 30h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M14 31V17h20v14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M10 24h28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="17" cy="24" r="2.5" fill="currentColor" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" />
      <circle cx="31" cy="24" r="2.5" fill="currentColor" />
    </svg>
  );
}

export default ServiceIcon;
