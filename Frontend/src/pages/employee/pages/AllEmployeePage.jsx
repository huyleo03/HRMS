import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Employees.css";
import { Empty } from "antd";
import { getUsers, deactivateUser, reactivateUser } from "../../../service/UserService";
import { useAuth } from "../../../contexts/AuthContext";

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
    power: "M18.36 6.64a9 9 0 11-12.73 0M12 2v10",
    refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36M20.49 15a9 9 0 01-14.85 3.36",
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

/** --------------- Filter Modal (RADIO cho tất cả) ---------------- */
function FilterModal({ open, onClose, initial, allDepartments, onApply }) {
  const [dept, setDept] = useState(initial.department || "");
  const [status, setStatus] = useState(initial.status || "");
  const [role, setRole] = useState(initial.role || "");

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
        <h3 className="modal__title">Bộ Lọc</h3>

        {/* Department (giữ như cũ: trải ngang, có All) */}
        <div className="modal__group">
          <div className="group__title">Phòng Ban</div>
          <div className="group__row group__row--wrap">
            <label className="radio">
              <input
                type="radio"
                name="dept"
                checked={dept === ""}
                onChange={() => setDept("")}
              />
              <span>Tất Cả</span>
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
          <div className="group__title">Trạng Thái</div>
          <div className="group__grid group__grid--2">
            <label className="radio">
              <input
                type="radio"
                name="status"
                checked={status === ""}
                onChange={() => setStatus("")}
              />
              <span>Tất Cả</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="status"
                checked={status === "Active"}
                onChange={() => setStatus("Active")}
              />
              <span>Đang Làm Việc</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="status"
                checked={status === "Inactive"}
                onChange={() => setStatus("Inactive")}
              />
              <span>Nghỉ Việc</span>
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

        {/* Role: dọc */}
        <div className="modal__group">
          <div className="group__title">Vai Trò</div>
          <div className="group__col">
            <label className="radio">
              <input
                type="radio"
                name="role"
                checked={role === ""}
                onChange={() => setRole("")}
              />
              <span>Tất Cả</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="role"
                checked={role === "Employee"}
                onChange={() => setRole("Employee")}
              />
              <span>Nhân Viên</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="role"
                checked={role === "Manager"}
                onChange={() => setRole("Manager")}
              />
              <span>Quản Lý</span>
            </label>
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn btn--primary"
            onClick={() => onApply({ department: dept, status, role })}
          >
            Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
}

