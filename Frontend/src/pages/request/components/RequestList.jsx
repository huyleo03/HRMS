import React from "react";
import RequestItem from "./RequestItem";
import { Loader, Inbox } from "lucide-react";

const RequestList = ({
  requests,
  selectedRequest,
  onSelectRequest,
  onToggleStar,
  hasSelectedRequest,
  isLoading,
  activeTab,
  pagination,
  onPageChange,
}) => {
  const getTabTitle = () => {
    const titles = {
      inbox: "Hộp thư đến",
      sent: "Đã gửi",
      cc: "Đơn CC",
      all: "Tất cả",
    };
    return titles[activeTab] || "Danh sách đơn";
  };

  const getEmptyMessage = () => {
    const messages = {
      inbox: "Không có đơn cần duyệt",
      sent: "Chưa gửi đơn nào",
      cc: "Không có đơn CC",
    };
    return messages[activeTab] || "Không có đơn nào";
  };

  return (
    <div className={`request-list ${hasSelectedRequest ? "compact" : "full"}`}>
      <div className="list-header">
        <h3>
          {getTabTitle()} 
          {!isLoading && ` (${pagination.totalRequests})`}
        </h3>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader size={32} className="animate-spin" />
          <p>Đang tải...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <Inbox size={64} />
          <h3>{getEmptyMessage()}</h3>
          <p>Không có đơn yêu cầu nào.</p>
        </div>
      ) : (
        <>
          <div className="list-items">
            {requests.map((request) => (
              <RequestItem
                key={request._id}
                request={request}
                isSelected={selectedRequest?._id === request._id}
                onSelect={onSelectRequest}
                onToggleStar={onToggleStar}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="list-pagination">
              <button
                className="pagination-btn"
                disabled={pagination.currentPage === 1}
                onClick={() => onPageChange(pagination.currentPage - 1)}
              >
                ← Trước
              </button>
              <span className="pagination-info">
                Trang {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => onPageChange(pagination.currentPage + 1)}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RequestList;