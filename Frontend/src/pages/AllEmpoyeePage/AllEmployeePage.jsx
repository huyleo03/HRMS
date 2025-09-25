import React, { useMemo, useState } from "react";
import "./Employees.css";

/** --- Demo data ---------------------------------------------------------- */
const SEED = [
  { id: "345321231", name: "Darlene Robertson", dept: "Design", title: "UI/UX Designer", type: "Office", status: "Permanent", skills: ["React JS"], avatar: "https://i.pravatar.cc/40?img=1" },
  { id: "987890345", name: "Floyd Miles", dept: "Developement", title: "PHP Developer", type: "Office", status: "Permanent", skills: ["PHP"], avatar: "https://i.pravatar.cc/40?img=2" },
  { id: "453367122", name: "Cody Fisher", dept: "Sales", title: "Sales Manager", type: "Office", status: "Permanent", skills: ["Account"], avatar: "https://i.pravatar.cc/40?img=3" },
  { id: "345321231", name: "Dianne Russell", dept: "Sales", title: "BDM", type: "Remote", status: "Permanent", skills: ["Account"], avatar: "https://i.pravatar.cc/40?img=4" },
  { id: "453677881", name: "Savannah Nguyen", dept: "Design", title: "Design Lead", type: "Office", status: "Permanent", skills: ["React JS"], avatar: "https://i.pravatar.cc/40?img=5" },
  { id: "009918765", name: "Jacob Jones", dept: "Developement", title: "Python Developer", type: "Remote", status: "Permanent", skills: ["Python"], avatar: "https://i.pravatar.cc/40?img=6" },
  { id: "238870122", name: "Marvin McKinney", dept: "Developement", title: "Sr. UI Developer", type: "Remote", status: "Permanent", skills: ["Node JS", "React JS"], avatar: "https://i.pravatar.cc/40?img=7" },
  { id: "124335111", name: "Brooklyn Simmons", dept: "PM", title: "Project Manager", type: "Office", status: "Permanent", skills: ["Java"], avatar: "https://i.pravatar.cc/40?img=8" },
  { id: "435540099", name: "Kristin Watson", dept: "HR", title: "HR Executive", type: "Office", status: "Permanent", skills: [], avatar: "https://i.pravatar.cc/40?img=9" },
  { id: "009812890", name: "Kathryn Murphy", dept: "Developement", title: "React JS Developer", type: "Office", status: "Permanent", skills: ["React JS"], avatar: "https://i.pravatar.cc/40?img=10" },
  { id: "671190345", name: "Arlene McCoy", dept: "Developement", title: "Node JS", type: "Office", status: "Permanent", skills: ["Node JS"], avatar: "https://i.pravatar.cc/40?img=11" },
  { id: "091233412", name: "Devon Lane", dept: "BA", title: "Business Analyst", type: "Remote", status: "Permanent", skills: ["Account"], avatar: "https://i.pravatar.cc/40?img=12" },
];

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
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}

