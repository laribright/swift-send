"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateAvatar } from "@/actions/user.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Loader2Icon } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ProfileAvatarProps {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
}

export function ProfileAvatar({
  userId,
  avatarUrl,
  fullName,
}: ProfileAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { execute, isLoading } = useServerAction(updateAvatar, {
    successMessage: "Photo updated",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setPreview(null);
    setSelectedFile(null);

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File must be 2MB or less.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("avatar", selectedFile);
    const result = await execute({ userId, formData });
    if (result?.avatarUrl) {
      setPreview(null);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayUrl = preview ?? avatarUrl;

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt={fullName} />
          ) : (
            <AvatarFallback className="text-lg">
              {getInitials(fullName)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Change Photo
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {selectedFile && preview && (
        <div className="w-full space-y-2 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                "Save Photo"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
