import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getCurrentUser } from "@/services/auth.service";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");
  if (!user.onboarded) redirect("/onboarding");

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
      }}
    >
      {children}
    </DashboardShell>
  );
}