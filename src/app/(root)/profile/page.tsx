import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/actions/user.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import { ProfileForm } from "@/components/shared/profile-form";
import { PasswordForm } from "@/components/shared/password-form";
import { DeleteAccountDialog } from "@/components/shared/delete-account-dialog";

export default async function ProfilePage() {
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

  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.trim() || "User";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileAvatar
            userId={currentUser.id}
            avatarUrl={currentUser.avatarUrl}
            fullName={fullName}
          />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Personal info</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={currentUser.id}
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
            email={currentUser.email}
          />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog userId={currentUser.id} />
        </CardContent>
      </Card>
    </div>
  );
}
