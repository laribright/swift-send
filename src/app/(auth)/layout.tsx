import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">SwiftSend</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send money worldwide, instantly
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
