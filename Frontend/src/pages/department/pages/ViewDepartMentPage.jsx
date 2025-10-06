// src/pages/DepartmentMembers/DepartmentMembers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDepartmentById } from "../../../service/DepartmentService";
import { useAuth } from "../../../contexts/AuthContext";
import "../css/DepartmentMembers.css";

function Icon({ name }) {
  const paths = {
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-6-6",
    plus: "M12 5v14M5 12h14",
    eye: "M1 12s4.5-7 11-7 11 7 11 7-4.5 7-11 7S1 12 1 12zm11 4a4 4 0 100-8 4 4 0 000 8z",
    edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
    trash: "M6 7h12v12a1 1 0 01-1 1H7a1 1 0 01-1-1V7zm3-4h6l1 2H8l1-2z",
    chevL: "M15 18l-6-6 6-6",
    chevR: "M9 6l6 6-6 6",
    filter: "M3 5h18l-7 8v6l-4-2v-4L3 5z",
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** --------------- Filter Modal ---------------- */
function FilterModal({ open, onClose, initial, onApply }) {
  const [status, setStatus] = useState(initial.status || "");
  const [role, setRole] = useState(initial.role || "");

  useEffect(() => {
    if (open) {
      setStatus(initial.status || "");
      setRole(initial.role || "");
    }
  }, [open, initial]);

  if (!open) return null;
  return (
    <div className="dm-modal-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="dm-modal__title">Filter</h3>

        {/* Status */}
        <div className="dm-modal__group">
          <div className="dm-group__title">Status</div>
          <div className="dm-group__grid dm-group__grid--2">
            <label className="dm-radio">
              <input
                type="radio"
                name="status"
                checked={status === ""}
                onChange={() => setStatus("")}
              />
              <span>All</span>
            </label>
            <label className="dm-radio">
              <input
                type="radio"
                name="status"
                checked={status === "Active"}
                onChange={() => setStatus("Active")}
              />
              <span>Active</span>
            </label>
            <label className="dm-radio">
              <input
                type="radio"
                name="status"
                checked={status === "Inactive"}
                onChange={() => setStatus("Inactive")}
              />
              <span>Inactive</span>
            </label>
            <label className="dm-radio">
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

        {/* Role */}
        <div className="dm-modal__group">
          <div className="dm-group__title">Role</div>
          <div className="dm-group__col">
            <label className="dm-radio">
              <input
                type="radio"
                name="role"
                checked={role === ""}
                onChange={() => setRole("")}
              />
              <span>All</span>
            </label>
            <label className="dm-radio">
              <input
                type="radio"
                name="role"
                checked={role === "Employee"}
                onChange={() => setRole("Employee")}
              />
              <span>Employee</span>
            </label>
            <label className="dm-radio">
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

        <div className="dm-modal__footer">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={() => onApply({ status, role })}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DepartmentMembers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [department, setDepartment] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    status: "",
    role: "",
  });
  const [isFilterOpen, setFilterOpen] = useState(false);

  // Compact header khi vào trang này
  useEffect(() => {
    document.body.classList.add("compact-header");
    return () => document.body.classList.remove("compact-header");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await getDepartmentById(id, token);
        if (abort) return;
        setDepartment(res?.data || null);
        setAllMembers(res?.data?.members || []);
      } catch (e) {
        if (!abort) setErr(e.message || "Fetch failed");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [id, token]);

  // LỌC và SẮP XẾP (Manager lên đầu)
  const filtered = useMemo(() => {
    const term = debouncedQ.toLowerCase();
    let result = allMembers;
    
    // Lọc theo search term
    if (term) {
      result = allMembers.filter((u) => {
        const name = (u.full_name || "").toLowerCase();
        const empId = (u.employeeId || "").toString().toLowerCase();
        const job = (u.jobTitle || "").toLowerCase();
        const role = (u.role || "").toLowerCase();
        const deptName = (
          u?.department?.department_name ||
          (typeof u?.department === "string" ? u.department : "") ||
          ""
        ).toLowerCase();
        return name.includes(term) || empId.includes(term) || job.includes(term) || role.includes(term) || deptName.includes(term);
      });
    }
    
    // Lọc theo filters
    if (filters.status) {
      result = result.filter((u) => u.status === filters.status);
    }
    if (filters.role) {
      result = result.filter((u) => u.role === filters.role);
    }
    
    // Sắp xếp: Manager lên đầu, sau đó theo tên
    return result.sort((a, b) => {
      // Manager luôn lên đầu
      if (a.role === "Manager" && b.role !== "Manager") return -1;
      if (a.role !== "Manager" && b.role === "Manager") return 1;
      
      // Nếu cùng role, sắp xếp theo tên
      const nameA = (a.full_name || "").toLowerCase();
      const nameB = (b.full_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [allMembers, debouncedQ, filters]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(page, pages);
  const start = (current - 1) * limit;
  const pageRows = filtered.slice(start, start + limit);

  // 👉 Điều hướng sang ViewEmployeeDetails, mang theo context phòng ban để breadcrumb hiển thị đúng
  const goToEmployeeProfile = (u) => {
    if (!u?._id) return;
    navigate(`/employees/${u._id}`, {
      state: {
        from: "department",
        departmentId: id,
        departmentName: department?.department_name || "Department",
      },
    });
  };

  return (
    <div className="dm">


      {/* Card */}
      <section className="dm-card">
              {/* Breadcrumb (đặt trên card, sát header) */}
      <div className="dm-crumb">
        <button type="button" className="dm-crumb__link" onClick={() => navigate("/departments")}>
          Department
        </button>
        <span className="dm-crumb__sep">›</span>
        <span className="dm-crumb__current">
          {department?.department_name || "Department"}
        </span>
      </div>
        <div className="dm-card__head">
          <div className="dm-search">
            <span className="dm-search__icon"><Icon name="search" /></span>
            <input
              className="dm-search__input"
              placeholder="Search by name, ID, department, job title"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="dm__actions">
            <button className="btn" onClick={() => setFilterOpen(true)}>
              <span className="btn__icon"><Icon name="filter" /></span>
              Filter
            </button>
          </div>
        </div>

        <div className="dm-card__subhead">
          <h3 className="dm-card__title">{department?.department_name || "Department"}</h3>
        </div>

        <div className="dm-table__scroll">
          <table className="dm-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Job</th>
                <th>Status</th>
                <th style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="6" className="dm-empty">Đang tải dữ liệu...</td></tr>}
              {!loading && err && <tr><td colSpan="6" className="dm-empty">Lỗi: {err}</td></tr>}

              {!loading && !err && pageRows.map((u) => (
                <tr key={u._id || u.employeeId}>
                  <td>{u.employeeId || "—"}</td>
                  <td>
                    <div className="dm-person" onClick={() => goToEmployeeProfile(u)} style={{cursor:"pointer"}}>
                      {u.avatar && u.avatar !== "https://i.pravatar.cc/150" ? (
                        <img className="dm-person__avatar" src={u.avatar} alt={u.full_name} />
                      ) : (
                        <div
                          className="dm-person__avatar"
                          style={{
                            background: "#eef",
                            color: "#334",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 600,
                          }}
                        >
                          {getInitials(u.full_name)}
                        </div>
                      )}
                      <span className="dm-person__name">{u.full_name}</span>
                    </div>
                  </td>
                  <td>{u?.role || "—"}</td>
                  <td>{u.jobTitle || "—"}</td>
                  <td><span className="badge">{u.status || "Active"}</span></td>
                  <td>
                    <div className="dm-actions">
                      <button title="View" onClick={() => goToEmployeeProfile(u)}><Icon name="eye" /></button>
                      <button title="Edit"><Icon name="edit" /></button>
                      <button title="Delete" className="danger"><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !err && pageRows.length === 0 && (
                <tr><td colSpan="6" className="dm-empty">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="dm-foot">
          <div className="dm-foot__left">
            <label>Showing</label>
            <select
              value={limit}
              onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="dm-foot__center">
            Showing {total ? start + 1 : 0} to {Math.min(current * limit, total)} out of {total} records
          </div>

          <div className="dm-foot__right">
            <button className="circle" disabled={current === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevL" /></button>
            <span className="page-indicator">{current}</span>
            <button className="circle" disabled={current === pages} onClick={() => setPage(p => Math.min(pages, p + 1))}><Icon name="chevR" /></button>
          </div>
        </div>
      </section>

      {/* Filter Modal */}
      <FilterModal
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        initial={filters}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
          setPage(1);
        }}
      />
    </div>
  );
}
