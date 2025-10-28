import React, { useState, useEffect } from "react";
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
  Loader,
  Search,
  Shield,
  CheckCircle,
} from "lucide-react";
import "./CreateRequestModal.css";
import { getWorkflowTemplate } from "../.././../../../service/WorkflowService";
import RequestTypeGrid from "../RequestTypeGrid/RequestTypeGrid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createRequest } from "../.././../../../service/RequestService";
import {
  getCcSuggestions,
  searchUsersForCc,
  getAdminUser,
} from "../.././../../../service/UserService";
import { uploadFileToCloudinary } from "../.././../../../service/CloudinaryService";
import { useAuth } from "../../../../../contexts/AuthContext";

const CreateRequestModal = ({ onClose, onSubmit }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const isManager = user?.role === "Manager"; 
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

  const [workflow, setWorkflow] = useState({
    isLoading: false,
    error: null,
    name: "",
  });
  const [errors, setErrors] = useState({});
  const [showCCForm, setShowCCForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ccSuggestions, setCcSuggestions] = useState([]);
  const [isCcLoading, setIsCcLoading] = useState(false);
  const [ccSearchTerm, setCcSearchTerm] = useState("");

  const priorityOptions = [
    { value: "Low", label: "Thấp", color: "#6b7280" },
    { value: "Normal", label: "Bình thường", color: "#3b82f6" },
    { value: "High", label: "Cao", color: "#f59e0b" },
    { value: "Urgent", label: "Khẩn cấp", color: "#ef4444" },
  ];

  // ✅ Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!formData.type) return;

      // ✅ ADMIN KHÔNG CẦN FETCH WORKFLOW (không được tạo đơn)
      if (isAdmin) {
        setWorkflow({ isLoading: false, error: null, name: "Admin không được phép tạo đơn" });
        setFormData((prev) => ({ ...prev, approvers: [] }));
        return;
      }

      // ✅ MANAGER: Chỉ Admin duyệt (bypass workflow)
      if (isManager) {
        setWorkflow({ isLoading: true, error: null, name: "" });
        
        try {
          // Fetch Admin user từ backend
          const adminUser = await getAdminUser();
          
          if (!adminUser) {
            setWorkflow({
              isLoading: false,
              error: "Không tìm thấy Admin trong hệ thống. Vui lòng liên hệ IT.",
              name: ""
            });
            return;
          }

          setWorkflow({ 
            isLoading: false, 
            error: null, 
            name: "Quy trình đơn giản (Chỉ Admin duyệt)" 
          });
          setFormData((prev) => ({ 
            ...prev, 
            approvers: [
              {
                level: 1,
                approverId: adminUser._id,
                approverName: adminUser.full_name,
                approverEmail: adminUser.email,
                role: "Approver"
              }
            ] 
          }));
        } catch (error) {
          console.error("Failed to fetch admin user:", error);
          setWorkflow({
            isLoading: false,
            error: "Lỗi khi tải thông tin Admin",
            name: ""
          });
        }
        return;
      }

      // ✅ EMPLOYEE: Quy trình nhiều cấp
      setWorkflow({ isLoading: true, error: null, name: "" });
      setFormData((prev) => ({ ...prev, approvers: [] }));

      try {
        const response = await getWorkflowTemplate(formData.type);

        if (response && response.approvalFlow) {
          setFormData((prev) => ({
            ...prev,
            approvers: response.approvalFlow,
          }));
          setWorkflow({
            isLoading: false,
            error: null,
            name: response.workflowName,
          });
        } else {
          setWorkflow({
            isLoading: false,
            error: "Không tìm thấy quy trình phê duyệt cho loại đơn này.",
            name: "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch workflow:", error);
        setWorkflow({
          isLoading: false,
          error:
            error.response?.data?.message || "Lỗi khi tải quy trình phê duyệt.",
          name: "",
        });
      }
    };

    fetchWorkflow();
  }, [formData.type, isAdmin, isManager]);

  useEffect(() => {
    const fetchInitialSuggestions = async () => {
      setIsCcLoading(true);
      try {
        const data = await getCcSuggestions();
        setCcSuggestions(data);
      } catch (error) {
        toast.error("Không thể tải danh sách người dùng.");
        console.error("Failed to fetch CC suggestions:", error);
      } finally {
        setIsCcLoading(false);
      }
    };
    if (showCCForm && ccSearchTerm.trim() === "") {
      fetchInitialSuggestions();
    }
  }, [showCCForm, ccSearchTerm]);

  useEffect(() => {
    if (ccSearchTerm.trim().length < 2) {
      return;
    }
    const debounceTimer = setTimeout(async () => {
      setIsCcLoading(true);
      try {
        const data = await searchUsersForCc(ccSearchTerm);
        setCcSuggestions(data);
      } catch (error) {
        toast.error("Lỗi khi tìm kiếm người dùng.");
        console.error("Failed to search CC users:", error);
      } finally {
        setIsCcLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [ccSearchTerm]);

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

  const addCC = (user) => {
    if (formData.cc.some((ccUser) => ccUser.userId === user._id)) {
      toast.info(`${user.full_name} đã có trong danh sách.`);
      return;
    }
    const ccUser = {
      userId: user._id,
      name: user.full_name,
      email: user.email,
      avatar: user.avatar,
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

    // ✅ ADMIN KHÔNG CẦN APPROVERS (tự động duyệt)
    if (!isAdmin && formData.approvers.length === 0) {
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
      toast.warn("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    setIsSubmitting(true);
    try {
      const uploadedAttachments = await Promise.all(
        formData.attachments.map(async (att) => {
          const realFileUrl = await uploadFileToCloudinary(att.file);
          return {
            fileName: att.fileName,
            fileUrl: realFileUrl, 
            fileSize: att.fileSize,
            fileType: att.fileType,
          };
        })
      );


      const { approvers, attachments, ...dataToSend } = formData;
      const requestData = {
        ...dataToSend,
        attachments: uploadedAttachments, 
        cc: formData.cc.map((user) => ({
          userId: user.userId,
          name: user.name,
          email: user.email,
        })),
      };

      const response = await createRequest(requestData);
      
      // ✅ Thông báo đặc biệt cho Admin (auto-approved)
      if (response.message?.includes("tự động phê duyệt")) {
        toast.success("✅ " + response.message, {
          autoClose: 5000,
          style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontWeight: "bold",
          },
        });
      } else {
        toast.success(response.message || "Gửi đơn thành công!");
      }
      
      if (onSubmit) {
        onSubmit(response.request);
      }
      handleClose();
    } catch (error) {
      console.error("❌ Error creating request:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi tạo đơn. Vui lòng thử lại.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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

        {/* ✅ ADMIN INFO BANNER */}
        {isAdmin && (
          <div className="admin-auto-approve-banner">
            <div className="banner-icon">
              <Shield size={20} />
            </div>
            <div className="banner-content">
              <div className="banner-title">
                <CheckCircle size={16} />
                <strong>Phê duyệt tự động</strong>
              </div>
              <div className="banner-text">
                Với quyền Admin, đơn của bạn sẽ được <strong>tự động phê duyệt</strong> ngay sau khi gửi.
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit} className="modal-content">
          {/* Request Type */}
          <div className="form-section">
            <label className="form-label">
              <FileText size={16} />
              Loại đơn <span className="required">*</span>
            </label>
            <RequestTypeGrid
              selectedValue={formData.type}
              onSelect={(value) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            />
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

          {/* Approvers - ẨN KHI ADMIN */}
          {!isAdmin && (
            <div className="form-group">
              <label className="form-label">
                <User size={16} />
                Quy trình phê duyệt <span className="required">*</span>
              </label>

              {/* Trạng thái Loading */}
              {workflow.isLoading && (
                <div className="workflow-status">
                  <Loader size={16} className="animate-spin" />
                  <span>Đang tải quy trình...</span>
                </div>
              )}

              {workflow.error && !workflow.isLoading && (
                <div className="workflow-status error">
                  <span>{workflow.error}</span>
                </div>
              )}

              {!workflow.isLoading &&
                !workflow.error &&
                formData.approvers.length > 0 && (
                  <>
                    <div className="workflow-name">
                      {isManager ? (
                        <>
                          <Shield size={14} style={{ marginRight: '4px' }} />
                          Quy trình đơn giản: <strong>{workflow.name}</strong>
                        </>
                      ) : (
                        <>
                          Áp dụng quy trình: <strong>{workflow.name}</strong>
                        </>
                      )}
                    </div>
                    <div className="user-list read-only">
                      {formData.approvers.map((approver, index) => (
                        <div key={index} className="user-item">
                          <div className="user-avatar">
                            {approver.approverName
                              ? approver.approverName.charAt(0).toUpperCase()
                              : "?"}
                          </div>
                          <div className="user-info">
                            <span className="user-name">
                              {approver.approverName || "Không xác định"}
                            </span>
                            <span className="user-email">
                              {approver.approverEmail}
                            </span>
                          </div>
                          <span className="user-level">Cấp {approver.level}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              {errors.approvers && (
                <span className="error-text">{errors.approvers}</span>
              )}
            </div>
          )}

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
                      {ccUser.name ? ccUser.name.charAt(0).toUpperCase() : "?"}
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
              {showCCForm ? "Đóng" : "Thêm người nhận CC"}
            </button>
            {showCCForm && (
              <div className="user-select-dropdown">
                <div className="user-search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    className="user-search-input"
                    value={ccSearchTerm}
                    onChange={(e) => setCcSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {isCcLoading ? (
                  <div className="user-select-item loading">
                    <Loader size={16} className="animate-spin" />
                    <span>Đang tải...</span>
                  </div>
                ) : ccSuggestions.length > 0 ? (
                  ccSuggestions.map((user) => (
                    <div
                      key={user._id}
                      className="user-select-item"
                      onClick={() => addCC(user)}
                    >
                      <div className="user-avatar">
                        {user.full_name
                          ? user.full_name.charAt(0).toUpperCase()
                          : "?"}
                      </div>
                      <div className="user-info">
                        <span className="user-name">{user.full_name}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="user-select-item empty">
                    <span>Không tìm thấy người dùng nào.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
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
