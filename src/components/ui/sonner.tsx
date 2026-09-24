"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast rounded-2xl border-border shadow-lg",
          title: "font-medium",
          description: "text-muted-foreground",
          actionButton: "rounded-xl bg-primary px-3 py-1 text-primary-foreground font-medium",
          cancelButton: "rounded-xl bg-secondary px-3 py-1 text-secondary-foreground font-medium",
        },
      }}
      {...props}
    />
  );
}