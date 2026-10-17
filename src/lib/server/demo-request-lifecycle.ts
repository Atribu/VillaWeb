import type { RequestStatus } from "@/lib/demo-operations";
import { db } from "@/lib/db";
import { DemoOperationsStoreError, getDemoRequestById } from "@/lib/server/demo-operations-store";
import { DemoVillaStoreError } from "@/lib/server/demo-villa-store";
import { assertPanelCompanyAccess } from "@/lib/server/demo-company-context";
import { withDevelopmentFallback } from "@/lib/server/development-fallback";
import { applyBookingStatus, BookingWorkflowError, syncInvoiceConfirmation } from "@/lib/server/booking-workflow";
import { transitionFallbackBooking, withFallbackBookingMutation } from "@/lib/server/fallback-booking-workflow";

export async function transitionDemoRequestStatus(input: {
  requestId: string;
  status: RequestStatus;
  villaSlug?: string;
}) {
  const request = await getDemoRequestById(input.requestId);
  if (!request) throw new DemoOperationsStoreError("Talep bulunamadi.");
  await assertPanelCompanyAccess(request.companyId);
  try {
    return await withDevelopmentFallback(
      async () => {
        await db.$transaction(async (tx) => {
          await applyBookingStatus(tx, request, input.status);
          const invoice = await tx.invoice.findUnique({ where: { bookingRequestId: request.id } });
          if (invoice) await syncInvoiceConfirmation(tx, invoice.id);
        });
        const updated = await getDemoRequestById(request.id);
        if (!updated) throw new DemoOperationsStoreError("Guncel talep okunamadi.");
        return updated;
      },
      () => withFallbackBookingMutation(() => transitionFallbackBooking(request, input.status)),
    );
  } catch (error) {
    if (error instanceof BookingWorkflowError) throw new DemoOperationsStoreError(error.message);
    throw error;
  }
}

export { DemoOperationsStoreError, DemoVillaStoreError };
