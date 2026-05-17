export function paginate(query: { page?: string | number; limit?: string | number }) {
  let page = Number(query.page ?? 1);
  let limit = Number(query.limit ?? 20);

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 20;

  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  } as {
    skip: number;
    take: number;
    page: number;
    limit: number;
  };
}