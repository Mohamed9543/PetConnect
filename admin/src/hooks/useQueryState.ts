import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function useQueryState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const search = searchParams.get("search") || "";

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== "page" && key !== "search") result[key] = value;
    });
    return result;
  }, [searchParams]);

  const setPage = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(next));
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const setSearch = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams);
      if (next) params.set("search", next);
      else params.delete("search");
      params.set("page", "1");
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set(key, value);
      else params.delete(key);
      params.set("page", "1");
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  return { page, search, filters, setPage, setSearch, setFilter };
}