/** --------------- Confirm Modal (REUSABLE) ---------------- */
function ConfirmModal({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Xác nhận", 
  type = "warning" 
}) {
  if (!open) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--confirm" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">{title}</h3>
        <p className="modal__message">{message}</p>
        <div className="modal__actions">
          <button className="btn btn--secondary" onClick={onClose}>
            Hủy
          </button>
          <button 
            className={`btn btn--${type}`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ---------------------- Helpers ---------------------- */
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
  const sortBy = "created_at";
  const sortOrder = "asc";

  // Filters gửi lên BE
  const [filters, setFilters] = useState({
    department: "",
    status: "",
    role: "",
  });
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ 
    open: false, 
    type: null, 
    userId: null, 
    userName: null 
  });

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
    return () => {
      abort = true;
    };
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
    return () => {
      abort = true;
    };
  }, [token]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  // ===== HANDLERS FOR DEACTIVATE/REACTIVATE =====
  async function handleDeactivate() {
    try {
      await deactivateUser(confirmModal.userId);
      // Refresh table
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
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Deactivate failed:", error);
      alert("Lỗi khi vô hiệu hóa tài khoản: " + (error.message || "Unknown error"));
    }
  }

  async function handleReactivate() {
    try {
      await reactivateUser(confirmModal.userId);
      // Refresh table
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
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Reactivate failed:", error);
      alert("Lỗi khi kích hoạt lại tài khoản: " + (error.message || "Unknown error"));
    }
  }

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
              className="emp-search__input emp-search__input--compact"
              placeholder="Tìm kiếm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="emp__actions">
            <button
              className="btn btn--primary"
              onClick={() => navigate("/employees/add")}
            >
              <span className="btn__icon">
                <Icon name="plus" />
              </span>
              Thêm Nhân Viên
            </button>
            <button className="btn" onClick={() => setFilterOpen(true)}>
              <span className="btn__icon">
                <Icon name="filter" />
              </span>
              Bộ Lọc
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="emp-table__scroll">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Tên Nhân Viên</th>
                <th>Phòng Ban</th>
                <th>Chức Vụ</th>
                <th>Trạng Thái</th>
                <th style={{ width: 120 }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="emp-empty">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              )}

              {!loading && err && (
                <tr>
                  <td colSpan="6" className="emp-empty">
                    Lỗi tải dữ liệu: {err}
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                users.map((u) => {
                  const name = u?.full_name || u?.name || "—";
                  const id = u?.employeeId || "—";
                  const dept =
                    u?.department?.department_name || u?.department || "—";
                  const title = u?.jobTitle || "—";
                  const status = u?.status || "Active";
                  return (
                    <tr key={u._id || id}>
                      <td>{id}</td>
                      <td>
                        <div className="emp-person">
                          {renderAvatar(u)}
                          <span className="emp-person__name">{name}</span>
                        </div>
                      </td>
                      <td>{dept}</td>
                      <td>{title}</td>
                      <td>
                        <span className={`badge badge--${status.toLowerCase()}`}>
                          {status === "Active" ? "Đang Làm" : "Nghỉ Việc"}
                        </span>
                      </td>
                      <td>
                        <div className="emp-actions">
                          <button
                            title="Xem Chi Tiết"
                            onClick={() => navigate(`/employees/${u._id}`)}
                          >
                            <Icon name="eye" />
                          </button>
                          
                          {status === "Active" && (
                            <button 
                              title="Vô hiệu hóa" 
                              className="warning"
                              onClick={() => setConfirmModal({ 
                                open: true, 
                                type: 'deactivate', 
                                userId: u._id, 
                                userName: name 
                              })}
                            >
                              <Icon name="power" />
                            </button>
                          )}
                          
                          {status === "Inactive" && (
                            <button 
                              title="Kích hoạt lại" 
                              className="success"
                              onClick={() => setConfirmModal({ 
                                open: true, 
                                type: 'reactivate', 
                                userId: u._id, 
                                userName: name 
                              })}
                            >
                              <Icon name="refresh" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && !err && users.length === 0 && (
                <tr>
                  <td colSpan="6" className="emp-empty">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span>
                          {q
                            ? `Không tìm thấy nhân viên nào với từ khóa "${q}"`
                            : "Chưa có nhân viên nào"}
                        </span>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer v2 */}
        <div className="emp-foot emp-foot--v2">
          <div className="emp-foot__left">
            <label>Hiển thị</label>
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
            Hiển thị {users.length ? (current - 1) * pageSize + 1 : 0} đến{" "}
            {Math.min(current * pageSize, total)} trong tổng số {total} bản ghi
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

      {/* Modal Filter */}
      <FilterModal
        open={isFilterOpen}
        onClose={() => setFilterOpen(false)}
        initial={filters}
        allDepartments={deptOptions}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
          setPage(1);
        }}
      />

      {/* Modal Confirm Deactivate/Reactivate */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, type: null, userId: null, userName: null })}
        onConfirm={confirmModal.type === 'deactivate' ? handleDeactivate : handleReactivate}
        title={confirmModal.type === 'deactivate' ? 'Vô hiệu hóa tài khoản?' : 'Kích hoạt lại tài khoản?'}
        message={
          confirmModal.type === 'deactivate' 
            ? `Bạn có chắc muốn vô hiệu hóa tài khoản của "${confirmModal.userName}"? Họ sẽ không thể đăng nhập vào hệ thống.`
            : `Bạn có chắc muốn kích hoạt lại tài khoản của "${confirmModal.userName}"? Họ sẽ có thể đăng nhập trở lại.`
        }
        confirmText={confirmModal.type === 'deactivate' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
        type={confirmModal.type === 'deactivate' ? 'warning' : 'success'}
      />
    </div>
  );
}
