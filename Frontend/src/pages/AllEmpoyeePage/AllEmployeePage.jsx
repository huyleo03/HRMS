import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Employees.css";
import { getUsers, deleteUser as apiDeleteUser } from "../../service/UserService";
import { useAuth } from "../../contexts/AuthContext";

/** ----------------- Icon ----------------- */
function Icon({ name }) {
  const paths = {
    eye: "M1 12s4.5-7 11-7 11 7 11 7-4.5 7-11 7S1 12 1 12zm11 4a4 4 0 100-8 4 4 0 000 8z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    trash: "M6 7h12v12a1 1 0 01-1 1H7a1 1 0 01-1-1V7zm3-4h6l1 2H8l1-2z",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-6-6",
    filter: "M3 5h18l-7 8v6l-4-2v-4L3 5z",
    plus: "M12 5v14M5 12h14",
    chevL: "M15 18l-6-6 6-6",
    chevR: "M9 6l6 6-6 6",
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

/** --------------- Filter Modal (RADIO cho tất cả) ---------------- */
function FilterModal({ open, onClose, initial, allDepartments, onApply }) {
  const [dept, setDept]     = useState(initial.department || "");
  const [status, setStatus] = useState(initial.status || "");
  const [role, setRole]     = useState(initial.role || "");

  useEffect(() => {
    if (open) {
      setDept(initial.department || "");
      setStatus(initial.status || "");
      setRole(initial.role || "");
    }
  }, [open, initial]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">Filter</h3>

        {/* Department (giữ như cũ: trải ngang, có All) */}
        <div className="modal__group">
          <div className="group__title">Department</div>
          <div className="group__row group__row--wrap">
            <label className="radio">
              <input
                type="radio"
                name="dept"
                checked={dept === ""}
                onChange={() => setDept("")}
              />
              <span>All</span>
            </label>
            {allDepartments.map((d) => (
              <label key={d || "unknown"} className="radio">
                <input
                  type="radio"
                  name="dept"
                  checked={dept === d}
                  onChange={() => setDept(d)}
                />
                <span>{d || "—"}</span>
              </label>
            ))}
          </div>
        </div>

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
            <label className="radio">
              <input
                type="radio"
                name="status"
                checked={status === "Suspended"}
                onChange={() => setStatus("Suspended")}
              />
              <span>Suspended</span>
            </label>
          </div>
        </div>

        {/* Role: dọc */}
        <div className="modal__group">
          <div className="group__title">Role</div>
          <div className="group__col">
            <label className="radio">
              <input
                type="radio"
                name="role"
                checked={role === ""}
                onChange={() => setRole("")}
              />
              <span>All</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="role"
                checked={role === "Employee"}
                onChange={() => setRole("Employee")}
              />
              <span>Employee</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="role"
                checked={role === "Manager"}
                onChange={() => setRole("Manager")}
              />
              <span>Manager</span>
            </label>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            onClick={() => onApply({ department: dept, status, role })}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}


/** ---------------------- Helpers ---------------------- */
function getInitials(name) {
  if (!name) return "U";
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

/** ---------------------- Main Page ---------------------- */
export default function Employees() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Search (debounce -> BE)
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Paging & sort
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("asc");

  // Filters gửi lên BE
  const [filters, setFilters] = useState({ department: "", status: "", role: "" });
  const [isFilterOpen, setFilterOpen] = useState(false);

  // Data
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Danh sách phòng ban CỐ ĐỊNH, lấy một lần từ BE (không phụ thuộc bảng)
  const [deptOptions, setDeptOptions] = useState([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

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
            department: filters.department || undefined,
            status: filters.status || undefined,
            role: filters.role || undefined,
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
    return () => { abort = true; };
  }, [page, pageSize, sortBy, sortOrder, debouncedQ, filters, token]);

  // 🌟 Load cố định danh sách Department một lần (hoặc khi token đổi)
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        // Lấy thật nhiều để gom department (tùy BE; có thể đổi thành endpoint riêng nếu bạn có)
        const data = await getUsers(
          { page: 1, limit: 1000, sortBy: "created_at", sortOrder: "asc" },
          token
        );
        if (abort) return;
        const set = new Set(
          (data.users || [])
            .map((u) => u?.department?.department_name || u?.department || "")
            .filter(Boolean)
        );
        setDeptOptions([...set].sort((a, b) => a.localeCompare(b)));
      } catch (e) {
        // Không chặn UI nếu lỗi — chỉ để mặc danh sách rỗng
        console.error("Load departments failed:", e?.message || e);
      }
    })();
    return () => { abort = true; };
  }, [token]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  function renderAvatar(u) {
    const url = u?.avatar;
    const name = u?.full_name || u?.name || "User";
    if (url) return <img className="emp-person__avatar" src={url} alt={name} />;
    return (
      <div className="emp-person__avatar" style={{ background:"#eef", color:"#334", display:"grid", placeItems:"center", fontWeight:600 }}>
        {getInitials(name)}
      </div>
    );
  }

  async function handleDelete(id) {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await apiDeleteUser(id, token);
      if (users.length === 1 && page > 1) setPage((p) => p - 1);
      else {
        setUsers((prev) => prev.filter((u) => u._id !== id));
        setTotal((t) => Math.max(0, t - 1));
      }
    } catch (e) {
      alert(`Xóa thất bại: ${e.message}`);
    }
  }

  return (
    <div className="emp">
      {/* Card */}
      <section className="emp-card">
        {/* Header: search + actions */}
        <div className="emp-card__head">
          <div className="emp-search emp-search--compact">
            <span className="emp-search__icon"><Icon name="search" /></span>
            <input
              className="emp-search__input emp-search__input--compact"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="emp__actions">
            <button className="btn btn--primary" onClick={() => navigate("/employees/add")}>
              <span className="btn__icon"><Icon name="plus" /></span>
              Add New Employee
            </button>
            <button className="btn" onClick={() => setFilterOpen(true)}>
              <span className="btn__icon"><Icon name="filter" /></span>
              Filter
            </button>
          </div>
        </div>

        {/* Sort bar */}
        <div className="emp-table__toolbar">
          <div className="toolbar__group">
            <label>
              Sort by:&nbsp;
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="created_at">Created</option>
                <option value="full_name">Name</option>
                <option value="status">Status</option>
              </select>
            </label>
            <label>
              &nbsp;Order:&nbsp;
              <select
                value={sortOrder}
                onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
              >
                <option value="asc">ASC</option>
                <option value="desc">DESC</option>
              </select>
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="emp-table__scroll">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Job</th>
                <th>Status</th>
                <th style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan="6" className="emp-empty">Đang tải dữ liệu...</td></tr>
              )}

              {!loading && err && (
                <tr><td colSpan="6" className="emp-empty">Lỗi tải dữ liệu: {err}</td></tr>
              )}

              {!loading && !err && users.map((u) => {
                const name = u?.full_name || u?.name || "—";
                const id   = u?.employeeId || "—";
                const dept = u?.department?.department_name || u?.department || "—";
                const title= u?.jobTitle || "—";
                const status = u?.status || "Active";
                return (
                  <tr key={u._id || id}>
                    <td>
                      <div className="emp-person">
                        {renderAvatar(u)}
                        <span className="emp-person__name">{name}</span>
                      </div>
                    </td>
                    <td>{id}</td>
                    <td>{dept}</td>
                    <td>{title}</td>
                    <td><span className="badge">{status}</span></td>
                    <td>
                      <div className="emp-actions">
                        <button title="View" onClick={() => alert("Xem chi tiết")}><Icon name="eye" /></button>
                        <button title="Edit" onClick={() => alert("Sửa thông tin")}><Icon name="edit" /></button>
                        <button title="Delete" className="danger" onClick={() => handleDelete(u._id)}><Icon name="trash" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && !err && users.length === 0 && (
                <tr><td colSpan="6" className="emp-empty">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer v2 */}
        <div className="emp-foot emp-foot--v2">
          <div className="emp-foot__left">
            <label>Showing</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="emp-foot__center">
            Showing {users.length ? (current - 1) * pageSize + 1 : 0} to {Math.min(current * pageSize, total)} out of {total} records
          </div>

          <div className="emp-foot__right emp-foot__pager">
            <button className="circle" disabled={current === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Prev">
              <Icon name="chevL" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const n = i + 1;
              return (
                <button key={n} className={`page ${n === current ? "is-active" : ""}`} onClick={() => setPage(n)}>
                  {n}
                </button>
              );
            })}

            <button className="circle" disabled={current === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next">
              <Icon name="chevR" />
            </button>
          </div>
        </div>
      </section>

      {/* Modal Filter */}
      <FilterModal
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        initial={filters}
        allDepartments={deptOptions}
        onApply={(f) => { setFilters(f); setFilterOpen(false); setPage(1); }}
      />
    </div>
  );
}
