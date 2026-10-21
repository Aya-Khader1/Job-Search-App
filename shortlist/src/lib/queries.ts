import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { companyApi } from "./endpoints";
import type { Company } from "./types";

/** One cached request powers the company directory, job-row company names, and "my companies". */
export function useCompanies() {
  const q = useQuery({ queryKey: ["companies"], queryFn: companyApi.all, staleTime: 5 * 60_000 });
  const byId = useMemo(() => new Map<string, Company>((q.data ?? []).map((c) => [c._id, c])), [q.data]);
  return { ...q, byId };
}
