import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getUserById, updateUser } from '../../../service/UserService';
import { getDepartmentOptions } from '../../../service/DepartmentService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { apiCall } from '../../../service/api';
import '../css/ViewEmployeeDetails.css';

const ViewEmployeeDetails = ({ isReadOnly = false, backPath = null }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [activeSidebarItem, setActiveSidebarItem] = useState('profile');
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation(); 
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!id || !token) return;

      try {
        setLoading(true);
        const response = await getUserById(id, token);
        setEmployeeData(response.user);
        
        // Initialize edit form data
        setEditFormData({
          jobTitle: response.user.jobTitle || '',
          role: response.user.role || 'Employee',
          department: response.user.department || null,
          salary: response.user.salary || '',
          avatar: response.user.avatar || null
        });
        // Set employee name for header
        sessionStorage.setItem('currentEmployeeName', response.user.full_name);
      } catch (err) {
        setError('Không thể tải thông tin nhân viên');
        console.error('Error fetching employee:', err);
        toast.error('Không thể tải thông tin nhân viên. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [id, token]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentData = await getDepartmentOptions(token);
        
        // Handle different response structures
        let departmentList = [];
        if (departmentData.data && Array.isArray(departmentData.data)) {
          departmentList = departmentData.data;
        } else if (departmentData.departments && Array.isArray(departmentData.departments)) {
          departmentList = departmentData.departments;
        } else if (Array.isArray(departmentData)) {
          departmentList = departmentData;
        }
        
        setDepartments(departmentList);
      } catch (err) {
        console.error('Error fetching departments:', err);
        toast.error('Không thể tải danh sách phòng ban');
      }
    };

    fetchDepartments();
  }, [token]);

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      sessionStorage.removeItem('currentEmployeeName');
    };
  }, []);

  const handleBackToEmployees = () => {
    // Nếu có backPath từ props (Manager), dùng nó
    if (backPath) {
      navigate(backPath);
      return;
    }
    
    // nếu đến từ phòng ban thì quay lại /departments, ngược lại về /employees
    if (routerLocation.state?.from === 'department') {
      navigate('/departments');
    } else {
      navigate('/employees');
    }
  };

  const handleSidebarItemClick = (itemId) => {
    setActiveSidebarItem(itemId);
    switch (itemId) {
      case 'profile':
        break;
      case 'attendance':
        // Could navigate to attendance page or show attendance data
        break;
      case 'projects':
        // Could navigate to projects page or show projects data
        break;
      case 'leave':
        // Could navigate to leave page or show leave data
        break;
      default:
        break;
    }
  };

  const handleEditClick = () => {
    // Reset editFormData to current employee data when starting edit
    setEditFormData({
      jobTitle: employeeData.jobTitle || '',
      role: employeeData.role || 'Employee',
      department: employeeData.department || null,
      salary: employeeData.salary || '',
      avatar: employeeData.avatar || null
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original employee data
    setEditFormData({
      jobTitle: employeeData.jobTitle || '',
      role: employeeData.role || 'Employee',
      department: employeeData.department || null,
      salary: employeeData.salary || '',
      avatar: employeeData.avatar || null
    });
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn ảnh trước khi upload');
      return;
    }

    try {
      setUploadingAvatar(true);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const avatarBase64 = e.target.result;
          
          // Update editFormData with new avatar
          setEditFormData(prev => ({
            ...prev,
            avatar: avatarBase64
          }));
          
          // Update employee data with new avatar for immediate display
          setEmployeeData(prev => ({
            ...prev,
            avatar: avatarBase64
          }));
          
          setSelectedFile(null);
          setPreviewUrl(null);
          
          toast.success('Ảnh đại diện đã được cập nhật! Nhấn Save để lưu thay đổi.');
        } catch (error) {
          console.error('Error processing avatar:', error);
          toast.error('Có lỗi xảy ra khi xử lý ảnh');
        }
      };
      reader.readAsDataURL(selectedFile);
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Có lỗi xảy ra khi upload ảnh');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatarUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSaveEdit = async () => {
    // Validate required fields
    if (!editFormData.jobTitle?.trim()) {
      toast.error('Chức vụ không được để trống');
      return;
    }

    try {
      setSaving(true);
      
      const response = await updateUser(id, editFormData, token);
      setEmployeeData(response.user);
      setIsEditing(false);
      toast.success('Cập nhật thông tin nhân viên thành công!');
    } catch (err) {
      console.error('Error updating employee:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleAllowReEnroll = async () => {
    if (!window.confirm('Cho phép nhân viên này đăng ký lại Face ID?\n\nẢnh khuôn mặt cũ sẽ bị xóa và nhân viên sẽ cần chụp lại ảnh mới.')) {
      return;
    }

    try {
      const response = await apiCall(`/api/face-id/admin/allow-reenroll/${id}`, {
        method: 'POST'
      });

      if (response.success) {
        toast.success('✅ Đã cho phép nhân viên đăng ký lại Face ID!');
        // Reload employee data
        const updatedEmployee = await getUserById(id, token);
        setEmployeeData(updatedEmployee.user);
      } else {
        throw new Error(response.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error('Error allowing re-enroll:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể cho phép đăng ký lại Face ID');
    }
  };

  if (loading) {
    return (
      <div className="employee-details-loading">
        <div>Đang tải thông tin nhân viên...</div>
      </div>
    );
  }

  if (error || !employeeData) {
    return (
      <div className="employee-details-error">
        <div>{error || 'Không tìm thấy thông tin nhân viên'}</div>
        <button onClick={handleBackToEmployees} className="back-button">
          Quay lại
        </button>
      </div>
    );
  }

  const tabItems = [
    {
      id: 'personal',
      label: 'Thông tin cá nhân',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 12.25C14.0393 12.25 15.9229 12.7209 17.3223 13.5205C18.7002 14.308 19.75 15.5103 19.75 17C19.75 18.4897 18.7002 19.692 17.3223 20.4795C15.9229 21.2791 14.0393 21.75 12 21.75C9.96067 21.75 8.0771 21.2791 6.67773 20.4795C5.29976 19.692 4.25 18.4897 4.25 17C4.25 15.5103 5.29976 14.308 6.67773 13.5205C8.0771 12.7209 9.96067 12.25 12 12.25ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25Z"
            fill={activeTab === 'personal' ? '#7152F3' : '#16151C'}
          />
        </svg>
      )
    }
  ];

  const sidebarItems = [
    {
      id: 'profile',
      label: 'Hồ sơ'
    },
    // Face ID tab - chỉ hiện với Admin/Manager và nhân viên đã đăng ký
    ...(user?.role === 'Admin' || user?.role === 'Manager' ? [{
      id: 'faceid',
      label: 'Face ID'
    }] : [])
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="view-employee-details">
      {/* ===== Breadcrumb linh hoạt ===== */}
      <div className="breadcrumb">
        {routerLocation.state?.from === "department" ? (
          <>
            <span className="breadcrumb-link" onClick={() => navigate("/departments")}>
              Department
            </span>
            <span className="breadcrumb-separator">{'>'}</span>
            <span
              className="breadcrumb-link"
              onClick={() =>
                navigate(`/view-department/${routerLocation.state?.departmentId}`, {
                  state: { departmentName: routerLocation.state?.departmentName },
                })
              }
            >
              {routerLocation.state?.departmentName || "Department"}
            </span>
            <span className="breadcrumb-separator">{'>'}</span>
            <span className="breadcrumb-current">{employeeData.full_name}</span>
          </>
        ) : (
          <>
            <span className="breadcrumb-link" onClick={handleBackToEmployees}>
              All Employees
            </span>
            <span className="breadcrumb-separator">{'>'}</span>
            <span className="breadcrumb-current">{employeeData.full_name}</span>
          </>
        )}
      </div>

      <div className="employee-content-full">
        {/* Main Content - Full Width */}
        <div className="employee-main-full">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-info-section">
              <div className="profile-avatar-container">
                <div className="profile-avatar-large">
                  {(previewUrl || (employeeData.avatar && employeeData.avatar !== "https://i.pravatar.cc/150")) ? (
                    <img 
                      src={previewUrl || employeeData.avatar} 
                      alt={employeeData.full_name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: '42px',
                      fontWeight: '700',
                      color: 'white',
                      letterSpacing: '2px'
                    }}>
                      {employeeData.full_name ? employeeData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </span>
                  )}
                </div>
                
                {/* Avatar Upload Controls - moved outside */}
                {isEditing && (
                  <div className="avatar-upload-controls-external">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="avatar-upload"
                    />
                    {!selectedFile ? (
                      <label htmlFor="avatar-upload" className="upload-btn-external">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 16V12M12 12V8M12 12H16M12 12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      </label>
                    ) : (
                      <div className="upload-actions-external">
                        <button 
                          type="button" 
                          className="upload-confirm-btn-external" 
                          onClick={handleAvatarUpload}
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? '...' : '✓'}
                        </button>
                        <button 
                          type="button" 
                          className="upload-cancel-btn-external" 
                          onClick={handleCancelAvatarUpload}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="profile-info-container">
                <h1 className="profile-name">{employeeData.full_name}</h1>
                <div className="profile-position">{employeeData.jobTitle || 'N/A'}</div>
                <div className="profile-email">{employeeData.email}</div>
              </div>
            </div>
            <div className="profile-actions">
              {!isReadOnly && !isEditing ? (
                <button className="edit-profile-btn" onClick={handleEditClick}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                       xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 21H21M13.7844 5.31171C13.7844 5.31171 13.7844 6.94634 15.419 8.58096C17.0537 10.2156 18.6883 10.2156 18.6883 10.2156M7.31963 17.9881L10.7523 17.4977C11.2475 17.4269 11.7064 17.1975 12.06 16.8438L20.3229 8.58096C21.2257 7.67818 21.2257 6.21449 20.3229 5.31171L18.6883 3.67708C17.7855 2.77431 16.3218 2.77431 15.419 3.67708L7.15616 11.94C6.80248 12.2936 6.57305 12.7525 6.50231 13.2477L6.01193 16.6804C5.90295 17.4432 6.5568 18.097 7.31963 17.9881Z"
                          stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Sửa hồ sơ
                </button>
              ) : !isReadOnly && isEditing ? (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Hủy
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="profile-divider"></div>

          {/* Sidebar Navigation */}
          <div className="profile-sidebar">
            {sidebarItems.map(item => (
              <div
                key={item.id}
                className={`sidebar-item ${activeSidebarItem === item.id ? 'active' : ''}`}
                onClick={() => handleSidebarItemClick(item.id)}
              >
                <div className="sidebar-icon">{item.icon}</div>
                <span className="sidebar-label">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Content - No Tabs, Direct Display */}
          <div className="tab-content">
            {activeSidebarItem === 'profile' && (
            <div className="personal-info">
              <div className="info-grid">
                    <div className="info-row">
                      <div className="info-field">
                        <label>Họ và tên</label>
                        <div className="field-value">{employeeData.full_name || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Mã nhân viên</label>
                        <div className="field-value">{employeeData.employeeId || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Số điện thoại</label>
                        <div className="field-value">{employeeData.phone || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Email</label>
                        <div className="field-value">{employeeData.email}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Ngày bắt đầu</label>
                        <div className="field-value">{formatDate(employeeData.startDate)}</div>
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Ngày sinh</label>
                        <div className="field-value">{formatDate(employeeData.dateOfBirth)}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Chức danh</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="field-input"
                            value={editFormData.jobTitle}
                            onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                          />
                        ) : (
                          <div className="field-value">{employeeData.jobTitle || 'N/A'}</div>
                        )}
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Giới tính</label>
                        <div className="field-value">{employeeData.gender || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Vai trò</label>
                        {isEditing ? (
                          <select
                            className="field-select"
                            value={editFormData.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                          >
                            <option value="Employee">Nhân viên</option>
                            <option value="Manager">Quản lý</option>
                          </select>
                        ) : (
                          <div className="field-value">{employeeData.role}</div>
                        )}
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Địa chỉ</label>
                        <div className="field-value">{employeeData.address || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Phòng ban</label>
                        {isEditing ? (
                          <select
                            className="field-select"
                            value={editFormData.department?.department_id || editFormData.department?._id || ''}
                            onChange={(e) => {
                              const selectedDept = departments.find(dept => 
                                dept.department_id === e.target.value || 
                                dept._id === e.target.value ||
                                dept.id === e.target.value
                              );
                              
                              // Ensure department has correct structure like AddEmployee
                              if (selectedDept) {
                                const departmentForSave = {
                                  department_id: selectedDept.department_id || selectedDept._id || selectedDept.id,
                                  department_name: selectedDept.department_name || selectedDept.name
                                };
                                handleInputChange('department', departmentForSave);
                              } else {
                                handleInputChange('department', null);
                              }
                            }}
                          >
                            <option value="">Chọn phòng ban</option>
                            {departments && departments.length > 0 ? (
                              departments.map(dept => (
                                <option 
                                  key={dept.department_id || dept._id || dept.id} 
                                  value={dept.department_id || dept._id || dept.id}
                                >
                                  {dept.department_name || dept.name}
                                </option>
                              ))
                            ) : (
                              <option disabled>Không có phòng ban</option>
                            )}
                          </select>
                        ) : (
                          <div className="field-value">
                            {employeeData.department?.department_name || 'N/A'}
                          </div>
                        )}
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Lương</label>
                        {isEditing ? (
                          <input
                            type="number"
                            className="field-input"
                            value={editFormData.salary}
                            onChange={(e) => handleInputChange('salary', e.target.value)}
                            placeholder="Nhập lương"
                          />
                        ) : (
                          <div className="field-value">
                            {employeeData.salary ? `${employeeData.salary.toLocaleString()} VNĐ` : 'N/A'}
                          </div>
                        )}
                        <div className="field-line"></div>
                      </div>
                    </div>
                  </div>
            </div>
            )}

            {/* Face ID Section - Chỉ Admin/Manager và nhân viên đã đăng ký Face ID */}
            {activeSidebarItem === 'faceid' && (user?.role === 'Admin' || user?.role === 'Manager') && (
              <div className="personal-info">
                <div className="info-grid">
                  <div className="face-id-section">
                    <h3 className="section-title">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#7152F3" strokeWidth="1.5"/>
                        <path d="M22 18C22 18.32 21.96 18.63 21.88 18.93C21.79 19.33 21.63 19.72 21.42 20.06C20.73 21.22 19.46 22 18 22C16.97 22 16.04 21.61 15.34 20.97C15.04 20.71 14.78 20.4 14.58 20.06C14.21 19.46 14 18.75 14 18C14 16.92 14.43 15.93 15.13 15.21C15.86 14.46 16.88 14 18 14C19.18 14 20.25 14.51 20.97 15.33C21.61 16.04 22 16.98 22 18Z" stroke="#7152F3" strokeWidth="1.5"/>
                        <path d="M16.44 18L17.43 18.99L19.56 17.02" stroke="#7152F3" strokeWidth="1.5"/>
                      </svg>
                      Face ID - Nhận diện khuôn mặt
                    </h3>

                    {employeeData.faceId?.enrolled ? (
                      <>
                        <div className="faceid-status enrolled">
                          <div className="status-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z" fill="#10B981"/>
                            </svg>
                            <div className="status-text">
                              <span className="status-label">Đã đăng ký Face ID</span>
                              <span className="status-date">
                                Ngày đăng ký: {new Date(employeeData.faceId.enrolledAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                          {user?.role === 'Admin' && (
                            <button 
                              className="btn-edit-faceid"
                              onClick={handleAllowReEnroll}
                              title="Cho phép nhân viên đăng ký lại Face ID"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M16.04 3.02001L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96001C22.34 6.60001 22.98 5.02001 20.98 3.02001C18.98 1.02001 17.4 1.66001 16.04 3.02001Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14.91 4.15002C15.58 6.54002 17.45 8.41002 19.85 9.09002" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Chỉnh sửa
                            </button>
                          )}
                        </div>

                        {employeeData.faceId.samplePhotos && employeeData.faceId.samplePhotos.length > 0 ? (
                          <div className="faceid-photos-container">
                            <h4 className="photos-title">Ảnh mẫu khuôn mặt ({employeeData.faceId.samplePhotos.length} ảnh)</h4>
                            <div className="photos-grid">
                              {employeeData.faceId.samplePhotos.map((photo, index) => (
                                <div key={index} className="photo-item">
                                  <div className="photo-wrapper">
                                    <img src={photo.url} alt={`Face ${index + 1}`} />
                                  </div>
                                  <div className="photo-info">
                                    <span className="photo-label">Góc {index + 1}</span>
                                    <span className="photo-date">
                                      {new Date(photo.capturedAt).toLocaleDateString('vi-VN', { 
                                        day: '2-digit', 
                                        month: '2-digit',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {user?.role === 'Admin' && (
                              <div className="faceid-admin-actions">
                                <button className="reset-faceid-btn">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M14.89 5.08001C14.01 4.81001 13.06 4.64001 12 4.64001C7.20996 4.64001 3.32996 8.52001 3.32996 13.31C3.32996 18.1 7.20996 21.98 12 21.98C16.79 21.98 20.67 18.1 20.67 13.31C20.67 11.54 20.14 9.88001 19.23 8.50001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M16.13 5.32L13.24 2.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M16.13 5.32001L12.76 7.78001" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Yêu cầu đăng ký lại Face ID
                                </button>
                                <p className="reset-note">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 8V13M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="#F59E0B" strokeWidth="1.5"/>
                                    <path d="M11.995 16H12.004" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                  Nhân viên sẽ cần chụp lại ảnh khuôn mặt trong lần chấm công tiếp theo
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="no-photos">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#D1D5DB" strokeWidth="1.5"/>
                              <path d="M3.41003 22C3.41003 18.13 7.26003 15 12 15C12.96 15 13.89 15.13 14.76 15.37" stroke="#D1D5DB" strokeWidth="1.5"/>
                            </svg>
                            <p>Không có ảnh mẫu</p>
                            <span>Dữ liệu Face ID chỉ chứa mã mô tả khuôn mặt (descriptors)</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="not-enrolled">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM15.36 14.3C15.65 14.59 15.65 15.07 15.36 15.36C15.21 15.51 15.02 15.58 14.83 15.58C14.64 15.58 14.45 15.51 14.3 15.36L12 13.06L9.7 15.36C9.55 15.51 9.36 15.58 9.17 15.58C8.98 15.58 8.79 15.51 8.64 15.36C8.35 15.07 8.35 14.59 8.64 14.3L10.94 12L8.64 9.7C8.35 9.41 8.35 8.93 8.64 8.64C8.93 8.35 9.41 8.35 9.7 8.64L12 10.94L14.3 8.64C14.59 8.35 15.07 8.35 15.36 8.64C15.65 8.93 15.65 9.41 15.36 9.7L13.06 12L15.36 14.3Z" fill="#EF4444"/>
                        </svg>
                        <h4>Chưa đăng ký Face ID</h4>
                        <p>Nhân viên này chưa thiết lập Face ID cho hệ thống chấm công</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployeeDetails;
