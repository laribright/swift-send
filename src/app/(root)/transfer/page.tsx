import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/user.actions";
import { TransferFlow } from "@/components/shared/transfer-flow";

export default async function TransferPage() {
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
    <TransferFlow
      senderId={user.id}
      senderEmail={currentUser.email}
      sender={{
        id: user.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        avatarUrl: currentUser.avatarUrl,
      }}
    />
  );
}
