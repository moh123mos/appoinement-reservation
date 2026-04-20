import { throwAppError } from "./errors";

type MinuteRange = {
  startMinute: number;
  endMinute: number;
};

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\-\s()]{8,20}$/;

export function assertIsoDate(date: string, fieldName = "appointmentDate") {
  if (!ISO_DATE_REGEX.test(date)) {
    throwAppError("INVALID_DATE", `${fieldName} must follow YYYY-MM-DD format.`, {
      fieldName,
      value: date,
    });
  }

  const normalized = `${date}T00:00:00.000Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throwAppError("INVALID_DATE", `${fieldName} is not a valid date.`, {
      fieldName,
      value: date,
    });
  }
}

export function assertMinuteRange(range: MinuteRange) {
  if (!Number.isInteger(range.startMinute) || !Number.isInteger(range.endMinute)) {
    throwAppError("INVALID_TIME_RANGE", "startMinute and endMinute must be integers.", {
      range,
    });
  }

  if (range.startMinute < 0 || range.endMinute > 24 * 60) {
    throwAppError("INVALID_TIME_RANGE", "Appointment must stay within the same day.", {
      range,
    });
  }

  if (range.endMinute <= range.startMinute) {
    throwAppError("INVALID_TIME_RANGE", "endMinute must be greater than startMinute.", {
      range,
    });
  }
}

export function assertSlotDuration(slotMinutes: number) {
  if (!Number.isInteger(slotMinutes) || slotMinutes <= 0) {
    throwAppError("INVALID_TIME_RANGE", "slotMinutes must be a positive integer.", {
      slotMinutes,
    });
  }

  if (slotMinutes > 240) {
    throwAppError("INVALID_TIME_RANGE", "slotMinutes is too large.", {
      slotMinutes,
    });
  }
}

export function assertPhone(phone: string, fieldName = "patientPhone") {
  if (!PHONE_REGEX.test(phone.trim())) {
    throwAppError("INVALID_PHONE", `${fieldName} format is invalid.`, {
      fieldName,
    });
  }
}

export function assertEmail(email?: string) {
  if (!email) {
    return;
  }

  if (!SIMPLE_EMAIL_REGEX.test(email.trim())) {
    throwAppError("INVALID_EMAIL", "patientEmail format is invalid.");
  }
}

export function assertNotPastDate(date: string) {
  const candidate = new Date(`${date}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (candidate.getTime() < now.getTime()) {
    throwAppError("INVALID_DATE", "appointmentDate cannot be in the past.", {
      date,
    });
  }
}

export function overlaps(a: MinuteRange, b: MinuteRange) {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute;
}
