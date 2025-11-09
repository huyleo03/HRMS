import React, { useState, useEffect, useCallback, useRef } from "react";
import RequestSidebar from "../components/employee/RequestSidebar/RequestSidebar";
import RequestToolbar from "../components/common/RequestToolbar/RequestToolbar";
import RequestList from "../components/employee/RequestList/RequestList";
import RequestDetail from "../components/employee/RequestDetail/RequestDetail";
import CreateRequestModal from "../components/employee/CreateRequestModal/CreateRequestModal";
import AdminRequestList from "../components/admin/AdminRequestList/AdminRequestList";
import AdminStats from "../components/admin/AdminStats/AdminStats";
import { getUserRequests, getRequestCounts } from "../../../service/RequestService";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import "../css/Request.css";

const REQUESTS_PER_PAGE = 20;

const Request = () => {
  const { user } = useAuth();
  const { onNewNotification } = useNotifications();

  // State Management
  const [selectedRequest, setSelectedRequest] = useState(null);
  const adminListRef = useRef(); 
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [activeTab, setActiveTab] = useState("inbox");
  const [prevActiveTab, setPrevActiveTab] = useState("inbox");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestCounts, setRequestCounts] = useState({});
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
      const startTime = Date.now(); 
      
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
  
  // Fetch request counts for sidebar badges
  const fetchCounts = useCallback(async () => {
    try {
      const response = await getRequestCounts();

      
      // Backend returns { counts: {...} } directly
      if (response && response.counts) {

        setRequestCounts(response.counts);
      } else {
        console.warn("⚠️ [Request] No counts found in response");
      }
    } catch (error) {
      console.error("❌ [Request] Lỗi fetch counts:", error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const pollingInterval = setInterval(fetchCounts, 10000);
    return () => clearInterval(pollingInterval);
  }, [fetchCounts]);

  useEffect(() => {
    if (!onNewNotification) return;

    const unregister = onNewNotification(() => {
      fetchCounts();
      if (activeTab === 'inbox') {
        fetchRequests('inbox', pagination.currentPage);
      }
    });

    return () => unregister?.();
  }, [onNewNotification, fetchCounts, fetchRequests, activeTab, pagination.currentPage]);

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

  const handleSelectRequest = useCallback((request) => {

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
    // Refresh counts after creating new request
    fetchCounts();
    
    if (activeTab === "sent") {
      fetchRequests(activeTab, 1);
    } else if (activeTab === "admin-all") {
      toast.success("Đơn đã được tạo! Refresh trang để xem.");
    }
    handleCloseModal();
  }, [activeTab, fetchRequests, fetchCounts, handleCloseModal]);

  const handleActionSuccess = useCallback(
    (updatedRequest, shouldCloseDetail = false) => {
 
      
      setSelectedRequest(updatedRequest);

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req._id === updatedRequest._id ? updatedRequest : req
        )
      );

      // ✅ Refresh counts after action
      fetchCounts();

      // ✨ IMPROVED: Always refresh list when status changes (Approved/Rejected/NeedsReview)
      const statusChangedToFinal = ['Approved', 'Rejected', 'Cancelled'].includes(updatedRequest.status);
      const needsRefresh = shouldCloseDetail || statusChangedToFinal;

      if (needsRefresh) {
        setTimeout(() => {
          setSelectedRequest(null);
          
          // ✅ Refresh AdminRequestList nếu ở admin view
          if (activeTab === "admin-all") {
   
            if (adminListRef.current?.refreshList) {
              adminListRef.current.refreshList();
            } else {
              console.warn("⚠️ [Request] adminListRef.current is null");
            }
          }
          
          // ✅ Refresh standard view (inbox, sent, etc.)
          if (activeTab === "inbox" || activeTab === "sent" || activeTab === "drafts") {
            fetchRequests(activeTab, 1);
          }
        }, 300); // Reduced delay for faster refresh
      }
    },
    [activeTab, fetchRequests, fetchCounts]
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

  return (
    <div className="request-container">
      <RequestSidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        counts={requestCounts}
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
                viewMode="employee"
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
              viewMode="admin"
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