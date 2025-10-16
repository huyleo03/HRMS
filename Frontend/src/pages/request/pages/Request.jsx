import React, { useState, useEffect, useCallback } from "react";
import RequestSidebar from "../components/RequestSidebar";
import RequestToolbar from "../components/RequestToolbar";
import RequestList from "../components/RequestList";
import RequestDetail from "../components/RequestDetail";
import CreateRequestModal from "../components/CreateRequestModal";
import AdminRequestList from "../components/AdminRequestList";
import { getUserRequests } from "../../../service/RequestService";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import "../css/Request.css";

const REQUESTS_PER_PAGE = 20;

const Request = () => {
  const { user } = useAuth();
  
  // State Management
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [activeTab, setActiveTab] = useState("inbox");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    limit: REQUESTS_PER_PAGE,
  });

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  // ✅ Data Fetching với search và filter từ server
  const fetchRequests = useCallback(
    async (box = "inbox", page = 1) => {
      setIsLoading(true);
      try {
        const params = {
          box,
          page,
          limit: REQUESTS_PER_PAGE,
          sortBy: "sentAt",
          sortOrder: "desc",
        };
        if (searchQuery.trim() !== "") {
          params.search = searchQuery.trim();
        }
        if (filterStatus !== "all") {
          params.status = filterStatus;
        }
        if (filterPriority !== "all") {
          params.priority = filterPriority;
        }
        const response = await getUserRequests(params);
        setRequests(response.data.requests);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách đơn:", error);
        toast.error("Không thể tải danh sách đơn. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, filterStatus, filterPriority]
  );
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests(activeTab, 1);
      setSelectedRequest(null);
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, searchQuery, filterStatus, fetchRequests]);

  const handleToggleStar = useCallback((requestId) => {
    setRequests((prev) =>
      prev.map((req) =>
        req._id === requestId
          ? {
              ...req,
              senderStatus: {
                ...req.senderStatus,
                isStarred: !req.senderStatus?.isStarred,
              },
            }
          : req
      )
    );
    // TODO: Gọi API để cập nhật star status
  }, []);

  const handleSelectRequest = useCallback((request) => {
    setSelectedRequest(request);
    // TODO: Nếu có API đánh dấu đã đọc, gọi ở đây
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedRequest(null);
  }, []);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCreateRequest = useCallback(() => {
    if (activeTab === "sent") {
      fetchRequests(activeTab, 1);
    }
    handleCloseModal();
  }, [activeTab, fetchRequests, handleCloseModal]);

  const handleActionSuccess = useCallback((updatedRequest) => {
    setSelectedRequest(updatedRequest);
    setRequests((prev) =>
      prev.map((req) => (req._id === updatedRequest._id ? updatedRequest : req))
    );
  }, []);

  const handlePageChange = useCallback(
    (newPage) => {
      fetchRequests(activeTab, newPage);
    },
    [activeTab, fetchRequests]
  );

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Derived State
  const unreadCount = activeTab === "inbox" ? pagination.totalRequests : 0;

  return (
    <div className="request-container">
      <RequestSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        unreadCount={unreadCount}
        onComposeClick={handleOpenModal}
        userRole={user?.role}
      />

      <div className="request-main">
        {/* Hide toolbar for admin tabs */}
        {!activeTab.startsWith("admin-") && (
          <RequestToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
          />
        )}

        {/* Admin View */}
        {activeTab === "admin-all" ? (
          <AdminRequestList onSelectRequest={handleSelectRequest} />
        ) : activeTab === "admin-stats" ? (
          <div className="admin-stats-placeholder">
            <h3>Thống kê (Đang phát triển)</h3>
            <p>Chức năng thống kê sẽ được triển khai sau</p>
          </div>
        ) : (
          /* Standard View */
          <div
            className={`request-content ${
              selectedRequest ? "split-view" : "full-view"
            }`}
          >
            <RequestList
              requests={requests} 
              selectedRequest={selectedRequest}
              onSelectRequest={handleSelectRequest}
              onToggleStar={handleToggleStar}
              hasSelectedRequest={!!selectedRequest}
              isLoading={isLoading}
              activeTab={activeTab}
              pagination={pagination}
              onPageChange={handlePageChange}
            />

            {selectedRequest && (
              <RequestDetail
                key={`${selectedRequest._id}-${selectedRequest.status}-${selectedRequest.updated_at}`}
                request={selectedRequest}
                onClose={handleCloseDetail}
                onActionSuccess={handleActionSuccess}
                isAdmin={isAdmin}
              />
            )}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {isModalOpen && (
        <CreateRequestModal
          onClose={handleCloseModal}
          onSubmit={handleCreateRequest}
        />
      )}
    </div>
  );
};

export default Request;