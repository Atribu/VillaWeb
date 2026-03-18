import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateDemoExperience(villaSlug?: string) {
  revalidatePath("/");
  revalidatePath("/villalar");
  revalidatePath("/talep");
  revalidatePath("/panel");
  revalidatePath("/panel/talepler");
  revalidatePath("/panel/fiyatlar");
  revalidatePath("/panel/indirimler");
  revalidatePath("/panel/kuponlar");
  revalidatePath("/panel/raporlar");
  revalidatePath("/panel/villalar");

  if (villaSlug) {
    revalidatePath(`/villalar/${villaSlug}`);
    revalidatePath(`/panel/villalar/${villaSlug}/uygunluk`);
  }
}
