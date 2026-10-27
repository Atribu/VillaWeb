import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
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
import { resolvePanelCompanyId, assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { dateKey, decimalToNumber, getDefaultCompanyId } from "@/lib/server/prisma-demo-shared";
import {
  getFallbackCashEntries,
  getFallbackInvoices,
  getFallbackPayments,
} from "@/lib/server/development-fallback-data";
import { withDevelopmentFallback, writeDevelopmentDataFile } from "@/lib/server/development-fallback";
import { mutateFallbackRecord } from "@/lib/server/fallback-mutations";
import { isDateKey } from "@/lib/booking-dates";
import { BookingWorkflowError, syncInvoiceConfirmation } from "@/lib/server/booking-workflow";
import { updateFallbackFinance, withFallbackBookingMutation } from "@/lib/server/fallback-booking-workflow";

export class DemoFinanceStoreError extends Error {}


async function getScopedInvoices() {
  const companyId = await resolvePanelCompanyId();
  return db.invoice.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      bookingRequest: {
        include: {
          villa: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getScopedPayments() {
  const companyId = await resolvePanelCompanyId();
  return db.payment.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      bookingRequest: {
        include: {
          villa: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
}

async function getScopedCashEntries() {
  const companyId = await resolvePanelCompanyId();
  return db.cashLedgerEntry.findMany({
    where: companyId ? { companyId } : undefined,
    include: {
      bookingRequest: {
        include: {
          villa: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
  });
}

function mapInvoiceStatus(status: string): DemoInvoiceStatus {
  switch (status) {
    case "PAID":
      return "PAID";
    case "CANCELLED":
      return "CANCELLED";
    case "SENT":
    case "PARTIALLY_PAID":
      return "SENT";
    default:
      return "DRAFT";
  }
}

function mapPaymentStatus(status: string): DemoPaymentStatus {
  switch (status) {
    case "PAID":
      return "PAID";
    case "CANCELLED":
    case "FAILED":
    case "REFUNDED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

function mapInvoicesToDemo(
  invoices: Awaited<ReturnType<typeof getScopedInvoices>>,
): DemoInvoiceRecord[] {
  return invoices.map((invoice) => ({
    id: invoice.id,
    companyId: invoice.companyId,
    requestId: invoice.bookingRequestId ?? "",
    villaSlug: invoice.bookingRequest?.villa.slug ?? "",
    villaTitle: invoice.bookingRequest?.villa.title ?? "-",
    guestName: invoice.bookingRequest?.fullName ?? "-",
    invoiceNumber: invoice.invoiceNumber,
    issueDate: dateKey(invoice.issueDate),
    dueDate: dateKey(invoice.dueDate),
    totalAmount: decimalToNumber(invoice.totalAmount),
    status: mapInvoiceStatus(invoice.status),
    source: "AUTO_APPROVAL",
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  }));
}

function mapPaymentsToDemo(
  payments: Awaited<ReturnType<typeof getScopedPayments>>,
): DemoPaymentRecord[] {
  return payments.map((payment) => ({
    id: payment.id,
    companyId: payment.companyId,
    invoiceId: payment.invoiceId,
    requestId: payment.bookingRequestId ?? "",
    villaSlug: payment.bookingRequest?.villa.slug ?? "",
    villaTitle: payment.bookingRequest?.villa.title ?? "-",
    guestName: payment.bookingRequest?.fullName ?? "-",
    type: payment.paymentType === "BALANCE" ? "BALANCE" : "DEPOSIT",
    title: payment.title ?? payment.method,
    amount: decimalToNumber(payment.amount),
    dueDate: payment.dueDate ? dateKey(payment.dueDate) : dateKey(payment.createdAt),
    status: mapPaymentStatus(payment.status),
    method: payment.method,
    source: "AUTO_APPROVAL",
    paidAt: payment.paidAt?.toISOString(),
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  }));
}

function mapCashEntriesToDemo(
  entries: Awaited<ReturnType<typeof getScopedCashEntries>>,
): DemoCashEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    companyId: entry.companyId,
    requestId: entry.bookingRequestId ?? undefined,
    invoiceId: entry.invoiceId ?? undefined,
    paymentId: entry.paymentId ?? undefined,
    villaSlug: entry.bookingRequest?.villa.slug ?? undefined,
    villaTitle: entry.bookingRequest?.villa.title ?? undefined,
    guestName: entry.bookingRequest?.fullName ?? undefined,
    direction: entry.direction,
    category: entry.category,
    title: entry.title,
    amount: decimalToNumber(entry.amount),
    date: dateKey(entry.entryDate),
    source: entry.source === "MANUAL" ? "MANUAL" : "AUTO_PAYMENT",
    note: entry.note ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  }));
}

export async function getDemoInvoices() {
  return withDevelopmentFallback(
    async () => mapInvoicesToDemo(await getScopedInvoices()),
    async () => getFallbackInvoices(await resolvePanelCompanyId()),
  );
}

export async function getDemoPayments() {
  return withDevelopmentFallback(
    async () => mapPaymentsToDemo(await getScopedPayments()),
    async () => getFallbackPayments(await resolvePanelCompanyId()),
  );
}

export async function getDemoCashEntries() {
  return withDevelopmentFallback(
    async () => mapCashEntriesToDemo(await getScopedCashEntries()),
    async () => getFallbackCashEntries(await resolvePanelCompanyId()),
  );
}

export async function getDemoFinanceBalances() {
  const [invoices, payments] = await Promise.all([getDemoInvoices(), getDemoPayments()]);
  return buildDemoFinanceBalances({ invoices, payments });
}

export async function getDemoFinanceOverview(): Promise<DemoFinanceOverview> {
  const [invoices, payments, cashEntries] = await Promise.all([
    getDemoInvoices(),
    getDemoPayments(),
    getDemoCashEntries(),
  ]);
  return buildDemoFinanceOverview({ invoices, payments, cashEntries });
}

async function mutateFinance(input: { invoiceId: string; status: DemoInvoiceStatus } | { paymentId: string; status: DemoPaymentStatus }) {
  try {
    await withDevelopmentFallback(
      async () => {
        const payment = "paymentId" in input ? await db.payment.findUnique({ where: { id: input.paymentId } }) : null;
        const invoiceId = "invoiceId" in input ? input.invoiceId : payment?.invoiceId;
        if (!invoiceId) throw new DemoFinanceStoreError("Odeme kaydi bulunamadi.");
        const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) throw new DemoFinanceStoreError("Fatura bulunamadi.");
        await assertPanelCompanyAccess(invoice.companyId);
        await db.$transaction(async (tx) => {
          if (invoice.bookingRequestId) {
            const booking = await tx.bookingRequest.findUniqueOrThrow({ where: { id: invoice.bookingRequestId } });
            await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${booking.villaId} FOR UPDATE`;
          }
          await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${invoiceId} FOR UPDATE`;
          const current = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { bookingRequest: true, payments: true } });
          if (input.status === "PAID" && current.bookingRequest && current.bookingRequest.status !== "APPROVED") {
            throw new DemoFinanceStoreError("Tahsilattan once talebi onaylayin ve villa tarihlerini ayirin.");
          }
          if ("paymentId" in input) {
            if (current.status === "CANCELLED") throw new DemoFinanceStoreError("Iptal edilmis faturaya odeme islenemez.");
            await tx.payment.update({ where: { id: input.paymentId }, data: {
              status: input.status, paidAt: input.status === "PAID" ? new Date() : null,
            } });
          } else {
            await tx.invoice.update({ where: { id: invoiceId }, data: { status: input.status } });
            if (input.status === "PAID") {
              const planned = current.payments.filter((item) => !["CANCELLED", "REFUNDED"].includes(item.status))
                .reduce((sum, item) => sum + Math.round(item.amount.toNumber() * 100), 0);
              const missing = Math.round(current.totalAmount.toNumber() * 100) - planned;
              if (missing > 0) await tx.payment.create({ data: {
                invoiceId, companyId: current.companyId, bookingRequestId: current.bookingRequestId,
                paymentType: "BALANCE", title: "Kalan konaklama bedeli", method: "Banka havalesi",
                amount: missing / 100, dueDate: current.dueDate,
              } });
              await tx.payment.updateMany({
                where: { invoiceId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
                data: { status: "PAID", paidAt: new Date() },
              });
            }
          }
          await syncInvoiceConfirmation(tx, invoiceId);
        });
      },
      () => withFallbackBookingMutation(() => updateFallbackFinance(input)),
    );
  } catch (error) {
    if (error instanceof BookingWorkflowError) throw new DemoFinanceStoreError(error.message);
    throw error;
  }
}

export async function updateDemoInvoiceStatus(invoiceId: string, status: DemoInvoiceStatus) {
  await mutateFinance({ invoiceId, status });
  const updated = (await getDemoInvoices()).find((item) => item.id === invoiceId);
  if (!updated) throw new DemoFinanceStoreError("Guncel fatura okunamadi.");
  return updated;
}

export async function updateDemoPaymentStatus(paymentId: string, status: DemoPaymentStatus) {
  await mutateFinance({ paymentId, status });
  const updated = (await getDemoPayments()).find((item) => item.id === paymentId);
  if (!updated) throw new DemoFinanceStoreError("Guncel odeme okunamadi.");
  return updated;
}

export async function createManualCashEntry(input: {
  direction: DemoCashDirection;
  companyId?: string;
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

  if (!isDateKey(input.date)) {
    throw new DemoFinanceStoreError("Tarih zorunludur.");
  }

  const companyId =
    input.companyId ?? (await resolvePanelCompanyId()) ?? (await getDefaultCompanyId());

  if (!companyId) {
    throw new DemoFinanceStoreError("Kasa kaydi icin firma scope belirlenemedi.");
  }

  await assertPanelCompanyAccess(companyId);

  return withDevelopmentFallback<DemoCashEntry>(async () => {
  const entry = await db.cashLedgerEntry.create({
    data: {
      id: `cash-manual-${randomUUID().slice(0, 8)}`,
      companyId,
      direction: input.direction,
      category: input.category.trim(),
      title: input.title.trim(),
      note: input.note?.trim() || null,
      amount: input.amount,
      currency: "TRY",
      entryDate: new Date(`${input.date}T12:00:00.000Z`),
      source: "MANUAL",
    },
  });

  return {
    id: entry.id,
    companyId: entry.companyId,
    direction: entry.direction,
    category: entry.category,
    title: entry.title,
    amount: decimalToNumber(entry.amount),
    date: dateKey(entry.entryDate),
    source: "MANUAL",
    note: entry.note ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  } satisfies DemoCashEntry;
  }, async () => {
    const entry: DemoCashEntry = { id: `cash-manual-${randomUUID()}`, companyId, direction: input.direction,
      category: input.category.trim(), title: input.title.trim(), amount: input.amount, date: input.date,
      source: "MANUAL", note: input.note?.trim() || undefined, createdAt: new Date().toISOString() };
    await writeDevelopmentDataFile("demo-cashbook.json", [...await getFallbackCashEntries(), entry]);
    return entry;
  });
}

export async function deleteManualCashEntry(entryId: string) {
  return withDevelopmentFallback(async () => {
  const entry = await db.cashLedgerEntry.findUnique({
    where: { id: entryId },
    select: { id: true, companyId: true, source: true },
  });

  if (!entry) {
    throw new DemoFinanceStoreError("Kasa kaydi bulunamadi.");
  }

  if (entry.source !== "MANUAL") {
    throw new DemoFinanceStoreError("Otomatik uretildigi icin bu kayit silinemez.");
  }

  await assertPanelCompanyAccess(entry.companyId);
  await db.cashLedgerEntry.delete({ where: { id: entryId } });
  }, async () => {
    await mutateFallbackRecord("demo-cashbook.json", getFallbackCashEntries, entryId, (record) => {
      if (record.source !== "MANUAL") throw new DemoFinanceStoreError("Otomatik uretildigi icin bu kayit silinemez.");
      return null;
    });
  });
}

export function getDemoFinanceStatusOptions() {
  return {
    invoiceStatuses: ["DRAFT", "SENT", "PAID", "CANCELLED"] as DemoInvoiceStatus[],
    paymentStatuses: ["PENDING", "PAID", "CANCELLED"] as DemoPaymentStatus[],
    requestStatuses: ["NEW", "CONTACTED", "QUOTE_SENT", "APPROVED", "CANCELLED"] as const,
  };
}
