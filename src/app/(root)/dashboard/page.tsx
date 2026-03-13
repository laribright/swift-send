import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome, {user.email}</p>
      </div>
      <form action={signOutAction}>
        <Button variant="outline" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  );
}
