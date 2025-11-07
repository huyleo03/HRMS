import React, { useState } from "react";
import { toast } from "react-toastify";
import { bulkCreateHolidays } from "../../../service/HolidayService";
import "../css/BulkImportModal.css";

/**
 * BulkImportModal - Import nhiều holidays từ CSV/Excel
 * Admin only feature
 */
function BulkImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Result

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error("Chỉ chấp nhận file CSV hoặc Excel (.csv, .xls, .xlsx)");
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = text.split("\n").filter((row) => row.trim());
        
        // Skip header row
        const dataRows = rows.slice(1);
        
        const parsedData = dataRows.map((row, index) => {
          const columns = row.split(",").map((col) => col.trim().replace(/^"|"$/g, ""));
          
          return {
            id: index + 1,
            name: columns[0] || "",
            date: columns[1] || "",
            endDate: columns[2] || null,
            type: columns[3] || "Company",
            isPaid: columns[4]?.toLowerCase() === "true" || columns[4] === "1" || true,
            isRecurring: columns[5]?.toLowerCase() === "true" || columns[5] === "1" || false,
            description: columns[6] || "",
            color: columns[7] || "#3b82f6",
            appliesTo: "All Employees", // Admin chỉ tạo holidays cho toàn công ty
            status: "Active",
          };
        });

        setPreviewData(parsedData);
        setStep(2);
      } catch (error) {
        console.error("Parse error:", error);
        toast.error("Lỗi khi đọc file. Vui lòng kiểm tra định dạng.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error("Không có dữ liệu để import");
      return;
    }

    setIsLoading(true);
    try {
      const response = await bulkCreateHolidays(previewData);
      
      toast.success(response.message || "Import thành công!");
      
      setStep(3);
      
      // Auto close after 3s
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3000);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error.message || "Lỗi khi import holidays");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setStep(1);
    onClose();
  };

  const downloadTemplate = () => {
    const csvContent = [
      "name,date,endDate,type,isPaid,isRecurring,description,color",
      "Tết Dương lịch,2025-01-01,,National,true,true,Ngày đầu năm mới,#ef4444",
      "Tết Nguyên Đán,2025-01-29,2025-02-04,National,true,true,Tết Âm lịch,#dc2626",
      "Giỗ Tổ Hùng Vương,2025-04-10,,National,true,true,10/3 Âm lịch,#f97316",
      "Ngày Giải phóng,2025-04-30,,National,true,true,30/4,#3b82f6",
      "Ngày Quốc tế Lao động,2025-05-01,,National,true,true,1/5,#3b82f6",
      "Quốc Khánh,2025-09-02,,National,true,true,2/9,#ef4444",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "holidays_template.csv";
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content bulk-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Import Hàng Loạt Ngày Nghỉ</h2>
          <button className="modal-close" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: Upload File */}
          {step === 1 && (
            <div className="upload-section">
              <div className="upload-instructions">
                <h3>📄 Hướng dẫn:</h3>
                <ol>
                  <li>Tải file mẫu (CSV template)</li>
                  <li>Điền thông tin các ngày nghỉ theo format</li>
                  <li>Upload file để import</li>
                </ol>

                <div className="template-format">
                  <h4>Format CSV:</h4>
                  <code>
                    name, date, endDate, type, isPaid, isRecurring, description, color
                  </code>
                  <ul>
                    <li><strong>name:</strong> Tên ngày nghỉ (bắt buộc)</li>
                    <li><strong>date:</strong> Ngày bắt đầu YYYY-MM-DD (bắt buộc)</li>
                    <li><strong>endDate:</strong> Ngày kết thúc (optional, để trống nếu 1 ngày)</li>
                    <li><strong>type:</strong> National/Company/Special (mặc định: Company)</li>
                    <li><strong>isPaid:</strong> true/false (mặc định: true)</li>
                    <li><strong>isRecurring:</strong> true/false (mặc định: false)</li>
                    <li><strong>description:</strong> Mô tả (optional)</li>
                    <li><strong>color:</strong> Mã màu hex (mặc định: #3b82f6)</li>
                  </ul>
                </div>

                <button className="btn btn--secondary" onClick={downloadTemplate}>
                  📥 Tải File Mẫu (CSV)
                </button>
              </div>

              <div className="upload-area">
                <input
                  type="file"
                  id="file-upload"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <label htmlFor="file-upload" className="upload-label">
                  <div className="upload-icon">📁</div>
                  <p>Click để chọn file CSV/Excel</p>
                  <p className="upload-hint">hoặc kéo thả file vào đây</p>
                </label>
                {file && (
                  <div className="file-info">
                    <span>📄 {file.name}</span>
                    <span className="file-size">
                      ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Preview Data */}
          {step === 2 && (
            <div className="preview-section">
              <div className="preview-header">
                <h3>👀 Xem trước dữ liệu ({previewData.length} ngày nghỉ)</h3>
                <p className="preview-hint">
                  Kiểm tra kỹ dữ liệu trước khi import
                </p>
              </div>

              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên</th>
                      <th>Ngày</th>
                      <th>Đến ngày</th>
                      <th>Loại</th>
                      <th>Lương</th>
                      <th>Hàng năm</th>
                      <th>Màu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.date}</td>
                        <td>{item.endDate || "-"}</td>
                        <td>
                          <span className={`type-badge type-badge--${item.type.toLowerCase()}`}>
                            {item.type}
                          </span>
                        </td>
                        <td>{item.isPaid ? "✅" : "❌"}</td>
                        <td>{item.isRecurring ? "🔄" : "-"}</td>
                        <td>
                          <div
                            className="color-preview"
                            style={{ background: item.color }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && (
            <div className="result-section">
              <div className="result-success">
                <div className="result-icon">✅</div>
                <h3>Import thành công!</h3>
                <p>Các ngày nghỉ đã được thêm vào hệ thống</p>
                <p className="result-hint">Modal sẽ tự động đóng sau 3 giây...</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {step === 1 && (
            <>
              <button className="btn btn--secondary" onClick={handleClose}>
                Hủy
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                className="btn btn--secondary"
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setPreviewData([]);
                }}
              >
                ← Quay lại
              </button>
              <button
                className="btn btn--primary"
                onClick={handleImport}
                disabled={isLoading || previewData.length === 0}
              >
                {isLoading ? "Đang import..." : `✓ Import ${previewData.length} ngày nghỉ`}
              </button>
            </>
          )}

          {step === 3 && (
            <button className="btn btn--primary" onClick={handleClose}>
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkImportModal;
