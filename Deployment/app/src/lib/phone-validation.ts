export interface PhoneValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Rejects obviously fake numbers: all-same-digit (111-111-1111) and
 * ascending/descending runs of 4+ consecutive digits (123-234-1234).
 * Not a full carrier/format validator - format shape is checked separately.
 */
export function validatePhoneNumber(raw: string): PhoneValidationResult {
  const digits = raw.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, reason: "Phone number must be between 7 and 15 digits." };
  }

  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, reason: "Phone number cannot be a repeated single digit." };
  }

  const groups = raw.split(/[^0-9]+/).filter(Boolean);
  if (groups.length > 1) {
    const allIdentical = groups.every((g) => g === groups[0]);
    if (allIdentical) {
      return { valid: false, reason: "Phone number groups cannot all be identical." };
    }
  }

  let ascRun = 1;
  let descRun = 1;
  for (let i = 1; i < digits.length; i++) {
    const prev = Number(digits[i - 1]);
    const cur = Number(digits[i]);
    const ascStep = (prev + 1) % 10 === cur;
    const descStep = (prev - 1 + 10) % 10 === cur;

    ascRun = ascStep ? ascRun + 1 : 1;
    descRun = descStep ? descRun + 1 : 1;

    if (ascRun >= 4 || descRun >= 4) {
      return { valid: false, reason: "Phone number cannot be a simple sequential pattern." };
    }
  }

  return { valid: true };
}
