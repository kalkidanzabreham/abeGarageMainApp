import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { LuEye, LuSearch, LuSquarePen, LuUserPlus, LuUsers } from "react-icons/lu";
import customerService from "../../../../services/customer.service";
import { useAuth } from "../../../../Context/AuthContext";
import { canVisit } from "../../../../util/roles";
import PageHeader from "../../ui/PageHeader";
import Pager from "../../ui/Pager";

const PAGE_SIZE = 10;

const initials = (c) => `${c.customer_first_name?.[0] ?? ""}${c.customer_last_name?.[0] ?? ""}`.toUpperCase() || "?";

function AllCustomersList() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // search text after a short pause
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCustomers, setCurrentCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);
  const { roleId, can } = useAuth();

  // wait until typing pauses, then search from page 1. Only when the text
  // really changed: this effect also runs on mount, and resetting the page
  // there undid a "Next" click made in the first 300 ms.
  useEffect(() => {
    const next = search.trim();
    if (next === query) return;
    const timer = setTimeout(() => {
      setQuery(next);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, query]);

  // search and paging happen on the server (was: load every customer and
  // filter/slice in the browser)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    customerService
      .getCustomer({ page: currentPage, page_size: PAGE_SIZE, q: query })
      .then(async (res) => {
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setApiErrorMessage(res.status === 403 ? "You are not authorized to view customers." : "Couldn't load customers. Please try again later.");
          return;
        }
        setCurrentCustomers(body.data);
        setTotalPages(body.pagination.total_pages);
      })
      .catch((err) => console.error(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentPage, query]);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Search by name, email or phone; open a profile to see vehicles and orders."
        actions={
          canVisit(roleId, "/admin/add_customers") && (
            <Link to="/admin/add_customers" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <LuUserPlus aria-hidden="true" /> Add customer
            </Link>
          )
        }
      />

      {apiErrorMessage ? (
        <div className="gh-alert gh-alert-danger" role="alert">
          {apiErrorMessage}
        </div>
      ) : (
        <>
          <div className="gh-toolbar">
            <div className="gh-search">
              <LuSearch aria-hidden="true" />
              <input
                type="search"
                className="form-control"
                placeholder="Search by name, email, or phone number"
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="gh-table-wrap">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Added</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className={loading ? "gh-loading-rows" : ""}>
                  {currentCustomers.map((customer) => (
                    <tr key={customer.customer_id}>
                      <td className="gh-td-id">{customer.customer_id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="gh-avatar gh-avatar-sm" aria-hidden="true">
                            {initials(customer)}
                          </span>
                          <div className="min-w-0">
                            <div className="fw-semibold">
                              {customer.customer_first_name} {customer.customer_last_name}
                            </div>
                            <div className="gh-muted small">{customer.customer_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-nowrap">{customer.customer_phone_number}</td>
                      <td className="text-nowrap gh-muted">{format(new Date(customer.customer_added_date), "d MMM yyyy")}</td>
                      <td>
                        {customer.active_customer_status ? (
                          <span className="gh-pill gh-pill-green">Active</span>
                        ) : (
                          <span className="gh-pill">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="gh-row-actions">
                          <Link
                            to={`/admin/customer_profile/${customer.customer_id}`}
                            className="gh-icon-btn"
                            aria-label={`Open ${customer.customer_first_name} ${customer.customer_last_name}'s profile`}
                            title="Profile"
                          >
                            <LuEye />
                          </Link>
                          {can("customers:write") && (
                            <Link
                              to={`/admin/customer_edit/${customer.customer_id}`}
                              className="gh-icon-btn"
                              aria-label={`Edit ${customer.customer_first_name} ${customer.customer_last_name}`}
                              title="Edit"
                            >
                              <LuSquarePen />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && currentCustomers.length === 0 && (
              <div className="gh-empty">
                <LuUsers aria-hidden="true" />
                <p>{query ? `No customers match “${query}”.` : "No customers yet."}</p>
              </div>
            )}
          </div>
          <Pager currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />
        </>
      )}
    </>
  );
}

export default AllCustomersList;
