"use server";

import { redirect } from "next/navigation";
import { getPanelHomePath } from "@/lib/auth/panel-access";
import { clearUserSession, setUserSession } from "@/lib/auth/server-session";
import { validateUser } from "@/lib/auth/users";
import { pickLocalized } from "@/lib/i18n";
import { getCurrentLocale } from "@/lib/server/app-locale";

export type LoginFormState = {
  error?: string;
  companyName?: string;
  username?: string;
};

export async function authenticateUser(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const locale = await getCurrentLocale();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return {
      error: pickLocalized(
        locale,
        "E-posta veya kullanici adi ile sifre alanlari zorunludur.",
        "Email or username and password are required.",
      ),
      companyName,
      username,
    };
  }

  const result = await validateUser(username, password, companyName);

  if (!result.ok) {
    const error =
      result.reason === "COMPANY_REQUIRED"
        ? pickLocalized(
            locale,
            "Firma adi zorunludur. Super admin girisi disinda bu alan bos birakilamaz.",
            "Company name is required unless you are signing in as super admin.",
          )
        : result.reason === "COMPANY_NOT_FOUND"
          ? pickLocalized(
              locale,
              "Yazdigin firma bulunamadi. Firma adini veya slug bilgisini kontrol et.",
              "The company could not be found. Check the company name or slug.",
            )
          : result.reason === "COMPANY_ACCESS_DENIED"
            ? pickLocalized(
                locale,
                "Bu kullanici secilen firmaya ait degil. Dogru firma adiyla tekrar deneyin.",
                "This user does not belong to the selected company. Try again with the correct company.",
              )
            : pickLocalized(
                locale,
                "E-posta, kullanici adi veya sifre hatali.",
                "The email, username or password is incorrect.",
              );

    return {
      error,
      companyName,
      username,
    };
  }

  await setUserSession(result.user);
  redirect(getPanelHomePath(result.user.role));
}

export async function signOutUser() {
  await clearUserSession();
  redirect("/panel/giris");
}
