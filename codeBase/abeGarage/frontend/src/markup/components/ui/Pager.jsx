import { LuChevronLeft, LuChevronRight, LuChevronsLeft, LuChevronsRight } from "react-icons/lu";

// Pagination for the server-paged lists (orders, customers, employees).
export default function Pager({ currentPage, totalPages, setCurrentPage }) {
  const total = Math.max(totalPages || 1, 1);
  const atStart = currentPage <= 1;
  const atEnd = currentPage >= total;
  return (
    <nav className="gh-pager" aria-label="Pagination">
      <div className="gh-pager-buttons">
        <button type="button" className="gh-icon-btn" disabled={atStart} onClick={() => setCurrentPage(1)} aria-label="First">
          <LuChevronsLeft />
        </button>
        <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1" disabled={atStart} onClick={() => setCurrentPage(currentPage - 1)}>
          <LuChevronLeft aria-hidden="true" /> Previous
        </button>
      </div>
      <span className="gh-pager-label">
        Page {currentPage} of {total}
      </span>
      <div className="gh-pager-buttons">
        <button type="button" className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1" disabled={atEnd} onClick={() => setCurrentPage(currentPage + 1)}>
          Next <LuChevronRight aria-hidden="true" />
        </button>
        <button type="button" className="gh-icon-btn" disabled={atEnd} onClick={() => setCurrentPage(total)} aria-label="Last">
          <LuChevronsRight />
        </button>
      </div>
    </nav>
  );
}
