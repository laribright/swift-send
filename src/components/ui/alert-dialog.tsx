"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(
  null
);

function useAlertDialog() {
  const ctx = React.useContext(AlertDialogContext);
  if (!ctx) throw new Error("AlertDialog components must be used within AlertDialog.Root");
  return ctx;
}

function AlertDialogRoot({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

function AlertDialogTrigger({
  children,
  asChild,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const { setOpen } = useAlertDialog();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }
  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen } = useAlertDialog();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, setOpen]);

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          "relative z-50 grid w-full max-w-lg gap-4 rounded-xl border bg-background p-6 shadow-lg",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-lg font-semibold", className)} {...props} />;
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogCancel(props: React.ComponentProps<typeof Button>) {
  const { setOpen } = useAlertDialog();
  return <Button type="button" variant="outline" onClick={() => setOpen(false)} {...props} />;
}

function AlertDialogAction(props: React.ComponentProps<typeof Button>) {
  const { setOpen } = useAlertDialog();
  return (
    <Button
      type="button"
      onClick={() => setOpen(false)}
      {...props}
    />
  );
}

export {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};
