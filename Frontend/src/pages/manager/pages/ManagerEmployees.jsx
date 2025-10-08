import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/ManagerEmployees.css";
import { Empty } from "antd";
import { getUsers } from "../../../service/UserService";
import { useAuth } from "../../../contexts/AuthContext";

/** ----------------- Icon ----------------- */
function Icon({ name }) {
  const paths = {
    eye: "M1 12s4.5-7 11-7 11 7 11 7-4.5 7-11 7S1 12 1 12zm11 4a4 4 0 100-8 4 4 0 000 8z",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-6-6",
    filter: "M3 5h18l-7 8v6l-4-2v-4L3 5z",
    chevL: "M15 18l-6-6 6-6",
    chevR: "M9 6l6 6-6 6",
  };
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** --------------- Filter Modal (Only Status) ---------------- */
function FilterModal({ open, onClose, initial, onApply }) {
  const [status, setStatus] = useState(initial.status || "");

  useEffect(() => {
    if (open) {
      setStatus(initial.status || "");
    }
  }, [open, initial]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">Filter</h3>

        {/* Status: lưới 2x2 */}
        <div className="modal__group">
          <div className="group__title">Status</div>
          <div className="group__grid group__grid--2">
            <label className="radio">
              <input
                type="radio"
                name="status"
                checked={status === ""}
                onChange={() => setStatus("")}
              />
              <span>All</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="status"
                checked={status === "Active"}
                onChange={() => setStatus("Active")}
              />
              <span>Active</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="status"
                checked={status === "Inactive"}
                onChange={() => setStatus("Inactive")}
              />
              <span>Inactive</span>
            </label>
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn btn--outlined" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              onApply({ status });
              onClose();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/** --------------- Main Component: AllEmployeePage ---------------- */
export default function ManagerEmployees() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // States
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [filters, setFilters] = useState({
    status: "",
  });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Paging & sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy] = useState("created_at");
  const [sortOrder] = useState("asc");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 500);
    return () => clearTimeout(timer);
  }, [q]);

  // Reset page khi search/filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filters]);

  // Load bảng (users) theo filter/sort/paging
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getUsers(
          {
            page,
            limit: pageSize,
            sortBy,
            sortOrder,
            name: debouncedQ || undefined,
            department: user?.department?.department_name || undefined, // Filter by manager's department
            status: filters.status || undefined,
          },
          token
        );
        if (abort) return;
        setUsers(Array.isArray(data.users) ? data.users : []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      } catch (e) {
        if (!abort) setErr(e.message || "Fetch failed");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [page, pageSize, sortBy, sortOrder, debouncedQ, filters, token, user]);

  // Utility: lấy initials từ tên
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render avatar
  function renderAvatar(u) {
    const url = u?.avatar;
    const name = u?.full_name || u?.name || "User";
    
    if (url && url !== "https://i.pravatar.cc/150") {
      return <img className="emp-person__avatar" src={url} alt={name} />;
    }
    
    // Default avatar or placeholder
    return (
      <div
        className="emp-person__avatar"
        style={{
          background: "#eef",
          color: "#334",
          display: "grid",
          placeItems: "center",
          fontWeight: 600,
        }}
      >
        {getInitials(name)}
      </div>
    );
  }

  // Paging
  const totalPages = Math.ceil(total / pageSize);
  const current = Math.min(page, totalPages);

  return (
    <div className="emp">
      {/* Card */}
      <section className="emp-card">
        {/* Header: search + actions */}
        <div className="emp-card__head">
          <div className="emp-search emp-search--compact">
            <span className="emp-search__icon">
              <Icon name="search" />
            </span>
            <input
              type="text"
              className="emp-search__input"
              placeholder="Search by name or phone..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="emp-card__head__actions">
            {/* Filter */}
            <button
              className="btn btn--outlined btn--sm"
              onClick={() => setShowFilterModal(true)}
            >
              <Icon name="filter" />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="emp-table-wrapper">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Mobile Number</th>
                <th>Job Title</th>
                <th>Status</th>
                <th className="emp-table__actions">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && err && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "red" }}>
                    {err}
                  </td>
                </tr>
              )}
              {!loading && !err && users.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <Empty description="No employees found" />
                  </td>
                </tr>
              )}
              {!loading &&
                !err &&
                users.map((u) => {
                  const statusClass =
                    u.status === "Active"
                      ? "badge badge--success"
                      : "badge badge--inactive";
                  return (
                    <tr key={u._id}>
                      <td>{u.employeeId || "—"}</td>
                      <td>
                        <div className="emp-person">
                          {renderAvatar(u)}
                          <span className="emp-person__name">
                            {u.full_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td>{u.phone_number || "—"}</td>
                      <td>{u.jobTitle || "—"}</td>
                      <td>
                        <span className={statusClass}>{u.status || "N/A"}</span>
                      </td>
                      <td>
                        <div className="emp-actions">
                          <button
                            title="View"
                            onClick={() => navigate(`/manager/employees/${u._id}`)}
                          >
                            <Icon name="eye" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer v2 - giống Admin */}
        <div className="emp-foot emp-foot--v2">
          <div className="emp-foot__left">
            <label>Showing</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="emp-foot__center">
            Showing {users.length ? (current - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(current * pageSize, total)} out of {total} records
          </div>

          <div className="emp-foot__right emp-foot__pager">
            <button
              className="circle"
              disabled={current === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Prev"
            >
              <Icon name="chevL" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  className={`page ${n === current ? "is-active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              );
            })}

            <button
              className="circle"
              disabled={current === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next"
            >
              <Icon name="chevR" />
            </button>
          </div>
        </div>
      </section>

      {/* Filter Modal */}
      <FilterModal
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        initial={filters}
        onApply={(f) => setFilters(f)}
      />
    </div>
  );
}
