import "server-only";
import { writePanelAudit } from "@/lib/server/panel-audit";

import { randomUUID } from "node:crypto";
import type { DemoRequest, RequestStatus } from "@/lib/demo-operations";
import type { DemoInvoiceStatus, DemoPaymentStatus, DemoPaymentRecord } from "@/lib/demo-finance";
import { buildOperationTasksForApprovedRequest } from "@/lib/demo-operations-workflow";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { writeDevelopmentDataFile } from "@/lib/server/development-fallback";
import {
  getFallbackInvoices, getFallbackPayments, getFallbackRequests, getFallbackVillas,
  getFallbackOperationTasks, saveFallbackRequest, saveFallbackVilla,
} from "@/lib/server/development-fallback-data";
import { BookingWorkflowError } from "@/lib/server/booking-workflow";

let mutationQueue: Promise<unknown> = Promise.resolve();
export function withFallbackBookingMutation<T>(work: () => Promise<T>): Promise<T> {
  const pending = mutationQueue.then(work, work);
  mutationQueue = pending.catch(() => {});
  return pending;
}

export async function transitionFallbackBooking(request: DemoRequest, status: RequestStatus) {
  await assertPanelCompanyAccess(request.companyId);
  request = (await getFallbackRequests(request.companyId)).find((item) => item.id === request.id) ?? request;
  const villa = (await getFallbackVillas(request.companyId)).find((item) => item.slug === request.villaSlug);
  if (!villa) throw new BookingWorkflowError("Villa bulunamadi.");
  const ranges = villa.availabilityRanges.filter((item) => item.sourceRequestId !== request.id);
  const endDate = request.checkOut;
  if (status === "APPROVED" && ranges.some((item) => request.checkIn < item.endDate && endDate > item.startDate)) {
    throw new BookingWorkflowError("Secilen tarihler dolu. Rezervasyon onaylanamadi.");
  }
  const invoices = await getFallbackInvoices();
  const payments = await getFallbackPayments();
  const allTasks = await getFallbackOperationTasks();
  const tasks = allTasks.filter((task) => task.requestId !== request.id);
  const now = new Date().toISOString();
  if (status === "APPROVED") {
    ranges.push({ id: `reservation-${request.id}`, startDate: request.checkIn, endDate,
      label: `Rezervasyon: ${request.fullName}`, status: "RESERVED", sourceRequestId: request.id });
    tasks.push(...buildOperationTasksForApprovedRequest(request).map((task) => allTasks.find((existing) => existing.id === task.id) ?? ({ ...task, status: "PENDING" as const,
      scheduledTimeLabel: task.taskType === "CHECK_IN" ? villa.checkInTime ?? "16:00"
        : task.taskType === "CHECK_OUT" ? villa.checkOutTime ?? "10:00" : task.scheduledTimeLabel,
    })));
    if (!invoices.some((item) => item.requestId === request.id)) {
      const invoice = {
        id: `invoice-${request.id}`, companyId: request.companyId, requestId: request.id,
        villaSlug: villa.slug, villaTitle: villa.title, guestName: request.fullName,
        invoiceNumber: `REZ-${request.id}`, issueDate: now.slice(0, 10), dueDate: request.checkIn,
        totalAmount: request.pricing.grandTotal, status: "SENT" as const,
        source: "AUTO_APPROVAL" as const, createdAt: now, updatedAt: now,
      };
      invoices.push(invoice);
      payments.push({ ...invoice, id: `payment-${request.id}`, invoiceId: invoice.id,
        type: "BALANCE", title: "Konaklama bedeli", amount: invoice.totalAmount,
        status: "PENDING", method: "Banka havalesi" });
    }
  }
  await saveFallbackVilla({ ...villa, availabilityRanges: ranges });
  await writeDevelopmentDataFile("demo-invoices.json", invoices);
  await writeDevelopmentDataFile("demo-payments.json", payments);
  await writeDevelopmentDataFile("demo-operation-tasks.json", tasks);
  const invoice = invoices.find((item) => item.requestId === request.id);
  const paid = payments.filter((item) => item.invoiceId === invoice?.id && item.status === "PAID")
    .reduce((total, item) => total + Math.round(item.amount * 100), 0);
  const fullyPaid = invoice && invoice.status !== "CANCELLED" && invoice.totalAmount > 0
    && paid >= Math.round(invoice.totalAmount * 100);
  const updated = await saveFallbackRequest({ ...request, status,
    confirmedAt: status === "APPROVED" && fullyPaid ? request.confirmedAt ?? now : undefined,
    confirmationToken: request.confirmationToken ?? randomUUID().replaceAll("-", ""),
  });
  if (request.status !== status) await writePanelAudit({ companyId: request.companyId, entityType: "REQUEST", entityId: request.id,
    action: "STATUS_CHANGED", summary: `Talep durumu: ${request.status} → ${status}.` });
  return updated;
}

