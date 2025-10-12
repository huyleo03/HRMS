import React, { useState, useEffect, useCallback, useMemo } from "react";
import RequestSidebar from "../components/RequestSidebar";
import RequestToolbar from "../components/RequestToolbar";
import RequestList from "../components/RequestList";
import RequestDetail from "../components/RequestDetail";
import CreateRequestModal from "../components/CreateRequestModal";
import { getUserRequests } from "../../../service/RequestService";
import { toast } from "react-toastify";
import "../css/Request.css";

const REQUESTS_PER_PAGE = 20;

const Request = () => {
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

  // Data Fetching
  const fetchRequests = useCallback(async (box = "inbox", page = 1) => {
    setIsLoading(true);
    try {
      const response = await getUserRequests({
        box,
        page,
        limit: REQUESTS_PER_PAGE,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      setRequests(response.data.requests);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("❌ Lỗi khi tải danh sách đơn:", error);
      toast.error("Không thể tải danh sách đơn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchRequests(activeTab, 1);
    setSelectedRequest(null);
  }, [activeTab, fetchRequests]);

  // Memoized Filtering Logic (Client-side)
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const lowerCaseQuery = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        request.title?.toLowerCase().includes(lowerCaseQuery) ||
        request.sender?.fullName?.toLowerCase().includes(lowerCaseQuery);

      const matchesStatus =
        filterStatus === "all" || request.status === filterStatus;

      const matchesPriority =
        filterPriority === "all" || request.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [requests, searchQuery, filterStatus, filterPriority]);

  // Memoized Handlers
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
    // toggleStarRequest(requestId);
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
      />

      <div className="request-main">
        <RequestToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
        />

        <div
          className={`request-content ${
            selectedRequest ? "split-view" : "full-view"
          }`}
        >
          <RequestList
            requests={filteredRequests}
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
            />
          )}
        </div>
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