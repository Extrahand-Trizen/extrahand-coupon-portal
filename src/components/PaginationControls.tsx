import { useEffect } from 'react';

type Props = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

const PAGE_SIZES = [10, 25, 50];

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  useEffect(() => {
    if (safePage !== page) {
      onPageChange(safePage);
    }
  }, [onPageChange, page, safePage]);

  return (
    <div className="pagination" aria-label="Pagination">
      <div className="pagination-summary">
        Showing {start}-{end} of {totalItems}
      </div>
      <div className="pagination-actions">
        {onPageSizeChange ? (
          <select
            className="mgmt-filter pagination-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        ) : null}
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </button>
        <span className="pagination-page">
          Page {safePage} of {pageCount}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
