import React, { useEffect, useMemo, useState } from "react";
import { getDepartments, searchDepartments } from "../../service/DepartmentService";
import "./Departments.css";
import { useAuth } from "../../contexts/AuthContext";

/* Icon (chevron + search + plus) */
function Icon({ name }) {
  const paths = {
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-6-6",
    plus: "M12 5v14M5 12h14",
    chevR: "M9 6l6 6-6 6",
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="dept-member__title">
          {m.isManager ? "Manager" : (m.jobTitle || m.role || "")}
        </div>
      </div>
      <span className="dept-member__chev"><Icon name="chevR" /></span>
    </div>
  );
}

function DepartmentCard({ dep, onViewAll }) {
  const membersPreview = dep.membersPreview && dep.membersPreview.length
    ? dep.membersPreview
    : (dep.members || []).slice(0, 5); // fallback nếu BE cũ

  const count = typeof dep.membersCount === "number"
    ? dep.membersCount
    : (dep.members ? dep.members.length : 0);

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
          membersPreview.map((m) => <MemberRow key={m._id} m={m} />)
        )}
      </div>
    </div>
  );
}

export default function Departments() {
  const { token } = useAuth();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [depts, setDepts] = useState([]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  // fetch
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        if (debouncedQ) {
          const res = await searchDepartments(debouncedQ, token);
          if (abort) return;
          const onlyDepts = (res?.data?.departments || []).map((d) => ({
            ...d,
            members: [],           // search endpoint không trả members
            membersCount: undefined,
            membersPreview: [],    // sẽ thành No members, nhưng ok cho search nhanh
          }));
          setDepts(onlyDepts);
        } else {
          const res = await getDepartments(token);
          if (abort) return;
          setDepts(res?.data || []);
        }
      } catch (e) {
        if (!abort) setErr(e.message || "Fetch failed");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [debouncedQ, token]);

  const handleViewAll = (dep) => {
    // điều hướng tới trang chi tiết department (nếu có route)
    // navigate(`/departments/${dep._id}`);
    alert(`View all: ${dep.department_name}`);
  };

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
        <div className="depts-grid">
          {depts.map((d) => (
            <DepartmentCard key={d._id} dep={d} onViewAll={handleViewAll} />
          ))}
          {depts.length === 0 && (
            <div className="depts-empty">No departments found.</div>
          )}
        </div>
      )}
    </div>
  );
}