export async function updateFallbackFinance(input:
  { invoiceId: string; status: DemoInvoiceStatus } | { paymentId: string; status: DemoPaymentStatus },
) {
  const invoices = await getFallbackInvoices();
  const payments = await getFallbackPayments();
  const payment = "paymentId" in input ? payments.find((item) => item.id === input.paymentId) : undefined;
  const invoiceId = "invoiceId" in input ? input.invoiceId : payment?.invoiceId;
  const invoice = invoices.find((item) => item.id === invoiceId);
  if (!invoice) throw new BookingWorkflowError("Odeme / fatura kaydi bulunamadi.");
  await assertPanelCompanyAccess(invoice.companyId);
  const request = (await getFallbackRequests(invoice.companyId)).find((item) => item.id === invoice.requestId);
  if (input.status === "PAID" && request && request.status !== "APPROVED") {
    throw new BookingWorkflowError("Tahsilattan once talebi onaylayin ve villa tarihlerini ayirin.");
  }
  if ("paymentId" in input && invoice.status === "CANCELLED") throw new BookingWorkflowError("Iptal edilmis faturaya odeme islenemez.");
  const now = new Date().toISOString();
  if (payment) {
    payment.status = input.status as DemoPaymentStatus;
    payment.paidAt = input.status === "PAID" ? now : undefined;
    payment.updatedAt = now;
  } else {
    invoice.status = input.status as DemoInvoiceStatus;
    if (input.status === "PAID") {
      const activePayments = payments.filter((item) => item.invoiceId === invoice.id && item.status !== "CANCELLED");
      const planned = activePayments.reduce((total, item) => total + item.amount, 0);
      if (planned < invoice.totalAmount) {
        const balance: DemoPaymentRecord & { companyId: string } = {
          id: `payment-${randomUUID()}`, companyId: invoice.companyId, invoiceId: invoice.id,
          requestId: invoice.requestId, villaSlug: invoice.villaSlug, villaTitle: invoice.villaTitle,
          guestName: invoice.guestName, type: "BALANCE", title: "Kalan konaklama bedeli",
          amount: Math.round((invoice.totalAmount - planned) * 100) / 100, dueDate: invoice.dueDate,
          status: "PENDING", method: "Banka havalesi", source: "AUTO_APPROVAL", createdAt: now, updatedAt: now,
        };
        payments.push(balance); activePayments.push(balance);
      }
      activePayments.forEach((item) => { item.status = "PAID"; item.paidAt = now; });
    }
  }
  const paid = payments.filter((item) => item.invoiceId === invoice.id && item.status === "PAID")
    .reduce((total, item) => total + Math.round(item.amount * 100), 0);
  const full = invoice.totalAmount > 0 && paid >= Math.round(invoice.totalAmount * 100) && invoice.status !== "CANCELLED";
  if (invoice.status !== "CANCELLED") invoice.status = full ? "PAID" : "SENT";
  invoice.updatedAt = now;
  await writeDevelopmentDataFile("demo-invoices.json", invoices);
  await writeDevelopmentDataFile("demo-payments.json", payments);
  if (request) await saveFallbackRequest({ ...request,
    confirmedAt: full && request.status === "APPROVED" ? request.confirmedAt ?? now : undefined,
    confirmationToken: request.confirmationToken ?? randomUUID().replaceAll("-", ""),
  });
}
