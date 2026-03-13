import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/user.actions";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const currentUser = await getCurrentUser(user.id);

  if (!currentUser) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-svh">
      <Sidebar user={currentUser} />
      <div className="flex flex-1 flex-col md:pl-[280px]">
        <MobileNav user={currentUser} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
