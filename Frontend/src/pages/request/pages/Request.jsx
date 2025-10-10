import React, { useState } from "react";
import RequestSidebar from "../components/RequestSidebar";
import RequestToolbar from "../components/RequestToolbar";
import RequestList from "../components/RequestList";
import RequestDetail from "../components/RequestDetail";
import CreateRequestModal from "../components/CreateRequestModal";
import "../css/Request.css";

// Mock Data
const mockRequests = [
  {
    id: "REQ-001",
    type: "Leave",
    subject: "Xin nghỉ phép",
    reason: "Tôi xin phép được nghỉ để giải quyết công việc cá nhân",
    submittedBy: {
      id: "user1",
      name: "Nguyễn Văn A",
      email: "nguyenvana@company.com",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    startDate: "2025-10-15",
    endDate: "2025-10-17",
    priority: "Normal",
    status: "Pending",
    isRead: false,
    isStarred: false,
    attachments: [],
    createdAt: "2025-10-09T08:30:00Z",
    approvalFlow: [
      {
        level: 1,
        approverName: "Trần Thị B",
        status: "Pending",
      },
    ],
  },
  {
    id: "REQ-002",
    type: "Overtime",
    subject: "Đề xuất tăng ca dự án ABC",
    reason: "Dự án ABC cần hoàn thành trước deadline",
    submittedBy: {
      id: "user2",
      name: "Lê Văn C",
      email: "levanc@company.com",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    startDate: "2025-10-10",
    endDate: "2025-10-10",
    hour: 4,
    priority: "High",
    status: "Pending",
    isRead: true,
    isStarred: true,
    attachments: [
      {
        fileName: "project-timeline.pdf",
        fileSize: 1024000,
      },
    ],
    createdAt: "2025-10-08T14:20:00Z",
    approvalFlow: [
      {
        level: 1,
        approverName: "Trần Thị B",
        status: "Pending",
      },
    ],
  },
  {
    id: "REQ-003",
    type: "RemoteWork",
    subject: "Xin làm việc từ xa",
    reason: "Cần chăm sóc người thân ốm",
    submittedBy: {
      id: "user3",
      name: "Phạm Thị D",
      email: "phamthid@company.com",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    startDate: "2025-10-12",
    endDate: "2025-10-14",
    priority: "Normal",
    status: "NeedsReview",
    isRead: true,
    isStarred: false,
    attachments: [],
    createdAt: "2025-10-07T10:15:00Z",
    approvalFlow: [
      {
        level: 1,
        approverName: "Trần Thị B",
        status: "NeedsReview",
      },
    ],
  },
  {
    id: "REQ-004",
    type: "Equipment",
    subject: "Xin cấp laptop mới",
    reason: "Laptop hiện tại đã quá cũ, ảnh hưởng hiệu suất làm việc",
    submittedBy: {
      id: "user4",
      name: "Hoàng Văn E",
      email: "hoangvane@company.com",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    startDate: "2025-10-15",
    priority: "High",
    status: "Pending",
    isRead: false,
    isStarred: false,
    attachments: [
      {
        fileName: "laptop-specs.xlsx",
        fileSize: 256000,
      },
    ],
    createdAt: "2025-10-09T09:00:00Z",
    approvalFlow: [
      {
        level: 1,
        approverName: "Trần Thị B",
        status: "Pending",
      },
      {
        level: 2,
        approverName: "Vũ Văn F",
        status: "Pending",
      },
    ],
  },
  {
    id: "REQ-005",
    type: "Expense",
    subject: "Thanh toán chi phí công tác",
    reason: "Chi phí đi công tác Hà Nội từ 01-05/10",
    submittedBy: {
      id: "user5",
      name: "Đỗ Thị G",
      email: "dothig@company.com",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    startDate: "2025-10-01",
    endDate: "2025-10-05",
    priority: "Normal",
    status: "Pending",
    isRead: true,
    isStarred: false,
    attachments: [
      {
        fileName: "expense-report.xlsx",
        fileSize: 768000,
      },
      {
        fileName: "receipts.pdf",
        fileSize: 2048000,
      },
    ],
    createdAt: "2025-10-06T16:45:00Z",
    approvalFlow: [
      {
        level: 1,
        approverName: "Trần Thị B",
        status: "Pending",
      },
    ],
  },
];

const Request = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requests, setRequests] = useState(mockRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [activeTab, setActiveTab] = useState("inbox");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchSearch =
      req.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.submittedBy.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = filterStatus === "all" || req.status === filterStatus;
    const matchPriority =
      filterPriority === "all" || req.priority === filterPriority;

    return matchSearch && matchStatus && matchPriority;
  });

  // Count unread
  const unreadCount = requests.filter((req) => !req.isRead).length;

  // Toggle star
  const handleToggleStar = (requestId) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId ? { ...req, isStarred: !req.isStarred } : req
      )
    );
  };

  // Select request and mark as read
  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    setRequests(
      requests.map((req) =>
        req.id === request.id ? { ...req, isRead: true } : req
      )
    );
  };

  // Close detail panel
  const handleCloseDetail = () => {
    setSelectedRequest(null);
  };

  // Open create request modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle create request submit
  const handleCreateRequest = (requestData) => {
    console.log("Creating request:", requestData);
    // TODO: Call API to create request
    // After success, add new request to list and close modal
    handleCloseModal();
  };

  return (
    <div className="request-container">
      <RequestSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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

        <div className={`request-content ${selectedRequest ? "split-view" : "full-view"}`}>
          <RequestList
            requests={filteredRequests}
            selectedRequest={selectedRequest}
            onSelectRequest={handleSelectRequest}
            onToggleStar={handleToggleStar}
            hasSelectedRequest={!!selectedRequest}
          />

          {selectedRequest && (
            <RequestDetail 
              request={selectedRequest} 
              onClose={handleCloseDetail}
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