import { useState, useCallback } from 'react';

export function usePagination(initialLimit = 20) {
  const [offset, setOffset] = useState(0);
  const [limit] = useState(initialLimit);

  const nextPage = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  const prevPage = useCallback(() => {
    setOffset((prev) => Math.max(0, prev - limit));
  }, [limit]);

  const goToPage = useCallback(
    (page: number) => {
      setOffset(Math.max(0, (page - 1) * limit));
    },
    [limit],
  );

  return { offset, limit, nextPage, prevPage, goToPage, page: Math.floor(offset / limit) + 1 };
}
