import React, { useState, useEffect } from "react";
import { X, Edit3, Save, Trash2, Paperclip, Upload, Loader } from "lucide-react";
import { resubmitRequest } from "../../../../../service/RequestService";
import { uploadFileToCloudinary } from "../../../../../service/CloudinaryService";
import { toast } from "react-toastify";
import "../CreateRequestModal/CreateRequestModal.css"; 

const EditRequestForm = ({ isOpen, onClose, requestToEdit, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newFiles, setNewFiles] = useState([]); // File objects từ input
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (requestToEdit) {
      setFormData({
        subject: requestToEdit.subject || "",
        reason: requestToEdit.reason || "",
        startDate: requestToEdit.startDate
          ? new Date(requestToEdit.startDate).toISOString().split("T")[0]
          : "",
        endDate: requestToEdit.endDate
          ? new Date(requestToEdit.endDate).toISOString().split("T")[0]
          : "",
        priority: requestToEdit.priority || "Medium",
      });
      setExistingAttachments(requestToEdit.attachments || []);
      setNewFiles([]);
    }
  }, [requestToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      file: file,
    }));
    setNewFiles((prev) => [...prev, ...newAttachments]);
  };

  const removeExistingAttachment = (fileToRemove) => {
    setExistingAttachments(
      existingAttachments.filter((file) => file.fileUrl !== fileToRemove.fileUrl)
    );
  };

  const removeNewFile = (indexToRemove) => {
    setNewFiles(newFiles.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subject?.trim()) newErrors.subject = "Tiêu đề là bắt buộc.";
    if (!formData.reason?.trim()) newErrors.reason = "Lý do là bắt buộc.";
    if (!formData.startDate) newErrors.startDate = "Ngày bắt đầu là bắt buộc.";
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
      let uploadedNewAttachments = [];
      if (newFiles.length > 0) {
        // toast.info("Đang tải file lên...");
        uploadedNewAttachments = await Promise.all(
          newFiles.map(async (fileObj) => {
            const realFileUrl = await uploadFileToCloudinary(fileObj.file);
            return {
              fileName: fileObj.fileName,
              fileUrl: realFileUrl,
              fileSize: fileObj.fileSize,
              fileType: fileObj.fileType,
            };
          })
        );
      }
      const payload = {
        ...formData,
        existingAttachments: JSON.stringify(existingAttachments),
        newAttachments: JSON.stringify(uploadedNewAttachments),
      };

      const response = await resubmitRequest(requestToEdit._id, payload);
      toast.success("Đã cập nhật và gửi lại đơn thành công!");
      if (onSuccess) onSuccess(response.request);
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật đơn."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    setExistingAttachments([]);
    setNewFiles([]);
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <Edit3 size={24} style={{ marginRight: "12px" }} />
            Chỉnh sửa đơn
          </h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="modal-content">
          {/* Subject */}
          <div className="form-group">
            <label className="form-label">
              Tiêu đề <span className="required">*</span>
            </label>
            <input
              type="text"
              name="subject"
              className="form-input"
              value={formData.subject}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Nhập tiêu đề..."
            />
            {errors.subject && (
              <span className="error-text">{errors.subject}</span>
            )}
          </div>

          {/* Reason */}
          <div className="form-group">
            <label className="form-label">
              Lý do <span className="required">*</span>
            </label>
            <textarea
              name="reason"
              className="form-textarea"
              rows="5"
              value={formData.reason}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Nhập lý do chi tiết..."
            />
            {errors.reason && <span className="error-text">{errors.reason}</span>}
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Ngày bắt đầu <span className="required">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                className="form-input"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.startDate && (
                <span className="error-text">{errors.startDate}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Ngày kết thúc</label>
              <input
                type="date"
                name="endDate"
                className="form-input"
                value={formData.endDate}
                onChange={handleChange}
                disabled={isSubmitting}
                min={formData.startDate}
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="form-group">
            <label className="form-label">
              <Paperclip size={16} />
              File đính kèm
            </label>

            {/* Hiển thị file cũ */}
            {existingAttachments.length > 0 && (
              <div className="attachment-list" style={{ marginBottom: "16px" }}>
                <p className="input-hint" style={{ marginBottom: "8px" }}>
                  📎 File hiện tại:
                </p>
                {existingAttachments.map((file) => (
                  <div key={file.fileUrl} className="attachment-item">
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
                      onClick={() => removeExistingAttachment(file)}
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload area cho file mới - TÁI SỬ DỤNG CSS */}
            <div className="upload-area">
              <input
                type="file"
                id="file-upload-edit"
                multiple
                onChange={handleFileChange}
                className="file-input"
                disabled={isSubmitting}
              />
              <label htmlFor="file-upload-edit" className="upload-label">
                <Upload size={24} />
                <span>Kéo thả file vào đây hoặc click để chọn</span>
                <span className="upload-hint">
                  Hỗ trợ: PDF, DOC, XLS, JPG, PNG (Max 10MB)
                </span>
              </label>
            </div>

            {/* Hiển thị file mới đã chọn - TÁI SỬ DỤNG CSS */}
            {newFiles.length > 0 && (
              <div className="attachment-list" style={{ marginTop: "16px" }}>
                <p className="input-hint" style={{ marginBottom: "8px" }}>
                  ➕ File mới:
                </p>
                {newFiles.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <Upload size={16} />
                    <div className="attachment-info">
                      <span className="attachment-name">{file.fileName}</span>
                      <span className="attachment-size">
                        {formatFileSize(file.fileSize)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeNewFile(index)}
                      disabled={isSubmitting}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
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
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Save size={16} />
                Lưu & Gửi lại
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRequestForm;