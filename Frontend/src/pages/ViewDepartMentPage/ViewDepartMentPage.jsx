// src/pages/DepartmentMembers/DepartmentMembers.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDepartmentById } from "../../service/DepartmentService";
import { useAuth } from "../../contexts/AuthContext";
import "./DepartmentMembers.css";

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

const initials = (n) =>
  n ? n.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() : "U";

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

  // === LỌC: theo name / employeeId / jobTitle / department_name ===
  const filtered = useMemo(() => {
    const term = debouncedQ.toLowerCase();
    if (!term) return allMembers;
    return allMembers.filter((u) => {
      const name = (u.full_name || "").toLowerCase();
      const empId = (u.employeeId || "").toString().toLowerCase();
      const job = (u.jobTitle || "").toLowerCase();
      const deptName = (
        u?.department?.department_name ||
        (typeof u?.department === "string" ? u.department : "") ||
        ""
      ).toLowerCase();

      return (
        name.includes(term) ||
        empId.includes(term) ||
        job.includes(term) ||
        deptName.includes(term)
      );
    });
  }, [allMembers, debouncedQ]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const current = Math.min(page, pages);
  const start = (current - 1) * limit;
  const pageRows = filtered.slice(start, start + limit);

  return (
    <div className="dm">
      <section className="dm-card">
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
            <button className="btn btn--primary" onClick={() => navigate("/employees/add")}>
              <span className="btn__icon"><Icon name="plus" /></span>
              Add New Employee
            </button>
            <button className="btn" onClick={() => alert("Filter (optional)")}>
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
                <th>Department</th>
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
                    <div className="dm-person">
                      {u.avatar ? (
                        <img className="dm-person__avatar" src={u.avatar} alt={u.full_name} />
                      ) : (
                        <div className="dm-person__avatar dm-person__avatar--mono">
                          {initials(u.full_name)}
                        </div>
                      )}
                      <span className="dm-person__name">{u.full_name}</span>
                    </div>
                  </td>
                  <td>{u?.department?.department_name || (typeof u?.department === "string" ? u.department : "—")}</td>
                  <td>{u.jobTitle || "—"}</td>
                  <td><span className="badge">{u.status || "Active"}</span></td>
                  <td>
                    <div className="dm-actions">
                      <button title="View"><Icon name="eye" /></button>
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
    </div>
  );
}
