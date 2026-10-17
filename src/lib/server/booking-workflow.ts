import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { DemoRequest, RequestStatus } from "@/lib/demo-operations";
import { buildOperationTasksForApprovedRequest } from "@/lib/demo-operations-workflow";
import { mapDemoStatusToBooking } from "@/lib/server/prisma-demo-shared";

export class BookingWorkflowError extends Error {}

export async function applyBookingStatus(tx: Prisma.TransactionClient, request: DemoRequest, status: RequestStatus) {
  const initial = await tx.bookingRequest.findUniqueOrThrow({ where: { id: request.id } });
  // All availability changes for a villa share this lock to prevent overlapping approvals.
  await tx.$queryRaw`SELECT id FROM "Villa" WHERE id = ${initial.villaId} FOR UPDATE`;
  const current = await tx.bookingRequest.findUniqueOrThrow({ where: { id: request.id } });
  const nextStatus = mapDemoStatusToBooking(status);

  if (status === "APPROVED") {
    const startsAt = new Date(`${request.checkIn}T00:00:00.000Z`);
    const endsAt = new Date(`${request.checkOut}T00:00:00.000Z`);
    const conflict = await tx.villaAvailabilityBlock.findFirst({
      where: {
        villaId: current.villaId,
        startsAt: { lt: endsAt }, endsAt: { gt: startsAt },
        OR: [{ sourceRequestId: null }, { sourceRequestId: { not: request.id } }],
      },
    });
    if (conflict) throw new BookingWorkflowError("Secilen tarihler dolu. Rezervasyon onaylanamadi.");
    // Replace older approval blocks that used non-deterministic IDs.
    await tx.villaAvailabilityBlock.deleteMany({ where: {
      villaId: current.villaId, sourceRequestId: request.id, id: { not: `reservation-${request.id}` },
    } });
    await tx.villaAvailabilityBlock.upsert({
      where: { id: `reservation-${request.id}` },
      update: { startsAt, endsAt },
      create: {
        id: `reservation-${request.id}`, villaId: current.villaId,
        startsAt, endsAt, blockType: "RESERVED", sourceRequestId: request.id,
        note: `Rezervasyon: ${request.fullName}`,
      },
    });
    const villa = await tx.villa.findUniqueOrThrow({ where: { id: current.villaId } });
    await tx.operationTask.createMany({
      skipDuplicates: true,
      data: buildOperationTasksForApprovedRequest(request).map((task) => ({
        id: task.id, companyId: current.companyId, bookingRequestId: request.id,
        villaId: current.villaId, taskType: task.taskType, status: "PENDING",
        priority: task.priority, title: task.title, detail: task.detail,
        scheduledAt: new Date(`${task.scheduledDate}T12:00:00.000Z`),
        scheduledTimeLabel: task.taskType === "CHECK_IN" ? villa.checkInTime ?? "16:00"
          : task.taskType === "CHECK_OUT" ? villa.checkOutTime ?? "10:00" : task.scheduledTimeLabel,
        assigneeLabel: task.assignee, supplierName: villa.supplierName ?? task.supplierName,
        sourceLabel: task.source,
      })),
    });
    const total = current.quotedTotalAmount ?? request.pricing.grandTotal;
    await tx.invoice.upsert({
      where: { bookingRequestId: request.id }, update: {},
      create: {
        companyId: current.companyId, bookingRequestId: request.id,
        invoiceNumber: `REZ-${request.id}`, status: "SENT", issueDate: new Date(), dueDate: current.checkIn,
        subtotal: current.quotedBaseAmount ?? request.pricing.subtotal,
        discountTotal: current.quotedDiscountAmount ?? 0,
        cleaningFee: current.quotedCleaningFee ?? request.pricing.cleaningFee,
        totalAmount: total,
        payments: { create: {
          companyId: current.companyId, bookingRequestId: request.id, paymentType: "BALANCE",
          title: "Konaklama bedeli", method: "Banka havalesi", amount: total,
          dueDate: current.checkIn, status: "PENDING",
        } },
      },
    });
  } else {
    await tx.villaAvailabilityBlock.deleteMany({ where: { sourceRequestId: request.id, villaId: current.villaId } });
    await tx.operationTask.deleteMany({ where: { bookingRequestId: request.id } });
  }

  await tx.bookingRequest.update({ where: { id: request.id }, data: {
    status: nextStatus,
    confirmedAt: status === "APPROVED" ? current.confirmedAt : null,
    confirmationToken: current.confirmationToken ?? randomUUID().replaceAll("-", ""),
  } });
  if (current.status !== nextStatus) {
    await tx.bookingRequestStatusHistory.create({ data: {
      bookingRequestId: request.id, oldStatus: current.status, newStatus: nextStatus,
      note: "Panelden rezervasyon durumu guncellendi.",
    } });
  }
}

export async function syncInvoiceConfirmation(tx: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { bookingRequest: true, payments: true } });
  const paid = invoice.payments.filter((item) => item.status === "PAID")
    .reduce((total, item) => total + Math.round(item.amount.toNumber() * 100), 0);
  const total = Math.round(invoice.totalAmount.toNumber() * 100);
  const fullyPaid = total > 0 && paid >= total && invoice.status !== "CANCELLED";
  await tx.invoice.update({ where: { id: invoiceId }, data: {
    paidTotal: paid / 100,
    status: invoice.status === "CANCELLED" ? "CANCELLED"
      : fullyPaid ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : invoice.status === "DRAFT" ? "DRAFT" : "SENT",
  } });
  if (invoice.bookingRequest) {
    await tx.bookingRequest.update({ where: { id: invoice.bookingRequest.id }, data: {
      confirmedAt: fullyPaid && invoice.bookingRequest.status === "APPROVED"
        ? invoice.bookingRequest.confirmedAt ?? new Date() : null,
      confirmationToken: invoice.bookingRequest.confirmationToken ?? randomUUID().replaceAll("-", ""),
    } });
  }
}
