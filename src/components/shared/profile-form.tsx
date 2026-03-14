"use client";

import { useForm } from "react-hook-form";
import { createZodResolver } from "@/lib/form-resolver";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/user";
import { updateProfile } from "@/actions/user.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function ProfileForm({
  userId,
  firstName,
  lastName,
  email,
}: ProfileFormProps) {
  const { execute, isLoading } = useServerAction(updateProfile, {
    successMessage: "Profile updated",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: createZodResolver(updateProfileSchema),
    defaultValues: { firstName, lastName },
  });

  const onSubmit = (data: UpdateProfileInput) => {
    execute({ userId, firstName: data.firstName, lastName: data.lastName });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium">Personal info</h3>
        {isDirty && (
          <Badge variant="secondary" className="text-xs">
            Unsaved changes
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            {...register("firstName")}
            className={cn(errors.firstName && "border-destructive")}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            {...register("lastName")}
            className={cn(errors.lastName && "border-destructive")}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          readOnly
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed.
        </p>
      </div>

      <Button type="submit" disabled={!isDirty || isLoading}>
        Save Changes
      </Button>
    </form>
  );
}
