import React, { useState, useEffect, useCallback, useRef } from "react";
import RequestSidebar from "../components/RequestSidebar";
import RequestToolbar from "../components/RequestToolbar";
import RequestList from "../components/RequestList";
import RequestDetail from "../components/RequestDetail";
import CreateRequestModal from "../components/CreateRequestModal";
import AdminRequestList from "../components/AdminRequestList";
import AdminStats from "../components/AdminStats";
import { getUserRequests } from "../../../service/RequestService";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import "../css/Request.css";

const REQUESTS_PER_PAGE = 20;

const Request = () => {
  const { user } = useAuth();

  // State Management
  const [selectedRequest, setSelectedRequest] = useState(null);
  const adminListRef = useRef(); // ✅ SỬA: Dùng useRef thay vì React.useRef()
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [activeTab, setActiveTab] = useState("inbox");
  const [prevActiveTab, setPrevActiveTab] = useState("inbox");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    limit: REQUESTS_PER_PAGE,
  });
  
  const isAdmin = user?.role === "Admin";
  
  const fetchRequests = useCallback(
    async (box = "inbox", page = 1) => {
      setIsLoading(true);
      const startTime = Date.now(); // ⏱️ Bắt đầu đếm thời gian
      
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
        
        // ⏱️ Đảm bảo loading hiển thị tối thiểu 1.5s
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1500 - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } catch (error) {
        console.error("❌ Lỗi khi tải danh sách đơn:", error);
        toast.error("Không thể tải danh sách đơn. Vui lòng thử lại.");
        
        // ⏱️ Ngay cả khi lỗi, vẫn giữ loading tối thiểu 1.5s
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1500 - elapsedTime);
        
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, filterStatus, filterPriority]
  );
  
  useEffect(() => {
    if (activeTab.startsWith("admin-") || prevActiveTab.startsWith("admin-")) {
      setPrevActiveTab(activeTab);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchRequests(activeTab, 1);
    }, 500);

    setPrevActiveTab(activeTab);
    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, searchQuery, filterStatus, fetchRequests, prevActiveTab]);

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
  }, []);

  const handleSelectRequest = useCallback((request) => {
    console.log("🔍 [Request] Selected request:", request._id);
    setSelectedRequest(request);
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
    } else if (activeTab === "admin-all") {
      toast.success("Đơn đã được tạo! Refresh trang để xem.");
    }
    handleCloseModal();
  }, [activeTab, fetchRequests, handleCloseModal]);

  const handleActionSuccess = useCallback(
    (updatedRequest, shouldCloseDetail = false) => {
      console.log("✅ [Request] Action success:", updatedRequest._id, "shouldClose:", shouldCloseDetail);
      
      setSelectedRequest(updatedRequest);

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === updatedRequest._id ? updatedRequest : req
        )
      );

      if (shouldCloseDetail) {
        setTimeout(() => {
          setSelectedRequest(null);
          
          // ✅ THÊM: Refresh AdminRequestList nếu ở admin view
          if (activeTab === "admin-all") {
            console.log("🔄 [Request] Refreshing AdminRequestList...");
            if (adminListRef.current?.refreshList) {
              adminListRef.current.refreshList();
            } else {
              console.warn("⚠️ [Request] adminListRef.current is null");
            }
          }
          
          // ✅ Refresh standard view
          if (activeTab === "inbox") {
            fetchRequests(activeTab, 1);
          }
        }, 1000);
      }
    },
    [activeTab, fetchRequests]
  );

  const handlePageChange = useCallback(
    (newPage) => {
      fetchRequests(activeTab, newPage);
    },
    [activeTab, fetchRequests]
  );

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

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
          <AdminRequestList 
            ref={adminListRef}  
            onSelectRequest={handleSelectRequest} 
          />
        ) : activeTab === "admin-stats" ? (
          <AdminStats />
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

      {/* ✅ RequestDetail Modal for Admin View */}
      {activeTab.startsWith("admin-") && selectedRequest && (
        <div className="request-detail-overlay" onClick={handleCloseDetail}>
          <div
            className="request-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <RequestDetail
              key={`${selectedRequest._id}-${selectedRequest.status}-${selectedRequest.updated_at}`}
              request={selectedRequest}
              onClose={handleCloseDetail}
              onActionSuccess={handleActionSuccess}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      )}

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