"use server";

import { redirect } from "next/navigation";
import { getPanelHomePath } from "@/lib/auth/panel-access";
import { clearUserSession, setUserSession } from "@/lib/auth/server-session";
import { validateUser } from "@/lib/auth/users";

export type LoginFormState = {
  error?: string;
};

export async function authenticateUser(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Kullanici adi ve sifre alanlari zorunludur." };
  }

  const user = validateUser(username, password);

  if (!user) {
    return { error: "Kullanici adi veya sifre hatali." };
  }

  await setUserSession(user);
  redirect(getPanelHomePath(user.role));
}

export async function signOutUser() {
  await clearUserSession();
  redirect("/panel/giris");
}
