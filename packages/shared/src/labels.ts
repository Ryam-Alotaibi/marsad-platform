export const RISK_FACTOR_LABELS_AR: Record<string, string> = {
  HUMAN_AWARENESS: "معرفة بشرية",
  LEGAL_COMPLIANCE: "امتثال قانوني",
  CYBER_COMPLIANCE: "امتثال سيبراني",
  ENVIRONMENTAL: "عوامل بيئية",
  INFRASTRUCTURE_AGE: "قِدم البنية التحتية",
};

export const ALERT_CATEGORY_LABELS_AR: Record<string, string> = {
  POWER: "الكهرباء والطاقة",
  NETWORK: "الشبكات والاتصالات",
  APPS: "التطبيقات والخدمات",
  ENVIRONMENT: "البيئة والمناخ",
  DATABASE: "قواعد البيانات",
  SECURITY: "الأمان والحماية",
  INFRASTRUCTURE: "البنية التحتية",
};

export const ALERT_SEVERITY_LABELS_AR: Record<string, string> = {
  CRITICAL: "حرج",
  WARNING: "تحذير",
  INFO: "معلومة",
};

export const ALERT_STATUS_LABELS_AR: Record<string, string> = {
  OPEN: "مفتوح",
  ACKNOWLEDGED: "قيد المعالجة",
  RESOLVED: "تم الحل",
};

export const ACTION_STATUS_LABELS_AR: Record<string, string> = {
  PENDING: "مطلوب",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "مكتمل",
};

export const DEVICE_CATEGORY_LABELS_AR: Record<string, string> = {
  AC: "التكييف",
  LIGHTING: "الإضاءة",
  COMPUTERS: "الحواسيب",
  PRINTERS: "الطابعات",
  MONITORS: "الشاشات",
};

export const SYSTEM_CATEGORY_LABELS_AR: Record<string, string> = {
  SERVER: "خوادم",
  MANAGEMENT_SYSTEM: "أنظمة إدارة",
  NETWORK: "شبكات",
};

export const SYSTEM_STATUS_LABELS_AR: Record<string, string> = {
  ACTIVE: "نشط",
  WARNING: "تحذير",
  DOWN: "متوقف",
};

export const NOTIFICATION_CHANNEL_LABELS_AR: Record<string, string> = {
  PUSH: "إشعار جوال",
  EMAIL: "بريد إلكتروني",
  SMS: "رسالة نصية",
  WHATSAPP: "واتساب",
  VOICE_CALL: "اتصال هاتفي آلي",
};

export const SENSOR_TYPE_LABELS_AR: Record<string, string> = {
  TEMPERATURE: "درجة الحرارة",
  HUMIDITY: "الرطوبة",
  AQI: "جودة الهواء",
  CO2: "ثاني أكسيد الكربون",
  WATER_LEAK: "تسرب المياه",
  LIGHT: "الإضاءة",
};

export const IOT_STATUS_LABELS_AR: Record<string, string> = {
  NORMAL: "طبيعي",
  WARNING: "تحذير",
  CRITICAL: "حرج",
};

export const SCHEDULED_SERVICE_TYPE_LABELS_AR: Record<string, string> = {
  HEARING: "جلسة/موعد رسمي",
  APPOINTMENT: "موعد",
  TRANSACTION: "معاملة",
};

export const CONTINUITY_ACTION_LABELS_AR: Record<string, string> = {
  REMOTE: "تحويل لعن بُعد",
  RE_ROUTED: "إعادة توجيه لموقع آخر",
  CANCELLED: "إلغاء وإعادة جدولة",
};

export const CONTINUITY_SOURCE_LABELS_AR: Record<string, string> = {
  PREDICTION: "تنبؤ ذكي",
  SCENARIO: "سيناريو محاكاة",
};

export const AUDIT_ACTION_LABELS_AR: Record<string, string> = {
  LOGIN: "تسجيل دخول",
  CREATE_ALERT: "إنشاء تنبيه",
  SEND_NOTIFICATIONS: "إرسال إشعارات",
  FREEZE_PLAYBOOK: "تجميد خطة طوارئ",
  ACTIVATE_PLAYBOOK: "تفعيل خطة طوارئ",
  APPLY_CONTINUITY_ACTION: "تنفيذ إجراء استمرارية",
  RUN_FEDERATED_ROUND: "تشغيل جولة تعلّم اتحادي",
};