/** --- Filter Modal ------------------------------------------------------- */
function FilterModal({
  open,
  onClose,
  initial,
  allDepartments,
  allSkills,
  onApply,
  onSearchSync,
}) {
  const [localDepartments, setLocalDepartments] = useState(new Set(initial.departments));
  const [localSkills, setLocalSkills] = useState(new Set(initial.skills));
  const [localType, setLocalType] = useState(initial.type);
  const [localQuery, setLocalQuery] = useState(initial.query || "");

  React.useEffect(() => {
    if (open) {
      setLocalDepartments(new Set(initial.departments));
      setLocalSkills(new Set(initial.skills));
      setLocalType(initial.type);
      setLocalQuery(initial.query || "");
    }
  }, [open, initial]);

  function toggle(setter, currentSet, value) {
    const next = new Set(currentSet);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  }

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">Filter</h3>

        <div className="modal__search">
          <span className="icon"><Icon name="search" /></span>
          <input
            placeholder="Search Employee"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
        </div>

        <div className="modal__grid">
          <div className="modal__group">
            <div className="group__title">Department</div>
            <div className="group__list">
              {allDepartments.map((d) => (
                <label key={d} className="chk">
                  <input
                    type="checkbox"
                    checked={localDepartments.has(d)}
                    onChange={() => toggle(setLocalDepartments, localDepartments, d)}
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="modal__group">
            <div className="group__title no-label">&nbsp;</div>
            <div className="group__list">
              {allSkills.map((s) => (
                <label key={s} className="chk">
                  <input
                    type="checkbox"
                    checked={localSkills.has(s)}
                    onChange={() => toggle(setLocalSkills, localSkills, s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal__group">
          <div className="group__title">Select Type</div>
          <div className="group__row">
            <label className="radio">
              <input
                type="radio"
                name="type"
                checked={localType === "Office"}
                onChange={() => setLocalType("Office")}
              />
              <span>Office</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="type"
                checked={localType === "Remote"}
                onChange={() => setLocalType("Remote")}
              />
              <span>Work from Home</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="type"
                checked={localType === null}
                onChange={() => setLocalType(null)}
              />
              <span>All</span>
            </label>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn--primary"
            onClick={() => {
              onApply({
                departments: Array.from(localDepartments),
                skills: Array.from(localSkills),
                type: localType,
                query: localQuery,
              });
              onSearchSync?.(localQuery);
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/** --- Main Page ---------------------------------------------------------- */
export default function Employees() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // filter state
  const [filters, setFilters] = useState({
    departments: [],
    skills: [],
    type: null, 
    query: "",
  });
  const [isFilterOpen, setFilterOpen] = useState(false);

  const allDepartments = useMemo(
    () => Array.from(new Set(SEED.map((e) => e.dept))),
    []
  );
  const allSkills = useMemo(
    () => Array.from(new Set(SEED.flatMap((e) => e.skills))).concat(["Java","Python","React JS","Account","Node JS"]).filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i),
    []
  );

  const filtered = useMemo(() => {
    const qMerged = (q || filters.query || "").toLowerCase().trim();
    return SEED.filter((e) => {
      const textOk =
        !qMerged ||
        [e.name, e.id, e.dept, e.title, e.type].some((v) =>
          String(v).toLowerCase().includes(qMerged)
        );

      const deptOk =
        !filters.departments?.length || filters.departments.includes(e.dept);

      const typeOk = !filters.type || e.type === filters.type;

      const skillOk =
        !filters.skills?.length ||
        e.skills?.some((s) => filters.skills.includes(s));

      return textOk && deptOk && typeOk && skillOk;
    });
  }, [q, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return (
    <div className="emp">
      <header className="emp__header">
        <div>
          <h1 className="emp__title">All Employees</h1>
          <p className="emp__subtitle">All Employee Information</p>
        </div>

        <div className="emp__controls">
          <div className="emp-search">
            <span className="emp-search__icon"><Icon name="search" /></span>
            <input
              className="emp-search__input"
              placeholder="Search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>

          <button className="btn btn--primary" onClick={() => alert("Add new employee")}>
            <span className="btn__icon"><Icon name="plus" /></span>
            Add New Employee
          </button>

          <button className="btn" onClick={() => setFilterOpen(true)}>
            <span className="btn__icon"><Icon name="filter" /></span>
            Filter
          </button>
        </div>
      </header>

      <section className="emp-card">
        <div className="emp-table__scroll">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={i}>
                  <td>
                    <div className="emp-person">
                      <img className="emp-person__avatar" src={e.avatar} alt={e.name} />
                      <span className="emp-person__name">{e.name}</span>
                    </div>
                  </td>
                  <td>{e.id}</td>
                  <td>{e.dept}</td>
                  <td>{e.title}</td>
                  <td>{e.type}</td>
                  <td><span className="badge">Permanent</span></td>
                  <td>
                    <div className="emp-actions">
                      <button title="View"><Icon name="eye" /></button>
                      <button title="Edit"><Icon name="edit" /></button>
                      <button title="Delete" className="danger"><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" className="emp-empty">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="emp-foot">
          <div className="emp-foot__count">
            Showing {rows.length ? start + 1 : 0} to {Math.min(start + pageSize, filtered.length)} out of {filtered.length} records
          </div>

          <div className="emp-foot__pager">
            <button
              className="circle"
              disabled={current === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Prev"
            ><Icon name="chevL" /></button>

            {Array.from({ length: totalPages }).slice(0, Math.min(5, totalPages)).map((_, i) => {
              const n = i + 1;
              return (
                <button key={n} className={`page ${n === current ? "is-active" : ""}`} onClick={() => setPage(n)}>
                  {n}
                </button>
              );
            })}

            <button
              className="circle"
              disabled={current === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next"
            ><Icon name="chevR" /></button>
          </div>

          <div className="emp-foot__size">
            <label>Show</label>
            <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </section>

      {/* Modal */}
      <FilterModal
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        initial={filters}
        allDepartments={allDepartments}
        allSkills={allSkills}
        onApply={(f) => { setFilters(f); setFilterOpen(false); setPage(1); }}
        onSearchSync={(val) => setQ(val)}
      />
    </div>
  );
}
