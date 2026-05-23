import "server-only";

import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DemoRequest } from "@/lib/demo-operations";
import {
  DEMO_REFERENCE_DATE,
  type RequestStatus,
} from "@/lib/demo-operations";
import {
  buildDemoFinanceBalances,
  buildDemoFinanceOverview,
  type DemoCashDirection,
  type DemoCashEntry,
  type DemoFinanceOverview,
  type DemoInvoiceRecord,
  type DemoInvoiceStatus,
  type DemoPaymentRecord,
  type DemoPaymentStatus,
} from "@/lib/demo-finance";
import { getDemoRequests } from "@/lib/server/demo-operations-store";

const demoDataDirectory = path.join(process.cwd(), "data");
const invoiceFilePath = path.join(demoDataDirectory, "demo-invoices.json");
const paymentFilePath = path.join(demoDataDirectory, "demo-payments.json");
const cashbookFilePath = path.join(demoDataDirectory, "demo-cashbook.json");

export class DemoFinanceStoreError extends Error {}

type DemoFinanceBundle = {
  invoices: DemoInvoiceRecord[];
  payments: DemoPaymentRecord[];
  cashEntries: DemoCashEntry[];
};

async function ensureJsonFile<T>(filePath: string, seedData: T) {
  await mkdir(demoDataDirectory, { recursive: true });

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(seedData, null, 2), "utf8");
  }
}

