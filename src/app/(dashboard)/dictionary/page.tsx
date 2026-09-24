import { DictionarySearch } from "@/components/dictionary/dictionary-search";

export const dynamic = "force-dynamic";

interface DictionaryPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function DictionaryPage({ searchParams }: DictionaryPageProps) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tra từ điển</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tìm kiếm tức thì tiếng Anh – Việt, tiếng Trung – Việt. Lưu từ vào thư viện để học.
        </p>
      </div>
      <DictionarySearch initialQuery={params.q} />
    </div>
  );
}