import { DEMO_REFERENCE_DATE } from "@/lib/demo-operations";
import { formatCurrency } from "@/lib/villa-catalog";

export type DemoInvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";
export type DemoPaymentStatus = "PENDING" | "PAID" | "CANCELLED";
export type DemoPaymentDisplayStatus = DemoPaymentStatus | "OVERDUE";
export type DemoPaymentType = "DEPOSIT" | "BALANCE";
export type DemoCashDirection = "INCOME" | "EXPENSE";
export type DemoCashSource = "AUTO_PAYMENT" | "MANUAL";

export type DemoInvoiceRecord = {
  id: string;
  requestId: string;
  villaSlug: string;
  villaTitle: string;
  guestName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: DemoInvoiceStatus;
  source: "AUTO_APPROVAL";
  createdAt: string;
  updatedAt: string;
};

export type DemoPaymentRecord = {
  id: string;
  invoiceId: string;
  requestId: string;
  villaSlug: string;
  villaTitle: string;
  guestName: string;
  type: DemoPaymentType;
  title: string;
  amount: number;
  dueDate: string;
  status: DemoPaymentStatus;
  method: string;
  source: "AUTO_APPROVAL";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DemoCashEntry = {
  id: string;
  requestId?: string;
  invoiceId?: string;
  paymentId?: string;
  villaSlug?: string;
  villaTitle?: string;
  guestName?: string;
  direction: DemoCashDirection;
  category: string;
  title: string;
  amount: number;
  date: string;
  source: DemoCashSource;
  note?: string;
  createdAt: string;
};

export type DemoFinanceBalanceRecord = {
  requestId: string;
  invoiceId: string;
  villaSlug: string;
  villaTitle: string;
  guestName: string;
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  invoiceStatus: DemoInvoiceStatus;
  paymentStatus: DemoPaymentDisplayStatus;
  nextDueDate?: string;
  nextDueAmount?: number;
  lastPaidAt?: string;
};

export type DemoFinanceAlert = {
  title: string;
  detail: string;
  tone: "success" | "warning" | "neutral";
};

export type DemoFinanceOverview = {
  summaryCards: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  invoiceStatusCounts: Record<DemoInvoiceStatus, number>;
  paymentStatusCounts: Record<DemoPaymentDisplayStatus, number>;
  recentInvoices: DemoInvoiceRecord[];
  recentPayments: Array<
    DemoPaymentRecord & {
      displayStatus: DemoPaymentDisplayStatus;
    }
  >;
  alerts: DemoFinanceAlert[];
  cashNet: number;
  totalCollected: number;
  totalOutstanding: number;
  totalContracted: number;
};

export function getInvoiceStatusLabel(status: DemoInvoiceStatus) {
  switch (status) {
    case "DRAFT":
      return "Taslak";
    case "SENT":
      return "Gonderildi";
    case "PAID":
      return "Odendi";
    case "CANCELLED":
      return "Iptal";
    default:
      return status;
  }
}

export function getInvoiceStatusTone(status: DemoInvoiceStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "SENT":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getPaymentTypeLabel(type: DemoPaymentType) {
  switch (type) {
    case "DEPOSIT":
      return "Kapora";
    case "BALANCE":
      return "Kalan Odeme";
    default:
      return type;
  }
}

export function getPaymentDisplayStatus(
  payment: Pick<DemoPaymentRecord, "status" | "dueDate">,
  referenceDate = DEMO_REFERENCE_DATE,
): DemoPaymentDisplayStatus {
  if (payment.status === "PAID" || payment.status === "CANCELLED") {
    return payment.status;
  }

  return payment.dueDate < referenceDate ? "OVERDUE" : "PENDING";
}

export function getPaymentStatusLabel(status: DemoPaymentDisplayStatus) {
  switch (status) {
    case "PENDING":
      return "Beklemede";
    case "PAID":
      return "Tahsil Edildi";
    case "CANCELLED":
      return "Iptal";
    case "OVERDUE":
      return "Vadesi Gecti";
    default:
      return status;
  }
}

export function getPaymentStatusTone(status: DemoPaymentDisplayStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "OVERDUE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getCashDirectionLabel(direction: DemoCashDirection) {
  return direction === "INCOME" ? "Gelir" : "Gider";
}

export function getCashDirectionTone(direction: DemoCashDirection) {
  return direction === "INCOME"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

export function buildDemoFinanceBalances(input: {
  invoices: DemoInvoiceRecord[];
  payments: DemoPaymentRecord[];
  referenceDate?: string;
}) {
  const referenceDate = input.referenceDate ?? DEMO_REFERENCE_DATE;

  return input.invoices
    .map((invoice) => {
      const relatedPayments = input.payments.filter((payment) => payment.invoiceId === invoice.id);
      const collectedAmount = relatedPayments
        .filter((payment) => payment.status === "PAID")
        .reduce((sum, payment) => sum + payment.amount, 0);
      const remainingAmount = Math.max(invoice.totalAmount - collectedAmount, 0);
      const pendingPayments = relatedPayments
        .filter((payment) => payment.status === "PENDING")
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
      const nextDuePayment = pendingPayments[0];
      const lastPaidPayment = [...relatedPayments]
        .filter((payment) => payment.paidAt)
        .sort((left, right) => (right.paidAt ?? "").localeCompare(left.paidAt ?? ""))[0];

      const paymentStatus: DemoPaymentDisplayStatus =
        remainingAmount <= 0
          ? "PAID"
          : nextDuePayment
            ? getPaymentDisplayStatus(nextDuePayment, referenceDate)
            : invoice.status === "CANCELLED"
              ? "CANCELLED"
              : "PENDING";

      return {
        requestId: invoice.requestId,
        invoiceId: invoice.id,
        villaSlug: invoice.villaSlug,
        villaTitle: invoice.villaTitle,
        guestName: invoice.guestName,
        totalAmount: invoice.totalAmount,
        collectedAmount,
        remainingAmount,
        invoiceStatus: invoice.status,
        paymentStatus,
        nextDueDate: nextDuePayment?.dueDate,
        nextDueAmount: nextDuePayment?.amount,
        lastPaidAt: lastPaidPayment?.paidAt,
      } satisfies DemoFinanceBalanceRecord;
    })
    .sort((left, right) => right.remainingAmount - left.remainingAmount);
}

export function buildDemoFinanceOverview(input: {
  invoices: DemoInvoiceRecord[];
  payments: DemoPaymentRecord[];
  cashEntries: DemoCashEntry[];
  referenceDate?: string;
}) {
  const referenceDate = input.referenceDate ?? DEMO_REFERENCE_DATE;
  const totalContracted = input.invoices
    .filter((invoice) => invoice.status !== "CANCELLED")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalCollected = input.payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalOutstanding = Math.max(totalContracted - totalCollected, 0);
  const overdueCount = input.payments.filter(
    (payment) => getPaymentDisplayStatus(payment, referenceDate) === "OVERDUE",
  ).length;
  const sentInvoiceCount = input.invoices.filter((invoice) => invoice.status === "SENT").length;
  const cashIncome = input.cashEntries
    .filter((entry) => entry.direction === "INCOME")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const cashExpense = input.cashEntries
    .filter((entry) => entry.direction === "EXPENSE")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const cashNet = cashIncome - cashExpense;

  const invoiceStatusCounts = input.invoices.reduce<Record<DemoInvoiceStatus, number>>(
    (counts, invoice) => {
      counts[invoice.status] += 1;
      return counts;
    },
    {
      DRAFT: 0,
      SENT: 0,
      PAID: 0,
      CANCELLED: 0,
    },
  );

  const paymentStatusCounts = input.payments.reduce<Record<DemoPaymentDisplayStatus, number>>(
    (counts, payment) => {
      counts[getPaymentDisplayStatus(payment, referenceDate)] += 1;
      return counts;
    },
    {
      PENDING: 0,
      PAID: 0,
      CANCELLED: 0,
      OVERDUE: 0,
    },
  );

  const alerts: DemoFinanceAlert[] = [];

  if (overdueCount > 0) {
    alerts.push({
      title: "Vadesi gecen tahsilatlar var",
      detail: `${overdueCount} odeme kalemi icin ekip tarafinda yeniden iletisim kurulmasi gerekiyor.`,
      tone: "warning",
    });
  }

  if (sentInvoiceCount > 0) {
    alerts.push({
      title: "Takip bekleyen faturalar acikta",
      detail: `${sentInvoiceCount} fatura gonderilmis durumda; kalan odemeler kasa akisina henuz yansimadi.`,
      tone: "neutral",
    });
  }

  if (cashNet > 0) {
    alerts.push({
      title: "Kasa akisi pozitif gidiyor",
      detail: `Net nakit dengesi ${formatCurrency(cashNet)} seviyesinde gorunuyor.`,
      tone: "success",
    });
  }

  return {
    summaryCards: [
      {
        label: "Kontrat toplami",
        value: formatCurrency(totalContracted),
        detail: "Onayli rezervasyonlardan uretilen toplam fatura hacmi.",
      },
      {
        label: "Tahsil edilen",
        value: formatCurrency(totalCollected),
        detail: "Odeme ekranindan tahsil edildi durumuna cekilen kalemler.",
      },
      {
        label: "Acik bakiye",
        value: formatCurrency(totalOutstanding),
        detail: "Heniz kapatilmamis rezervasyon gelir bakiyesi.",
      },
      {
        label: "Net kasa",
        value: formatCurrency(cashNet),
        detail: "Gelir ve gider hareketlerinin toplam etkisi.",
      },
    ],
    invoiceStatusCounts,
    paymentStatusCounts,
    recentInvoices: [...input.invoices]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5),
    recentPayments: [...input.payments]
      .sort((left, right) => {
        if (left.dueDate === right.dueDate) {
          return right.createdAt.localeCompare(left.createdAt);
        }

        return right.dueDate.localeCompare(left.dueDate);
      })
      .slice(0, 6)
      .map((payment) => ({
        ...payment,
        displayStatus: getPaymentDisplayStatus(payment, referenceDate),
      })),
    alerts,
    cashNet,
    totalCollected,
    totalOutstanding,
    totalContracted,
  } satisfies DemoFinanceOverview;
}
