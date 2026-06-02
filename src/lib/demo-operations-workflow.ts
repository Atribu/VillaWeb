import type { DemoRequest } from "@/lib/demo-operations";

export type DemoOperationTaskType =
  | "RESERVATION_TRACK"
  | "SUPPLIER_APPROVAL"
  | "REMINDER"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "CLEANING";

export type DemoOperationTaskStatus =
  | "PENDING"
  | "READY"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED";

export type DemoOperationTaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type DemoOperationTask = {
  id: string;
  companyId: string;
  requestId: string;
  villaSlug: string;
  villaTitle: string;
  guestName: string;
  taskType: DemoOperationTaskType;
  title: string;
  detail: string;
  scheduledDate: string;
  scheduledTimeLabel: string;
  assignee: string;
  supplierName?: string;
  priority: DemoOperationTaskPriority;
  status: DemoOperationTaskStatus;
  source: "AUTO_RESERVATION" | "MANUAL";
  createdAt: string;
};

function addDays(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function getSeedStatusForDate(dateKey: string): DemoOperationTaskStatus {
  const todayKey = new Date().toISOString().slice(0, 10);

  if (dateKey < todayKey) {
    return "DONE";
  }

  if (dateKey === todayKey) {
    return "READY";
  }

  return "PENDING";
}

export function getOperationTaskTypeLabel(taskType: DemoOperationTaskType) {
  switch (taskType) {
    case "RESERVATION_TRACK":
      return "Ev Takip";
    case "SUPPLIER_APPROVAL":
      return "Tedarikci Onayi";
    case "REMINDER":
      return "Hatirlatici";
    case "CHECK_IN":
      return "Karsilama";
    case "CHECK_OUT":
      return "Cikis Operasyonu";
    case "CLEANING":
      return "Temizlik";
  }
}

export function getOperationTaskStatusLabel(status: DemoOperationTaskStatus) {
  switch (status) {
    case "READY":
      return "Hazir";
    case "IN_PROGRESS":
      return "Islemde";
    case "DONE":
      return "Tamamlandi";
    case "CANCELLED":
      return "Iptal";
    default:
      return "Bekliyor";
  }
}

export function getOperationTaskStatusTone(status: DemoOperationTaskStatus) {
  switch (status) {
    case "READY":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "IN_PROGRESS":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "DONE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getOperationTaskPriorityLabel(priority: DemoOperationTaskPriority) {
  switch (priority) {
    case "HIGH":
      return "Yuksek";
    case "MEDIUM":
      return "Orta";
    default:
      return "Dusuk";
  }
}

export function buildOperationTasksForApprovedRequest(request: DemoRequest): DemoOperationTask[] {
  const createdDate = request.createdAt.slice(0, 10);
  const supplierDate = addDays(request.checkIn, -2);
  const reminderDate = addDays(request.checkIn, -1);

  const definitions: Array<
    Omit<
      DemoOperationTask,
      "id" | "companyId" | "requestId" | "villaSlug" | "villaTitle" | "guestName" | "createdAt" | "source"
    >
  > = [
    {
      taskType: "RESERVATION_TRACK",
      title: "Rezervasyon takip dosyasini ac",
      detail: `${request.fullName} kaydi icin operasyon evragi ve villa ozetini kontrol et.`,
      scheduledDate: createdDate,
      scheduledTimeLabel: "Kayit sonrasi",
      assignee: "Rezervasyon Masasi",
      priority: "HIGH",
      status: getSeedStatusForDate(createdDate),
    },
    {
      taskType: "SUPPLIER_APPROVAL",
      title: "Tedarikci ve hazirlik onaylarini tamamla",
      detail: `${request.villaTitle} icin temizlik, havuz ve sarf kontrollerini dogrula.`,
      scheduledDate: supplierDate,
      scheduledTimeLabel: "10:00",
      assignee: "Operasyon Koordinatoru",
      supplierName: "Villa Hazirlik Ekibi",
      priority: "MEDIUM",
      status: getSeedStatusForDate(supplierDate),
    },
    {
      taskType: "REMINDER",
      title: "Misafir on bilgilendirme hatirlatmasi",
      detail: `${request.fullName} ile giris saati, konum ve erisim notlarini teyit et.`,
      scheduledDate: reminderDate,
      scheduledTimeLabel: "18:00",
      assignee: "Misafir Deneyimi",
      priority: "MEDIUM",
      status: getSeedStatusForDate(reminderDate),
    },
    {
      taskType: "CHECK_IN",
      title: "Karsilama operasyonunu tamamla",
      detail: `${request.fullName} icin giris gunu karsilama ve anahtar teslimini yonet.`,
      scheduledDate: request.checkIn,
      scheduledTimeLabel: "15:00",
      assignee: "Karsilama Ekibi",
      priority: "HIGH",
      status: getSeedStatusForDate(request.checkIn),
    },
    {
      taskType: "CHECK_OUT",
      title: "Cikis operasyonunu planla",
      detail: `${request.fullName} ayrilisi sonrasi anahtar, depozito ve hasar kontrolunu kaydet.`,
      scheduledDate: request.checkOut,
      scheduledTimeLabel: "10:00",
      assignee: "Operasyon Ekibi",
      priority: "MEDIUM",
      status: getSeedStatusForDate(request.checkOut),
    },
    {
      taskType: "CLEANING",
      title: "Cikis sonrasi temizlik gorevini kapat",
      detail: `${request.villaTitle} icin bir sonraki konaklama oncesi detayli temizlik ve kontrol yap.`,
      scheduledDate: request.checkOut,
      scheduledTimeLabel: "11:30",
      assignee: "Temizlik Ekibi",
      supplierName: "Housekeeping Partner",
      priority: "HIGH",
      status: getSeedStatusForDate(request.checkOut),
    },
  ];

  return definitions.map((definition, index) => ({
    id: `${request.id.toLowerCase()}-task-${String(index + 1).padStart(2, "0")}`,
    companyId: request.companyId,
    requestId: request.id,
    villaSlug: request.villaSlug,
    villaTitle: request.villaTitle,
    guestName: request.fullName,
    source: "AUTO_RESERVATION",
    createdAt: request.createdAt,
    ...definition,
  }));
}
