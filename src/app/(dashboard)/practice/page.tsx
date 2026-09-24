import type { Metadata } from "next";
import { PracticeContainer } from "@/components/practice/practice-container";
import { requireUser } from "@/services/auth.service";

export const metadata: Metadata = {
  title: "Luyện tập · LINGUAFLOW",
};

export default async function PracticePage() {
  await requireUser();
  return <PracticeContainer />;
}