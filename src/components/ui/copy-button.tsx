"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type CopyButtonProps = {
  text: string;
  label?: string;
  successMessage?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
};

export function CopyButton({
  text,
  label = "Copy",
  successMessage = "Copied to clipboard.",
  className,
  variant = "outline",
  size = "sm",
}: CopyButtonProps) {
  const { toast } = useToast();
  const [copying, setCopying] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (!text) return;
    setCopying(true);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older environments.
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        textarea.style.left = "-1000px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      toast({ variant: "success", title: "Copied", message: successMessage });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Copy failed.";
      toast({ variant: "destructive", title: "Copy failed", message });
    } finally {
      setCopying(false);
    }
  }, [successMessage, text, toast]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopy}
      disabled={copying || !text}
    >
      {copying ? "Copying…" : label}
    </Button>
  );
}
