import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateDemoExperience(villaSlug?: string) {
  revalidatePath("/");
  revalidatePath("/villalar");
  revalidatePath("/talep");
  revalidatePath("/panel");
  revalidatePath("/panel/is-merkezi");
  revalidatePath("/panel/satis-takibi");
  revalidatePath("/panel/takvim");
  revalidatePath("/panel/villa-sahibi");
  revalidatePath("/panel/talepler");
  revalidatePath("/panel/talepler/[id]", "page");
  revalidatePath("/panel/fiyatlar");
  revalidatePath("/panel/indirimler");
  revalidatePath("/panel/kuponlar");
  revalidatePath("/panel/raporlar");
  revalidatePath("/panel/villalar");

  if (villaSlug) {
    revalidatePath(`/panel/villalar/${villaSlug}/duzenle`);
    revalidatePath(`/villalar/${villaSlug}`);
    revalidatePath(`/panel/villalar/${villaSlug}/uygunluk`);
  }
}
