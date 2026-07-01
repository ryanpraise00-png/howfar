// Utility helpers — expanded in subsequent sections.

export function formatPhone(raw: string): string {
  return raw.replace(/\s+/g, '').replace(/^00/, '+');
}

export function generateOtp(digits = 6): string {
  const max = Math.pow(10, digits);
  return Math.floor(Math.random() * max).toString().padStart(digits, '0');
}
