import type { RequestStatus } from "@/lib/demo-operations";
import {
  DemoOperationsStoreError,
  deleteOperationTasksByRequestId,
  getDemoRequestById,
  syncOperationTasksForApprovedRequest,
  updateDemoRequestStatus,
} from "@/lib/server/demo-operations-store";
import {
  DemoVillaStoreError,
  addDemoVillaAvailability,
  deleteDemoVillaAvailabilityByRequestId,
} from "@/lib/server/demo-villa-store";

export async function transitionDemoRequestStatus(input: {
  requestId: string;
  status: RequestStatus;
  villaSlug?: string;
}) {
  const existingRequest = await getDemoRequestById(input.requestId);

  if (!existingRequest) {
    throw new DemoOperationsStoreError("Talep bulunamadi.");
  }

  const oldStatus = existingRequest.status;
  const nextStatus = input.status;
  const villaSlug = input.villaSlug ?? existingRequest.villaSlug;

  if (oldStatus === nextStatus) {
    return existingRequest;
  }

  let reservationBlocksCreated = false;
  let approvedAssetsRemoved = false;

  if (nextStatus === "APPROVED" && oldStatus !== "APPROVED") {
    await addDemoVillaAvailability({
      slug: existingRequest.villaSlug,
      startDate: existingRequest.checkIn,
      endDate: existingRequest.checkOut,
      label: `Rezervasyon: ${existingRequest.fullName}`,
      status: "RESERVED",
      sourceRequestId: existingRequest.id,
    });
    await syncOperationTasksForApprovedRequest({
      ...existingRequest,
      status: nextStatus,
    });
    reservationBlocksCreated = true;
  }

  if (oldStatus === "APPROVED" && nextStatus !== "APPROVED") {
    await deleteDemoVillaAvailabilityByRequestId({
      slug: existingRequest.villaSlug,
      requestId: existingRequest.id,
    });
    await deleteOperationTasksByRequestId(existingRequest.id);
    approvedAssetsRemoved = true;
  }

  try {
    const updatedRequest = await updateDemoRequestStatus(existingRequest.id, nextStatus);
    return updatedRequest;
  } catch (error) {
    if (reservationBlocksCreated) {
      await deleteDemoVillaAvailabilityByRequestId({
        slug: villaSlug,
        requestId: existingRequest.id,
      }).catch(() => {});
      await deleteOperationTasksByRequestId(existingRequest.id).catch(() => {});
    }

    if (approvedAssetsRemoved) {
      await addDemoVillaAvailability({
        slug: existingRequest.villaSlug,
        startDate: existingRequest.checkIn,
        endDate: existingRequest.checkOut,
        label: `Rezervasyon: ${existingRequest.fullName}`,
        status: "RESERVED",
        sourceRequestId: existingRequest.id,
      }).catch(() => {});
      await syncOperationTasksForApprovedRequest(existingRequest).catch(() => {});
    }

    throw error;
  }
}

export { DemoOperationsStoreError, DemoVillaStoreError };