async function readJsonFile<T>(filePath: string, seedData: T): Promise<T> {
  await ensureJsonFile(filePath, seedData);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(filePath: string, value: T) {
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

function formatDateKey(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toISOString().slice(0, 10);
}

function addDays(input: string | Date, days: number) {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKey(date);
}

function addDaysIso(input: string | Date, days: number) {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function subtractDays(input: string | Date, days: number) {
  return addDays(input, -days);
}

function getInvoiceId(requestId: string) {
  return `invoice-${requestId}`;
}

function getInvoiceNumber(request: DemoRequest) {
  return `F-${request.createdAt.slice(0, 10).replace(/-/g, "")}-${request.id.slice(-3).toUpperCase()}`;
}

function getDepositPaymentId(requestId: string) {
  return `payment-${requestId}-deposit`;
}

function getBalancePaymentId(requestId: string) {
  return `payment-${requestId}-balance`;
}

function getAutoCashEntryId(paymentId: string) {
  return `cash-${paymentId}`;
}

function getApprovedRequests(requests: DemoRequest[]) {
  return requests.filter((request) => request.status === "APPROVED");
}

function buildAutoInvoice(request: DemoRequest): DemoInvoiceRecord {
  const issueDate = formatDateKey(request.createdAt);
  const dueDate = subtractDays(request.checkIn, 14);

  return {
    id: getInvoiceId(request.id),
    requestId: request.id,
    villaSlug: request.villaSlug,
    villaTitle: request.villaTitle,
    guestName: request.fullName,
    invoiceNumber: getInvoiceNumber(request),
    issueDate,
    dueDate,
    totalAmount: request.pricing.grandTotal,
    status: "SENT",
    source: "AUTO_APPROVAL",
    createdAt: request.createdAt,
    updatedAt: request.createdAt,
  };
}

function buildAutoPayments(request: DemoRequest, invoiceId: string): DemoPaymentRecord[] {
  const createdAt = request.createdAt;
  const depositAmount = Math.round(request.pricing.grandTotal * 0.35);
  const balanceAmount = request.pricing.grandTotal - depositAmount;

  return [
    {
      id: getDepositPaymentId(request.id),
      invoiceId,
      requestId: request.id,
      villaSlug: request.villaSlug,
      villaTitle: request.villaTitle,
      guestName: request.fullName,
      type: "DEPOSIT",
      title: "Kapora tahsilati",
      amount: depositAmount,
      dueDate: addDays(createdAt, 2),
      status: "PAID",
      method: "Banka Havalesi",
      source: "AUTO_APPROVAL",
      paidAt: addDaysIso(createdAt, 3),
      createdAt,
      updatedAt: addDaysIso(createdAt, 3),
    },
    {
      id: getBalancePaymentId(request.id),
      invoiceId,
      requestId: request.id,
      villaSlug: request.villaSlug,
      villaTitle: request.villaTitle,
      guestName: request.fullName,
      type: "BALANCE",
      title: "Kalan odeme tahsilati",
      amount: balanceAmount,
      dueDate: subtractDays(request.checkIn, 14),
      status: "PENDING",
      method: "Kredi Karti Linki",
      source: "AUTO_APPROVAL",
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function buildAutoCashEntry(payment: DemoPaymentRecord): DemoCashEntry {
  return {
    id: getAutoCashEntryId(payment.id),
    requestId: payment.requestId,
    invoiceId: payment.invoiceId,
    paymentId: payment.id,
    villaSlug: payment.villaSlug,
    villaTitle: payment.villaTitle,
    guestName: payment.guestName,
    direction: "INCOME",
    category: "Rezervasyon Tahsilati",
    title: payment.title,
    amount: payment.amount,
    date: payment.paidAt?.slice(0, 10) ?? DEMO_REFERENCE_DATE,
    source: "AUTO_PAYMENT",
    note: `${payment.villaTitle} icin otomatik muhasebe kaydi`,
    createdAt: payment.paidAt ?? new Date().toISOString(),
  };
}

function syncAutoCashEntries(bundle: DemoFinanceBundle) {
  let changed = false;
  const manualEntries = bundle.cashEntries.filter((entry) => entry.source === "MANUAL");
  const nextAutoEntries: DemoCashEntry[] = [];

  for (const payment of bundle.payments) {
    const cashId = getAutoCashEntryId(payment.id);
    const existingEntry = bundle.cashEntries.find((entry) => entry.id === cashId);

    if (payment.status === "PAID") {
      const nextEntry = buildAutoCashEntry(payment);
      nextAutoEntries.push(nextEntry);

      if (
        !existingEntry ||
        existingEntry.amount !== nextEntry.amount ||
        existingEntry.date !== nextEntry.date
      ) {
        changed = true;
      }
      continue;
    }

    if (existingEntry) {
      changed = true;
    }
  }

  const nextCashEntries = [...manualEntries, ...nextAutoEntries];

  if (nextCashEntries.length !== bundle.cashEntries.length) {
    changed = true;
  }

  return {
    changed,
    cashEntries: nextCashEntries,
  };
}

function syncInvoiceStatusFromPayments(bundle: DemoFinanceBundle, invoiceId: string) {
  const invoiceIndex = bundle.invoices.findIndex((invoice) => invoice.id === invoiceId);

  if (invoiceIndex === -1) {
    return false;
  }

  const invoice = bundle.invoices[invoiceIndex];
  const relatedPayments = bundle.payments.filter((payment) => payment.invoiceId === invoiceId);

  if (relatedPayments.length === 0) {
    return false;
  }

  let nextStatus: DemoInvoiceStatus = invoice.status;

  if (relatedPayments.every((payment) => payment.status === "CANCELLED")) {
    nextStatus = "CANCELLED";
  } else if (
    relatedPayments
      .filter((payment) => payment.status !== "CANCELLED")
      .every((payment) => payment.status === "PAID")
  ) {
    nextStatus = "PAID";
  } else if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    nextStatus = "SENT";
  }

  if (nextStatus === invoice.status) {
    return false;
  }

  bundle.invoices[invoiceIndex] = {
    ...invoice,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  return true;
}

async function readFinanceBundle() {
  const [invoices, payments, cashEntries] = await Promise.all([
    readJsonFile(invoiceFilePath, [] as DemoInvoiceRecord[]),
    readJsonFile(paymentFilePath, [] as DemoPaymentRecord[]),
    readJsonFile(cashbookFilePath, [] as DemoCashEntry[]),
  ]);

  return {
    invoices,
    payments,
    cashEntries,
  } satisfies DemoFinanceBundle;
}

async function writeFinanceBundle(bundle: DemoFinanceBundle) {
  await Promise.all([
    writeJsonFile(invoiceFilePath, bundle.invoices),
    writeJsonFile(paymentFilePath, bundle.payments),
    writeJsonFile(cashbookFilePath, bundle.cashEntries),
  ]);
}

async function syncFinanceBundle() {
  const requests = await getDemoRequests();
  const approvedRequests = getApprovedRequests(requests);
  const approvedIds = new Set(approvedRequests.map((request) => request.id));
  const bundle = await readFinanceBundle();
  let changed = false;

  const invoiceCount = bundle.invoices.length;
  const paymentCount = bundle.payments.length;
  const cashCount = bundle.cashEntries.length;
  bundle.invoices = bundle.invoices.filter((invoice) => approvedIds.has(invoice.requestId));
  bundle.payments = bundle.payments.filter((payment) => approvedIds.has(payment.requestId));
  bundle.cashEntries = bundle.cashEntries.filter(
    (entry) =>
      entry.source === "MANUAL" || (entry.requestId ? approvedIds.has(entry.requestId) : true),
  );
  changed =
    changed ||
    invoiceCount !== bundle.invoices.length ||
    paymentCount !== bundle.payments.length ||
    cashCount !== bundle.cashEntries.length;

  for (const request of approvedRequests) {
    let invoice = bundle.invoices.find((record) => record.requestId === request.id);

    if (!invoice) {
      invoice = buildAutoInvoice(request);
      bundle.invoices.push(invoice);
      changed = true;
    }

    const expectedPayments = buildAutoPayments(request, invoice.id);

    for (const expectedPayment of expectedPayments) {
      const existingPayment = bundle.payments.find((payment) => payment.id === expectedPayment.id);

      if (!existingPayment) {
        bundle.payments.push(expectedPayment);
        changed = true;
      }
    }
  }

  const invoiceIds = bundle.invoices.map((invoice) => invoice.id);
  for (const invoiceId of invoiceIds) {
    if (syncInvoiceStatusFromPayments(bundle, invoiceId)) {
      changed = true;
    }
  }

  const cashSync = syncAutoCashEntries(bundle);
  bundle.cashEntries = cashSync.cashEntries;
  changed = changed || cashSync.changed;

  bundle.invoices.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  bundle.payments.sort((left, right) => {
    if (left.dueDate === right.dueDate) {
      return right.createdAt.localeCompare(left.createdAt);
    }

    return left.dueDate.localeCompare(right.dueDate);
  });
  bundle.cashEntries.sort((left, right) => {
    if (left.date === right.date) {
      return right.createdAt.localeCompare(left.createdAt);
    }

    return right.date.localeCompare(left.date);
  });

  if (changed) {
    await writeFinanceBundle(bundle);
  }

  return bundle;
}

export async function getDemoInvoices() {
  const bundle = await syncFinanceBundle();
  return bundle.invoices;
}

export async function getDemoPayments() {
  const bundle = await syncFinanceBundle();
  return bundle.payments;
}

export async function getDemoCashEntries() {
  const bundle = await syncFinanceBundle();
  return bundle.cashEntries;
}

export async function getDemoFinanceBalances() {
  const bundle = await syncFinanceBundle();
  return buildDemoFinanceBalances({
    invoices: bundle.invoices,
    payments: bundle.payments,
  });
}

export async function getDemoFinanceOverview(): Promise<DemoFinanceOverview> {
  const bundle = await syncFinanceBundle();
  return buildDemoFinanceOverview(bundle);
}

export async function updateDemoInvoiceStatus(invoiceId: string, status: DemoInvoiceStatus) {
  const bundle = await syncFinanceBundle();
  const invoiceIndex = bundle.invoices.findIndex((invoice) => invoice.id === invoiceId);

  if (invoiceIndex === -1) {
    throw new DemoFinanceStoreError("Fatura bulunamadi.");
  }

  const now = new Date().toISOString();
  bundle.invoices[invoiceIndex] = {
    ...bundle.invoices[invoiceIndex],
    status,
    updatedAt: now,
  };

  if (status === "PAID") {
    bundle.payments = bundle.payments.map((payment) =>
      payment.invoiceId === invoiceId && payment.status !== "CANCELLED"
        ? {
            ...payment,
            status: "PAID",
            paidAt: payment.paidAt ?? now,
            updatedAt: now,
          }
        : payment,
    );
  }

  if (status === "CANCELLED") {
    bundle.payments = bundle.payments.map((payment) =>
      payment.invoiceId === invoiceId
        ? {
            ...payment,
            status: "CANCELLED",
            paidAt: undefined,
            updatedAt: now,
          }
        : payment,
    );
  }

  if (status !== "CANCELLED") {
    bundle.payments = bundle.payments.map((payment) =>
      payment.invoiceId === invoiceId && payment.status === "CANCELLED"
        ? {
            ...payment,
            status: "PENDING",
            paidAt: undefined,
            updatedAt: now,
          }
        : payment,
    );
  }

  const cashSync = syncAutoCashEntries(bundle);
  bundle.cashEntries = cashSync.cashEntries;
  await writeFinanceBundle(bundle);

  return bundle.invoices[invoiceIndex];
}

export async function updateDemoPaymentStatus(paymentId: string, status: DemoPaymentStatus) {
  const bundle = await syncFinanceBundle();
  const paymentIndex = bundle.payments.findIndex((payment) => payment.id === paymentId);

  if (paymentIndex === -1) {
    throw new DemoFinanceStoreError("Odeme kaydi bulunamadi.");
  }

  const now = new Date().toISOString();
  const current = bundle.payments[paymentIndex];

  bundle.payments[paymentIndex] = {
    ...current,
    status,
    paidAt: status === "PAID" ? current.paidAt ?? now : undefined,
    updatedAt: now,
  };

  syncInvoiceStatusFromPayments(bundle, current.invoiceId);
  const cashSync = syncAutoCashEntries(bundle);
  bundle.cashEntries = cashSync.cashEntries;
  await writeFinanceBundle(bundle);

  return bundle.payments[paymentIndex];
}

export async function createManualCashEntry(input: {
  direction: DemoCashDirection;
  category: string;
  title: string;
  amount: number;
  date: string;
  note?: string;
}) {
  if (!input.category.trim()) {
    throw new DemoFinanceStoreError("Kategori zorunludur.");
  }

  if (!input.title.trim()) {
    throw new DemoFinanceStoreError("Baslik zorunludur.");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new DemoFinanceStoreError("Tutar sifirdan buyuk olmalidir.");
  }

  if (!input.date) {
    throw new DemoFinanceStoreError("Tarih zorunludur.");
  }

  const bundle = await syncFinanceBundle();
  const entry: DemoCashEntry = {
    id: `cash-manual-${randomUUID().slice(0, 8)}`,
    direction: input.direction,
    category: input.category.trim(),
    title: input.title.trim(),
    amount: Math.round(input.amount),
    date: input.date,
    source: "MANUAL",
    note: input.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  bundle.cashEntries.unshift(entry);
  await writeFinanceBundle(bundle);

  return entry;
}

export async function deleteManualCashEntry(entryId: string) {
  const bundle = await syncFinanceBundle();
  const entry = bundle.cashEntries.find((item) => item.id === entryId);

  if (!entry) {
    throw new DemoFinanceStoreError("Kasa kaydi bulunamadi.");
  }

  if (entry.source !== "MANUAL") {
    throw new DemoFinanceStoreError("Otomatik uretildigi icin bu kayit silinemez.");
  }

  bundle.cashEntries = bundle.cashEntries.filter((item) => item.id !== entryId);
  await writeFinanceBundle(bundle);
}

export function getDemoFinanceStatusOptions() {
  return {
    invoiceStatuses: ["DRAFT", "SENT", "PAID", "CANCELLED"] as DemoInvoiceStatus[],
    paymentStatuses: ["PENDING", "PAID", "CANCELLED"] as DemoPaymentStatus[],
    requestStatuses: ["NEW", "CONTACTED", "QUOTE_SENT", "APPROVED", "CANCELLED"] as RequestStatus[],
  };
}
