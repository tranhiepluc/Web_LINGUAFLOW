"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { saveVocabularyAction } from "@/lib/actions";
import { toVietnameseMessage } from "@/lib/errors";

export interface SaveVocabularyButtonProps
  extends Omit<ButtonProps, "onClick" | "children" | "title"> {
  vocabularyId: string;
  word: string;
  saved?: boolean;
}

export function SaveVocabularyButton({
  vocabularyId,
  word,
  saved = false,
  size,
  variant,
  className,
  ...props
}: SaveVocabularyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

  const onClick = async () => {
    if (isSaved) {
      router.push("/vocabulary");
      return;
    }
    setLoading(true);
    try {
      const res = await saveVocabularyAction(vocabularyId);
      setIsSaved(true);
      if (res.created) toast.success(`Đã lưu "${word}" vào thư viện`);
      else toast.success(`"${word}" đã có trong thư viện`);
      router.refresh();
    } catch (error) {
      toast.error(toVietnameseMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading}
      size={size}
      variant={isSaved ? "soft" : variant}
      className={className}
      aria-label={isSaved ? `Xem thư viện (${word} đã lưu)` : `Lưu từ ${word}`}
      {...props}
    >
      {isSaved ? <BookmarkCheck /> : <Bookmark />}
      <span className="hidden sm:inline">{isSaved ? "Đã lưu" : "Lưu từ"}</span>
    </Button>
  );
}