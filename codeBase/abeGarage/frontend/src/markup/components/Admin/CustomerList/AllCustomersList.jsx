import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Table, Button } from "react-bootstrap";
import MoreCustomers from '../../../pages/MoreCustomers'
import { FaRegEdit, FaExternalLinkAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import customerService from "../../../../services/customer.service";
import { PulseLoader } from "react-spinners";

const PAGE_SIZE = 10;

function AllCustomersList() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // search text after a short pause
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCustomers, setCurrentCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  // the full-page spinner only shows before the first result; later
  // searches keep the search box mounted (and focused)
  const [loaded, setLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);

  // wait until typing pauses, then search from page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
          setApiError(true);
          setApiErrorMessage(res.status === 403 ? "You are not authorized to view this page" : "Please try again later");
          return;
        }
        setCurrentCustomers(body.data);
        setTotalPages(body.pagination.total_pages);
        setLoaded(true);
      })
      .catch((err) => console.error(err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [currentPage, query]);

  return (
    <>
      {loading && !loaded ? (
        <div className="center_loader">
          <PulseLoader size={10} color={"#123abc"} />
        </div>
      ) : (
        <>
          {apiError ? (
            <section className="contact-section">
              <div className="auto-container">
                <div className="contact-title">
                  <h2>{apiErrorMessage}</h2>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="contact-section">
                <div className="auto-container">
                  <div className="contact-title">
                    <h2>Customers</h2>
                  </div>
                  {/* Search input */}
                  <div className="table-responsive mb-4">
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search by name, email, or phone number"
                      aria-label="Search"
                      aria-describedby="basic-addon2"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  {/* Customers table */}
                  <Table striped bordered hover className="table-responsive">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Added Date</th>
                        <th>Active</th>
                        <th>Edit/View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCustomers.length > 0 ? (
                        currentCustomers.map((customer) => (
                          <tr key={customer.customer_id}>
                            <td>{customer.customer_id}</td>
                            <td>{customer.customer_first_name}</td>
                            <td>{customer.customer_last_name}</td>
                            <td>{customer.customer_email}</td>
                            <td>{customer.customer_phone_number}</td>
                            <td>
                              {format(
                                new Date(customer.customer_added_date),
                                "MM - dd - yyyy | kk:mm"
                              )}
                            </td>
                            <td>
                              {customer.active_customer_status ? (
                                <p className="text-success">Yes</p>
                              ) : (
                                <p className="text-danger">No</p>
                              )}
                            </td>
                            <td>
                              <div className="edit-link-icons">
                                <span className="text-danger">
                                  <Link 
                                    to={`/admin/customer_edit/${customer.customer_id}`}
                                  >
                                    <FaRegEdit className="text-danger" />
                                  </Link>
                                </span>
                                <Link 
                                  to={`/admin/customer_profile/${customer.customer_id}`}
                                >
                                  <span className="text-primary">
                                    <FaExternalLinkAlt />
                                  </span>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">
                            <h1 className="text-center mt-4">
                              No Result Found!
                            </h1>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
                {/* Pagination */}
                <MoreCustomers
                  currentPage={currentPage}
                  totalPages={totalPages}
                  setCurrentPage={setCurrentPage}
                />
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}

export default AllCustomersList;
