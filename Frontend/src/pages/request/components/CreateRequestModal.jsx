import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  AlertCircle,
  Paperclip,
  User,
  Users,
  FileText,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import "../css/CreateRequestModal.css";

const CreateRequestModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: "Leave",
    subject: "",
    reason: "",
    startDate: "",
    endDate: "",
    hour: "",
    priority: "Normal",
    attachments: [],
    approvers: [],
    cc: [],
  });

  const [errors, setErrors] = useState({});
  const [showApproverForm, setShowApproverForm] = useState(false);
  const [showCCForm, setShowCCForm] = useState(false);

  const requestTypes = [
    { value: "Leave", label: "Nghỉ phép", icon: "🏖️" },
    { value: "Overtime", label: "Tăng ca", icon: "⏰" },
    { value: "RemoteWork", label: "Làm từ xa", icon: "💻" },
    { value: "Resignation", label: "Nghỉ việc", icon: "👋" },
    { value: "BusinessTrip", label: "Công tác", icon: "✈️" },
    { value: "Equipment", label: "Thiết bị", icon: "🖥️" },
    { value: "ITSupport", label: "Hỗ trợ IT", icon: "🛠️" },
    { value: "HRDocument", label: "Tài liệu HR", icon: "📄" },
    { value: "Expense", label: "Chi phí", icon: "💰" },
    { value: "Other", label: "Khác", icon: "📝" },
  ];

  const priorityOptions = [
    { value: "Low", label: "Thấp", color: "#6b7280" },
    { value: "Normal", label: "Bình thường", color: "#3b82f6" },
    { value: "High", label: "Cao", color: "#f59e0b" },
    { value: "Urgent", label: "Khẩn cấp", color: "#ef4444" },
  ];

  // Mock data - Replace with actual API call
  const mockUsers = [
    { id: "user1", name: "Nguyễn Văn A", email: "nguyenvana@company.com", role: "Manager" },
    { id: "user2", name: "Trần Thị B", email: "tranthib@company.com", role: "Manager" },
    { id: "user3", name: "Lê Văn C", email: "levanc@company.com", role: "Director" },
    { id: "user4", name: "Phạm Thị D", email: "phamthid@company.com", role: "HR" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      file: file, // Store file object for upload
    }));
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments],
    }));
  };

  const removeAttachment = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const addApprover = (user, level = 1) => {
    const approver = {
      userId: user.id,
      name: user.name,
      email: user.email,
      level: level,
      role: "Approver",
    };
    setFormData((prev) => ({
      ...prev,
      approvers: [...prev.approvers, approver],
    }));
    setShowApproverForm(false);
  };

  const removeApprover = (index) => {
    setFormData((prev) => ({
      ...prev,
      approvers: prev.approvers.filter((_, i) => i !== index),
    }));
  };

  const addCC = (user) => {
    const ccUser = {
      userId: user.id,
      name: user.name,
      email: user.email,
      department: "IT", 
    };
    setFormData((prev) => ({
      ...prev,
      cc: [...prev.cc, ccUser],
    }));
    setShowCCForm(false);
  };

  const removeCC = (index) => {
    setFormData((prev) => ({
      ...prev,
      cc: prev.cc.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = "Vui lòng chọn loại đơn";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Vui lòng nhập lý do";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Vui lòng chọn ngày bắt đầu";
    }

    if (formData.approvers.length === 0) {
      newErrors.approvers = "Vui lòng chọn ít nhất một người phê duyệt";
    }

    if (formData.type === "Overtime" && !formData.hour) {
      newErrors.hour = "Vui lòng nhập số giờ tăng ca";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for API
    const requestData = {
      ...formData,
      // Convert file attachments to URLs (should upload first)
      attachments: formData.attachments.map((att) => ({
        fileName: att.fileName,
        fileUrl: "https://storage.example.com/" + att.fileName, // Mock URL
        fileSize: att.fileSize,
        fileType: att.fileType,
      })),
    };

    try {
      await onSubmit(requestData);
      handleClose();
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      type: "Leave",
      subject: "",
      reason: "",
      startDate: "",
      endDate: "",
      hour: "",
      priority: "Normal",
      attachments: [],
      approvers: [],
      cc: [],
    });
    setErrors({});
    setShowApproverForm(false);
    setShowCCForm(false);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>✍️ Tạo đơn yêu cầu mới</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="modal-content">
          {/* Request Type */}
          <div className="form-section">
            <label className="form-label">
              <FileText size={16} />
              Loại đơn <span className="required">*</span>
            </label>
            <div className="request-type-grid">
              {requestTypes.map((type) => (
                <div
                  key={type.value}
                  className={`type-card ${
                    formData.type === type.value ? "active" : ""
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, type: type.value }))
                  }
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                </div>
              ))}
            </div>
            {errors.type && <span className="error-text">{errors.type}</span>}
          </div>

          {/* Subject */}
          <div className="form-group">
            <label className="form-label">Tiêu đề</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Nhập tiêu đề ngắn gọn..."
              className="form-input"
              maxLength={200}
            />
            <span className="input-hint">
              {formData.subject.length}/200 ký tự
            </span>
          </div>

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">
              Lý do <span className="required">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Nhập lý do chi tiết..."
              className="form-textarea"
              rows={4}
            />
            {errors.reason && (
              <span className="error-text">{errors.reason}</span>
            )}
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                Ngày bắt đầu <span className="required">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="form-input"
              />
              {errors.startDate && (
                <span className="error-text">{errors.startDate}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                <Calendar size={16} />
                Ngày kết thúc
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="form-input"
                min={formData.startDate}
              />
            </div>
          </div>

          {/* Hour (for Overtime) */}
          {formData.type === "Overtime" && (
            <div className="form-group">
              <label className="form-label">
                <Clock size={16} />
                Số giờ tăng ca <span className="required">*</span>
              </label>
              <input
                type="number"
                name="hour"
                value={formData.hour}
                onChange={handleInputChange}
                placeholder="Nhập số giờ..."
                className="form-input"
                min="0"
                step="0.5"
              />
              {errors.hour && <span className="error-text">{errors.hour}</span>}
            </div>
          )}

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">
              <AlertCircle size={16} />
              Độ ưu tiên
            </label>
            <div className="priority-options">
              {priorityOptions.map((option) => (
                <div
                  key={option.value}
                  className={`priority-option ${
                    formData.priority === option.value ? "active" : ""
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, priority: option.value }))
                  }
                  style={{
                    borderColor:
                      formData.priority === option.value
                        ? option.color
                        : "#e5e7eb",
                  }}
                >
                  <div
                    className="priority-dot"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </div>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="form-group">
            <label className="form-label">
              <Paperclip size={16} />
              File đính kèm
            </label>
            <div className="upload-area">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileUpload}
                className="file-input"
              />
              <label htmlFor="file-upload" className="upload-label">
                <Upload size={24} />
                <span>Kéo thả file vào đây hoặc click để chọn</span>
                <span className="upload-hint">
                  Hỗ trợ: PDF, DOC, XLS, JPG, PNG (Max 10MB)
                </span>
              </label>
            </div>

            {formData.attachments.length > 0 && (
              <div className="attachment-list">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <Paperclip size={16} />
                    <div className="attachment-info">
                      <span className="attachment-name">{file.fileName}</span>
                      <span className="attachment-size">
                        {formatFileSize(file.fileSize)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeAttachment(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approvers */}
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              Người phê duyệt <span className="required">*</span>
            </label>

            {formData.approvers.length > 0 && (
              <div className="user-list">
                {formData.approvers.map((approver, index) => (
                  <div key={index} className="user-item">
                    <div className="user-avatar">
                      {approver.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{approver.name}</span>
                      <span className="user-email">{approver.email}</span>
                    </div>
                    <span className="user-level">Cấp {approver.level}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeApprover(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="add-btn"
              onClick={() => setShowApproverForm(!showApproverForm)}
            >
              <Plus size={16} />
              Thêm người phê duyệt
            </button>

            {showApproverForm && (
              <div className="user-select-dropdown">
                {mockUsers.map((user) => (
                  <div
                    key={user.id}
                    className="user-select-item"
                    onClick={() =>
                      addApprover(user, formData.approvers.length + 1)
                    }
                  >
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <span className="user-role">{user.role}</span>
                  </div>
                ))}
              </div>
            )}

            {errors.approvers && (
              <span className="error-text">{errors.approvers}</span>
            )}
          </div>

          {/* CC */}
          <div className="form-group">
            <label className="form-label">
              <Users size={16} />
              CC - Người nhận bản sao
            </label>

            {formData.cc.length > 0 && (
              <div className="user-list">
                {formData.cc.map((ccUser, index) => (
                  <div key={index} className="user-item">
                    <div className="user-avatar">
                      {ccUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{ccUser.name}</span>
                      <span className="user-email">{ccUser.email}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeCC(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="add-btn"
              onClick={() => setShowCCForm(!showCCForm)}
            >
              <Plus size={16} />
              Thêm người nhận CC
            </button>

            {showCCForm && (
              <div className="user-select-dropdown">
                {mockUsers.map((user) => (
                  <div
                    key={user.id}
                    className="user-select-item"
                    onClick={() => addCC(user)}
                  >
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            📤 Gửi đơn
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestModal;
