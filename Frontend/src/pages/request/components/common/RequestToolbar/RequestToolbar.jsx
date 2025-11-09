import React from "react";
import { Search, Filter } from "lucide-react";

const RequestToolbar = ({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
}) => {
  return (
    <div className="request-toolbar">
      <div className="toolbar-left">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, lý do, người gửi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="toolbar-right">
        <div className="filter-huyleo">
          <Filter size={18} />
          
          {/* ✅ CẬP NHẬT DANH SÁCH STATUS THEO MODEL */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Manager_Approved">Manager đã duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Từ chối</option>
            <option value="NeedsReview">Cần chỉnh sửa</option>
            <option value="Cancelled">Đã hủy</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả độ ưu tiên</option>
            <option value="Low">Thấp</option>
            <option value="Normal">Bình thường</option>
            <option value="High">Cao</option>
            <option value="Urgent">Khẩn cấp</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default RequestToolbar;