export type BookingFormInput = {
  patientName: string;
  patientPhone: string;
  patientEmail: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\-\s()]{8,20}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(isoDate: string) {
  if (!ISO_DATE_REGEX.test(isoDate)) {
    return false;
  }

  const parsed = new Date(`${isoDate}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function isPastIsoDate(isoDate: string) {
  if (!isValidIsoDate(isoDate)) {
    return false;
  }

  const candidate = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return candidate.getTime() < today.getTime();
}

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string) {
  return PHONE_REGEX.test(phone.trim());
}

export function validateBookingForm(input: BookingFormInput) {
  if (!input.patientName.trim()) {
    return "الاسم مطلوب.";
  }

  if (!input.patientPhone.trim()) {
    return "رقم الموبايل مطلوب.";
  }

  if (!input.patientEmail.trim()) {
    return "البريد الإلكتروني مطلوب.";
  }

  if (!isValidPhone(input.patientPhone)) {
    return "صيغة رقم الموبايل غير صحيحة.";
  }

  if (!isValidEmail(input.patientEmail)) {
    return "صيغة البريد الإلكتروني غير صحيحة.";
  }

  return null;
}

export function validateSlotRange(startMinute: number, endMinute: number) {
  if (!Number.isInteger(startMinute) || !Number.isInteger(endMinute)) {
    return "وقت الموعد غير صالح.";
  }

  if (startMinute < 0 || endMinute > 24 * 60 || endMinute <= startMinute) {
    return "نطاق وقت الموعد غير صالح.";
  }

  return null;
}
