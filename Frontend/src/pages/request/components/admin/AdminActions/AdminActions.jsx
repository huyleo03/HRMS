import React, { useState } from "react";
import { Shield, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  forceApproveRequest,
  forceRejectRequest,
} from "../../../../../service/RequestService";
import { toast } from "react-toastify";
import "./AdminActions.css";

const AdminActions = ({ request, onActionSuccess }) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const canTakeAction = ["Pending", "Manager_Approved", "NeedsReview"].includes(
    request.status
  );

  const handleForceApprove = async () => {
    if (!comment || comment.trim() === "") {
      toast.warning("Vui lòng nhập lý do phê duyệt");
      return;
    }
    if (
      !["Pending", "Manager_Approved", "NeedsReview"].includes(request.status)
    ) {
      toast.error(
        `Không thể duyệt đơn ở trạng thái ${request.status}. Vui lòng refresh trang.`
      );
      return;
    }

    setLoading(true);
    try {
      const response = await forceApproveRequest(request._id, comment);
      toast.success(response.message || "Phê duyệt đơn thành công!");
      setShowApproveModal(false);
      setComment("");
      if (onActionSuccess) {
        onActionSuccess(response.request, true);
      }
    } catch (error) {
      console.error("❌ Lỗi khi phê duyệt:", error);
      toast.error(error.message || "Có lỗi xảy ra khi phê duyệt đơn");
    } finally {
      setLoading(false);
    }
  };

  const handleForceReject = async () => {
    if (!comment.trim()) {
      toast.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    if (
      !["Pending", "Manager_Approved", "NeedsReview"].includes(request.status)
    ) {
      toast.error(
        `Không thể từ chối đơn ở trạng thái ${request.status}. Vui lòng refresh trang.`
      );
      return;
    }
    setLoading(true);
    try {
      const response = await forceRejectRequest(request._id, comment);
      toast.success(response.message || "Từ chối đơn thành công!");
      setShowRejectModal(false);
      setComment("");
      if (onActionSuccess) {
        onActionSuccess(response.request, true);
      }
    } catch (error) {
      console.error("Lỗi khi từ chối:", error);
      toast.error(error.message || "Có lỗi xảy ra khi từ chối đơn");
    } finally {
      setLoading(false);
    }
  };

  if (!canTakeAction) {
    return (
      <div className="admin-actions-disabled">
        <AlertCircle className="icon" />
        <p>
          {request.status === "Approved" && "Đơn này đã được phê duyệt"}
          {request.status === "Rejected" && "Đơn này đã bị từ chối"}
          {request.status === "Cancelled" && "Đơn này đã bị hủy"}
          {!["Approved", "Rejected", "Cancelled"].includes(request.status) &&
            "Không thể thao tác với đơn ở trạng thái hiện tại"}
        </p>
      </div>
    );
  }

  return (
    <div className="admin-actions">
      <div className="admin-actions-header">
        <Shield className="icon" />
        <h3>Quyền Admin</h3>
      </div>
      <p className="admin-actions-description">
        Bạn có thể phê duyệt hoặc từ chối đơn này bất kể quy trình phê duyệt
        hiện tại.
      </p>
      <div className="admin-actions-buttons">
        <button
          className="admin-btn approve-btn"
          onClick={() => setShowApproveModal(true)}
        >
          <CheckCircle className="icon" />
          Phê duyệt ngay
        </button>
        <button
          className="admin-btn reject-btn"
          onClick={() => setShowRejectModal(true)}
        >
          <XCircle className="icon" />
          Từ chối
        </button>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowApproveModal(false)}
        >
          <div className="modal-contentt" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận phê duyệt (Admin)</h3>
              <button
                className="modal-close"
                onClick={() => setShowApproveModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn đang dùng quyền Admin để phê duyệt đơn này ngay lập tức, bỏ
                qua quy trình phê duyệt thông thường.
              </p>
              <label>Ghi chú (tùy chọn):</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập ghi chú nếu cần..."
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowApproveModal(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className="btn-primary"
                onClick={handleForceApprove}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Xác nhận phê duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowRejectModal(false)}
        >
          <div className="modal-contentt" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Xác nhận từ chối (Admin)</h3>
              <button
                className="modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn đang dùng quyền Admin để từ chối đơn này.</p>
              <label>
                Lý do từ chối <span className="required">*</span>:
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={4}
                required
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className="btn-danger"
                onClick={handleForceReject}
                disabled={loading || !comment.trim()}
              >
                {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActions;
