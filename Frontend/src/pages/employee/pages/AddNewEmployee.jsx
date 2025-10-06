import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { createUser } from "../../../service/UserService";
import { useAuth } from "../../../contexts/AuthContext";
import "../css/AddNewEmployee.css";
import {
  getDepartmentOptions,
  checkDepartmentManager,
} from "../../../service/DepartmentService";

const AddNewEmployee = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Form state based on UserController requirements - simplified
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "",
    department: null,
    jobTitle: "",
    salary: "",
    avatar: null,
  });

  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch department options on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!token) return;
      try {
        const departmentData = await getDepartmentOptions(token);
        if (
          departmentData &&
          departmentData.success &&
          Array.isArray(departmentData.data)
        ) {
          setDepartments(departmentData.data);
        } else {
          toast.error("Could not parse department data.");
        }
      } catch (error) {
        toast.error("Failed to load departments.");
      }
    };

    fetchDepartments();
  }, [token]);

  // Use effect to check for existing manager when role or department changes
  useEffect(() => {
    const checkManager = async () => {
      if (
        formData.role === "Manager" &&
        formData.department &&
        formData.department.department_id &&
        token
      ) {
        try {
          const result = await checkDepartmentManager(
            formData.department.department_id,
            token
          );

          if (result.success && !result.hasManager) {
            toast.warning(result.message || "Phòng ban này đã có Manager", {
              position: "top-right",
            });
          }
        } catch (error) {
          console.error("Error checking for existing manager:", error);
        }
      }
    };

    checkManager();
  }, [formData.role, formData.department, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "department") {
      const selectedDept = departments.find((dept) => dept._id === value);
      setFormData((prev) => ({
        ...prev,
        department: selectedDept
          ? {
              department_id: selectedDept._id,
              department_name: selectedDept.department_name,
            }
          : null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
        setFormData((prev) => ({
          ...prev,
          avatar: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData((prev) => ({
      ...prev,
      avatar: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.full_name.trim())
      newErrors.full_name = "Full name is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.salary.trim()) newErrors.salary = "Salary is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Salary validation
    if (formData.salary && isNaN(formData.salary)) {
      newErrors.salary = "Salary must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const submitData = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        department: formData.department,
        jobTitle: formData.jobTitle,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        avatar: formData.avatar, // Include avatar
      };

      const result = await createUser(submitData, token);

      if (result.success || result.user) {
        toast.success("Employee created successfully!", {
          position: "top-right",
          autoClose: 2000,
        });

        // Reset form
        setFormData({
          email: "",
          full_name: "",
          role: "",
          department: "",
          jobTitle: "",
          salary: "",
          avatar: null,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        setErrors({});

        setTimeout(() => {
          navigate("/employees");
        }, 1500);
      } else {
        console.error("API Error:", result);
        const errorMessage =
          result.data?.message || result.error || `Error: ${result.status}`;
        toast.error(errorMessage, {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Network Error:", error);

      // Handle backend validation errors (like manager already exists)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message, {
          position: "top-right",
        });
      } else {
        toast.error(
          `Network error: ${error.message}. Check if backend is running on correct port.`,
          {
            position: "top-right",
          }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTimeout(() => {
      navigate("/employees");
    }, 100);
  };

  return (
    <div className="add-employee-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span
          className="breadcrumb-link"
          onClick={() => navigate("/employees")}
        >
          All Employee
        </span>
        <span className="breadcrumb-separator"> &gt; </span>
        <span className="breadcrumb-current">Add new employee</span>
      </div>

      <div className="add-employee-card">
        <div className="tab-navigation">
          <div className="tab-list">
            <div
              className={`tab-item ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <div className="tab-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <span>Personal Information</span>
            </div>

            <div
              className={`tab-item ${
                activeTab === "documents" ? "active" : ""
              }`}
              onClick={() => setActiveTab("documents")}
            >
              <div className="tab-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6C4 3.79086 5.79086 2 8 2H15.3431C16.404 2 17.4214 2.42143 18.1716 3.17157L20.8284 5.82843C21.5786 6.57857 22 7.59599 22 8.65685V18C22 20.2091 20.2091 22 18 22H8C5.79086 22 4 20.2091 4 18V6Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <span>Documents</span>
            </div>
          </div>

          <div className="tab-divider"></div>
          <div
            className={`tab-indicator ${
              activeTab === "documents" ? "documents-tab" : ""
            }`}
          ></div>
        </div>

        <form onSubmit={handleSubmit} className="employee-form">
          {activeTab === "personal" && (
            <div className="form-content">
              {/* Thay đổi cấu trúc thành layout 2 cột */}
              <div className="form-layout-horizontal">
                {/* Cột trái: Avatar (30%) */}
                <div className="avatar-column">
                  <div className="avatar-section">
                    <div className="avatar-container">
                      {previewUrl ? (
                        <div style={{ position: "relative" }}>
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="avatar-preview"
                          />
                          <button
                            type="button"
                            className="avatar-remove-btn"
                            onClick={handleRemoveAvatar}
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M18 6L6 18M6 6L18 18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="avatar-placeholder">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>

                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                            id="avatar-upload-input"
                          />

                          <label
                            htmlFor="avatar-upload-input"
                            className="avatar-upload-btn"
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 16V12M12 12V8M12 12H16M12 12H8"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </label>
                        </div>
                      )}
                    </div>
                    <p className="avatar-hint">
                      {previewUrl
                        ? "Click X to remove"
                        : "Click to upload profile picture"}
                    </p>
                  </div>
                </div>

                {/* Cột phải: Form fields (70%) */}
                <div className="fields-column">
                  <div className="form-rows">
                    {/* Row 1: Full Name */}
                    <div className="form-row">
                      <div className="input-group">
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Full name"
                          className={errors.full_name ? "error" : ""}
                        />
                        {errors.full_name && (
                          <span className="error-text">{errors.full_name}</span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Email */}
                    <div className="form-row">
                      <div className="input-group">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Email"
                          className={errors.email ? "error" : ""}
                        />
                        {errors.email && (
                          <span className="error-text">{errors.email}</span>
                        )}
                      </div>
                    </div>

                    {/* Row 3: Role */}
                    <div className="form-row">
                      <div className="input-group">
                        <select
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className={errors.role ? "error" : ""}
                        >
                          <option value="">Select Role</option>
                          <option value="Manager">Manager</option>
                          <option value="Employee">Employee</option>
                        </select>
                        {errors.role && (
                          <span className="error-text">{errors.role}</span>
                        )}
                      </div>
                    </div>

                    {/* Row 4: Department */}
                    <div className="form-row">
                      <div className="input-group">
                        <select
                          name="department"
                          value={formData.department?.department_id || ""}
                          onChange={handleInputChange}
                          className={errors.department ? "error" : ""}
                        >
                          <option value="">Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.department_name}
                            </option>
                          ))}
                        </select>
                        {errors.department && (
                          <span className="error-text">
                            {errors.department}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 5: Job Title */}
                    <div className="form-row">
                      <div className="input-group">
                        <input
                          type="text"
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleInputChange}
                          placeholder="Job Title"
                          className={errors.jobTitle ? "error" : ""}
                        />
                        {errors.jobTitle && (
                          <span className="error-text">{errors.jobTitle}</span>
                        )}
                      </div>
                    </div>

                    {/* Row 6: Salary */}
                    <div className="form-row">
                      <div className="input-group">
                        <input
                          type="text"
                          name="salary"
                          value={formData.salary}
                          onChange={handleInputChange}
                          placeholder="Salary (USD)"
                          className={errors.salary ? "error" : ""}
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        {errors.salary && (
                          <span className="error-text">{errors.salary}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-cancel"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="spinner" viewBox="0 0 24 24">
                            <circle
                              className="spinner-circle"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                          </svg>
                          Creating...
                        </>
                      ) : (
                        "Create Employee"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddNewEmployee;
