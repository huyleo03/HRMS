import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getUserById, updateUser } from '../../../service/UserService';
import { getDepartmentOptions } from '../../../service/DepartmentService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
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
  const { token } = useAuth();

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
      label: 'Personal Information',
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
      label: 'Profile',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 12.25C14.0393 12.25 15.9229 12.7209 17.3223 13.5205C18.7002 14.308 19.75 15.5103 19.75 17C19.75 18.4897 18.7002 19.692 17.3223 20.4795C15.9229 21.2791 14.0393 21.75 12 21.75C9.96067 21.75 8.0771 21.2791 6.67773 20.4795C5.29976 19.692 4.25 18.4897 4.25 17C4.25 15.5103 5.29976 14.308 6.67773 13.5205C8.0771 12.7209 9.96067 12.25 12 12.25ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25Z"
            fill={activeSidebarItem === 'profile' ? '#7152F3' : '#16151C'}
          />
        </svg>
      )
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V5M16 2V5" stroke={activeSidebarItem === 'attendance' ? '#7152F3' : '#16151C'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 7.5C3 5.29086 4.79086 3.5 7 3.5H17C19.2091 3.5 21 7.5V18C21 20.2091 19.2091 22 17 22H7C4.79086 22 3 20.2091 3 18V7.5Z" stroke={activeSidebarItem === 'attendance' ? '#7152F3' : '#16151C'} strokeWidth="1.5"/>
          <path d="M9 15L10.7528 16.4023C11.1707 16.7366 11.7777 16.6826 12.1301 16.2799L15 13" stroke={activeSidebarItem === 'attendance' ? '#7152F3' : '#16151C'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9H21" stroke={activeSidebarItem === 'attendance' ? '#7152F3' : '#16151C'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
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
                  Edit Profile
                </button>
              ) : !isReadOnly && isEditing ? (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="profile-divider"></div>

          {/* Content - No Tabs, Direct Display */}
          <div className="tab-content">
            <div className="personal-info">
              <div className="info-grid">
                    <div className="info-row">
                      <div className="info-field">
                        <label>Full Name</label>
                        <div className="field-value">{employeeData.full_name || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Employee ID</label>
                        <div className="field-value">{employeeData.employeeId || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Mobile Number</label>
                        <div className="field-value">{employeeData.phone || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Email Address</label>
                        <div className="field-value">{employeeData.email}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Start Date</label>
                        <div className="field-value">{formatDate(employeeData.startDate)}</div>
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Date of Birth</label>
                        <div className="field-value">{formatDate(employeeData.dateOfBirth)}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Job Title</label>
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
                        <label>Gender</label>
                        <div className="field-value">{employeeData.gender || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Role</label>
                        {isEditing ? (
                          <select
                            className="field-select"
                            value={editFormData.role}
                            onChange={(e) => handleInputChange('role', e.target.value)}
                          >
                            <option value="Employee">Employee</option>
                            <option value="Manager">Manager</option>
                          </select>
                        ) : (
                          <div className="field-value">{employeeData.role}</div>
                        )}
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        <label>Address</label>
                        <div className="field-value">{employeeData.address || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Department</label>
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
                            <option value="">Select Department</option>
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
                              <option disabled>No departments available</option>
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
                        <label>Salary</label>
                        {isEditing ? (
                          <input
                            type="number"
                            className="field-input"
                            value={editFormData.salary}
                            onChange={(e) => handleInputChange('salary', e.target.value)}
                            placeholder="Enter salary"
                          />
                        ) : (
                          <div className="field-value">
                            {employeeData.salary ? `$${employeeData.salary.toLocaleString()}` : 'N/A'}
                          </div>
                        )}
                        <div className="field-line"></div>
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployeeDetails;
