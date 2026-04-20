const ERROR_CODE_MESSAGES_AR: Record<string, string> = {
  BAD_REQUEST: "البيانات المدخلة غير مكتملة.",
  INVALID_DATE: "التاريخ المحدد غير صالح.",
  INVALID_TIME_RANGE: "توقيت الموعد غير صالح.",
  INVALID_EMAIL: "صيغة البريد الإلكتروني غير صحيحة.",
  INVALID_PHONE: "صيغة رقم الهاتف غير صحيحة.",
  SLOT_CONFLICT: "هذا الموعد تم حجزه بالفعل. اختر وقتا آخر.",
  NOT_FOUND: "العنصر المطلوب غير موجود.",
  FORBIDDEN: "ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  DUPLICATE_BOOKING: "تم تسجيل حجز مشابه بالفعل.",
};

type ConvexErrorData = {
  code?: string;
  message?: string;
};

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractConvexErrorData(error: unknown): ConvexErrorData | null {
  if (!isObjectLike(error)) {
    return null;
  }

  const data = error.data;
  if (!isObjectLike(data)) {
    return null;
  }

  const payload: ConvexErrorData = {};

  if (typeof data.code === "string") {
    payload.code = data.code;
  }

  if (typeof data.message === "string") {
    payload.message = data.message;
  }

  return payload;
}

export function getConvexErrorCode(error: unknown) {
  return extractConvexErrorData(error)?.code ?? null;
}

export function toUserErrorMessage(
  error: unknown,
  fallbackMessage = "حدث خطأ غير متوقع، حاول مرة أخرى.",
) {
  const convexData = extractConvexErrorData(error);

  if (convexData?.code && ERROR_CODE_MESSAGES_AR[convexData.code]) {
    return ERROR_CODE_MESSAGES_AR[convexData.code];
  }

  if (convexData?.message) {
    return convexData.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}
