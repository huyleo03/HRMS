// src/pages/AllDepartMentPage/Departments.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";              // <-- thêm
import { getDepartments } from "../../service/DepartmentService";
import "./Departments.css";
import { useAuth } from "../../contexts/AuthContext";

/* Icons */
function Icon({ name }) {
  const paths = {
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-6-6",
    plus: "M12 5v14M5 12h14",
    chevR: "M9 6l6 6-6 6",
    chevL: "M15 18l-6-6 6-6",
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

function MemberRow({ m }) {
  return (
    <div className="dept-member">
      <img className="dept-member__avatar" src={m.avatar} alt={m.full_name} />
      <div className="dept-member__info">
        <div className="dept-member__name">{m.full_name}</div>
        <div className="dept-member__title">{m.isManager ? "Manager" : (m.jobTitle || m.role || "")}</div>
      </div>
      <span className="dept-member__chev"><Icon name="chevR" /></span>
    </div>
  );
}

function DepartmentCard({ dep, onViewAll }) {
  const preview = Array.isArray(dep.membersPreview) ? dep.membersPreview : [];
  const count = typeof dep.membersCount === "number" ? dep.membersCount : 0;

  return (
    <div className="dept-card">
      <div className="dept-card__head">
        <div>
          <h3 className="dept-card__title">{dep.department_name}</h3>
          <div className="dept-card__subtitle">{count} Members</div>
        </div>
        <button className="link" onClick={() => onViewAll(dep)}>View All</button>
      </div>

      <div className="dept-card__body">
        {count === 0 ? (
          <div className="dept-empty">No members yet</div>
        ) : (
          preview.map((m) => <MemberRow key={m._id} m={m} />)
        )}
      </div>
    </div>
  );
}

export default function Departments() {
  const navigate = useNavigate();                               // <-- thêm
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [depts, setDepts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  // fetch departments
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await getDepartments({ page, limit, q: debouncedQ }, token);
        if (abort) return;
        setDepts(res?.data || []);
        setTotal(res?.total || 0);
        setPages(res?.pages || 1);
      } catch (e) {
        if (!abort) setErr(e.message || "Fetch failed");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [page, limit, debouncedQ, token]);

  // >>> điều hướng sang trang danh sách thành viên
  const handleViewAll = (dep) => {
    if (!dep?._id) return;
    navigate(`/view-department/${dep._id}`);                        // <-- sửa ở đây
  };

  const canPrev = page > 1;
  const canNext = page < pages;

  return (
    <div className="depts">
      <div className="depts__toolbar">
        <div className="depts-search">
          <span className="depts-search__icon"><Icon name="search" /></span>
          <input
            className="depts-search__input"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="btn btn--primary" onClick={() => alert("Add New Department")}>
          <span className="btn__icon"><Icon name="plus" /></span>
          Add New Department
        </button>
      </div>

      {loading ? (
        <div className="depts-loading">Loading...</div>
      ) : err ? (
        <div className="depts-error">Error: {err}</div>
      ) : (
        <>
          <div className="depts-grid">
            {depts.map((d) => (
              <DepartmentCard key={d._id} dep={d} onViewAll={handleViewAll} />
            ))}
            {depts.length === 0 && <div className="depts-empty">No departments found.</div>}
          </div>

          <div className="depts-foot">
            <div className="depts-foot__left">
              <label>Show</label>
              <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
                <option value={4}>4</option>
                <option value={6}>6</option>
                <option value={8}>8</option>
              </select>
            </div>

            <div className="depts-foot__center">
              Showing {(depts.length ? (page - 1) * limit + 1 : 0)} to {Math.min(page * limit, total)} of {total} departments
            </div>

            <div className="depts-foot__right">
              <button className="circle" disabled={!canPrev} onClick={() => setPage(p => Math.max(1, p - 1))}><Icon name="chevL" /></button>
              <span className="page-indicator">{page} / {pages}</span>
              <button className="circle" disabled={!canNext} onClick={() => setPage(p => Math.min(pages, p + 1))}><Icon name="chevR" /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
