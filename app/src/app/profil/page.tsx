"use client";

import { Profile } from "@/components/Profile";
import { useLang } from "@/lib/i18n";

export default function ProfilPage() {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <h1 className="pt-2 text-2xl font-bold">{t.profile}</h1>
      <Profile />
    </div>
  );
}
