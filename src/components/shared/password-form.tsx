"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createZodResolver } from "@/lib/form-resolver";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/user";
import { changePassword } from "@/actions/user.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  if (password.length < 6) return "weak";
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (hasNumber && hasSpecial) return "strong";
  return "medium";
}

export function PasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { execute, isLoading } = useServerAction(changePassword, {
    successMessage: "Password updated",
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: createZodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = useWatch({ control, name: "newPassword", defaultValue: "" }) ?? "";
  const strength = getPasswordStrength(newPassword);

  const onSubmit = async (data: ChangePasswordInput) => {
    const result = await execute(data);
    if (result) reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-sm font-medium">Change password</h3>

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            {...register("currentPassword")}
            className={cn(errors.currentPassword && "border-destructive")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowCurrent((s) => !s)}
            aria-label={showCurrent ? "Hide password" : "Show password"}
          >
            {showCurrent ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </Button>
        </div>
        {errors.currentPassword && (
          <p className="text-xs text-destructive">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            {...register("newPassword")}
            className={cn(errors.newPassword && "border-destructive")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowNew((s) => !s)}
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </Button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-destructive">
            {errors.newPassword.message}
          </p>
        )}
        {newPassword.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Strength:</span>
            <span
              className={cn(
                "text-xs font-medium",
                strength === "weak" && "text-destructive",
                strength === "medium" && "text-yellow-600 dark:text-yellow-500",
                strength === "strong" && "text-green-600 dark:text-green-500"
              )}
            >
              {strength === "weak" && "Weak"}
              {strength === "medium" && "Medium"}
              {strength === "strong" && "Strong"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            {...register("confirmPassword")}
            className={cn(errors.confirmPassword && "border-destructive")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowConfirm((s) => !s)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        Update Password
      </Button>
    </form>
  );
}
