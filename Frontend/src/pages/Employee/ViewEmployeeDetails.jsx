import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser } from '../../service/UserService';
import { getDepartmentOptions } from '../../service/DepartmentService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './ViewEmployeeDetails.css';

const ViewEmployeeDetails = () => {
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
        
        // Show error toast
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
    navigate('/employees');
  };

  const handleSidebarItemClick = (itemId) => {
    setActiveSidebarItem(itemId);
    // Add specific actions for each sidebar item
    switch (itemId) {
      case 'profile':
        // Already on profile page
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
      
      // Update employee data with new data
      setEmployeeData(response.user);
      setIsEditing(false);
      
      // Show success toast
      toast.success('Cập nhật thông tin nhân viên thành công!');
      
    } catch (err) {
      console.error('Error updating employee:', err);
      
      // Show error toast
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
          Quay lại danh sách nhân viên
        </button>
      </div>
    );
  }

  const tabItems = [
    {
      id: 'personal',
      label: 'Personal Information',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12.25C14.0393 12.25 15.9229 12.7209 17.3223 13.5205C18.7002 14.308 19.75 15.5103 19.75 17C19.75 18.4897 18.7002 19.692 17.3223 20.4795C15.9229 21.2791 14.0393 21.75 12 21.75C9.96067 21.75 8.0771 21.2791 6.67773 20.4795C5.29976 19.692 4.25 18.4897 4.25 17C4.25 15.5103 5.29976 14.308 6.67773 13.5205C8.0771 12.7209 9.96067 12.25 12 12.25ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25Z" fill={activeTab === 'personal' ? '#7152F3' : '#16151C'}/>
        </svg>
      )
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6C4 3.79086 5.79086 2 8 2H15.3431C16.404 2 17.4214 2.42143 18.1716 3.17157L20.8284 5.82843C21.5786 6.57857 22 7.59599 22 8.65685V18C22 20.2091 20.2091 22 18 22H8C5.79086 22 4 20.2091 4 18V6Z" stroke={activeTab === 'documents' ? '#7152F3' : '#16151C'} strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 7L17 7" stroke={activeTab === 'documents' ? '#7152F3' : '#16151C'} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 12H17" stroke={activeTab === 'documents' ? '#7152F3' : '#16151C'} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 17H13" stroke={activeTab === 'documents' ? '#7152F3' : '#16151C'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  const sidebarItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12.25C14.0393 12.25 15.9229 12.7209 17.3223 13.5205C18.7002 14.308 19.75 15.5103 19.75 17C19.75 18.4897 18.7002 19.692 17.3223 20.4795C15.9229 21.2791 14.0393 21.75 12 21.75C9.96067 21.75 8.0771 21.2791 6.67773 20.4795C5.29976 19.692 4.25 18.4897 4.25 17C4.25 15.5103 5.29976 14.308 6.67773 13.5205C8.0771 12.7209 9.96067 12.25 12 12.25ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25Z" fill="white"/>
        </svg>
      )
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V5M16 2V5" stroke="#16151C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 7.5C3 5.29086 4.79086 3.5 7 3.5H17C19.2091 3.5 21 5.29086 21 7.5V18C21 20.2091 19.2091 22 17 22H7C4.79086 22 3 20.2091 3 18V7.5Z" stroke="#16151C" strokeWidth="1.5"/>
          <path d="M9 15L10.7528 16.4023C11.1707 16.7366 11.7777 16.6826 12.1301 16.2799L15 13" stroke="#16151C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9H21" stroke="#16151C" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 22C8.86748 22 10.4361 20.7202 10.8766 18.9899C11.0128 18.4547 11.4477 18 12 18H19M7 22C4.79086 22 3 20.2091 3 18V5C3 3.34315 4.34315 2 6 2H16C17.6569 2 19 3.34315 19 5V18M7 22H19C20.8675 22 22.4361 20.7202 22.8766 18.9899C23.0128 18.4547 22.5523 18 22 18H19M15 7H7M11 12H7" stroke="#16151C" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'leave',
      label: 'Leave',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 10H16M8 14H16M8 18H12M8 4C8 5.10457 8.89543 6 10 6H14C15.1046 6 16 5.10457 16 4M8 4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4M8 4H7C4.79086 4 3 5.79086 3 8V18C3 20.2091 4.79086 22 7 22H17C19.2091 22 21 20.2091 21 18V8C21 5.79086 19.2091 4 17 4H16" stroke="#16151C" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  // Format date function
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
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span 
          className="breadcrumb-link" 
          onClick={handleBackToEmployees}
        >
          All Employees
        </span>
        <span className="breadcrumb-separator">{'>'}</span>
        <span className="breadcrumb-current">{employeeData.full_name}</span>
      </div>

      <div className="employee-content">
        {/* Employee Sidebar */}
        <div className="employee-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12.25C14.0393 12.25 15.9229 12.7209 17.3223 13.5205C18.7002 14.308 19.75 15.5103 19.75 17C19.75 18.4897 18.7002 19.692 17.3223 20.4795C15.9229 21.2791 14.0393 21.75 12 21.75C9.96067 21.75 8.0771 21.2791 6.67773 20.4795C5.29976 19.692 4.25 18.4897 4.25 17C4.25 15.5103 5.29976 14.308 6.67773 13.5205C8.0771 12.7209 9.96067 12.25 12 12.25ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25Z" fill="white"/>
              </svg>
              <span>Profile</span>
            </div>
          </div>
          
          <div className="sidebar-menu">
            {sidebarItems.map((item) => (
              <div 
                key={item.id} 
                className={`sidebar-item ${activeSidebarItem === item.id ? 'active' : ''}`}
                onClick={() => handleSidebarItemClick(item.id)}
              >
                <div className="sidebar-item-icon">
                  {item.icon}
                </div>
                <span className="sidebar-item-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="employee-main">
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
                    <div className="avatar-placeholder" style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F3F4F6',
                      color: '#9CA3AF',
                      fontSize: '24px',
                      fontWeight: '600'
                    }}>
                      {employeeData.full_name ? employeeData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </div>
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
              {!isEditing ? (
                <button className="edit-profile-btn" onClick={handleEditClick}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 21H21M13.7844 5.31171C13.7844 5.31171 13.7844 6.94634 15.419 8.58096C17.0537 10.2156 18.6883 10.2156 18.6883 10.2156M7.31963 17.9881L10.7523 17.4977C11.2475 17.4269 11.7064 17.1975 12.06 16.8438L20.3229 8.58096C21.2257 7.67818 21.2257 6.21449 20.3229 5.31171L18.6883 3.67708C17.7855 2.77431 16.3218 2.77431 15.419 3.67708L7.15616 11.94C6.80248 12.2936 6.57305 12.7525 6.50231 13.2477L6.01193 16.6804C5.90295 17.4432 6.5568 18.097 7.31963 17.9881Z" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-divider"></div>

          {/* Tabs Navigation */}
          <div className="tabs-container">
            <div className="tabs-nav">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="tab-icon">
                    {tab.icon}
                  </div>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
            
            <div className="tab-divider"></div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'personal' && (
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
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Gender</label>
                        <div className="field-value">{employeeData.gender || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
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
                    </div>

                    <div className="info-row">
                      <div className="info-field">
                        <label>Address</label>
                        <div className="field-value">{employeeData.address || 'N/A'}</div>
                        <div className="field-line"></div>
                      </div>
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
                          <div className="field-value">{employeeData.department?.department_name || 'N/A'}</div>
                        )}
                        <div className="field-line"></div>
                      </div>
                    </div>

                    <div className="info-row">
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
                          <div className="field-value">{employeeData.salary ? `$${employeeData.salary.toLocaleString()}` : 'N/A'}</div>
                        )}
                        <div className="field-line"></div>
                      </div>
                      <div className="info-field">
                        {/* Empty field to maintain grid layout */}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="documents-info">
                  <div className="documents-placeholder">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16C12 10.4772 16.4772 6 22 6H38.6863C40.8154 6 42.8579 6.84572 44.3431 8.33097L51.6569 15.6447C53.1421 17.1299 54 19.1724 54 21.3137V48C54 53.5228 49.5228 58 44 58H22C16.4772 58 12 53.5228 12 48V16Z" stroke="#A2A1A8" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M24 20H46" stroke="#A2A1A8" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M24 32H46" stroke="#A2A1A8" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M24 44H36" stroke="#A2A1A8" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h3>No Documents Available</h3>
                    <p>Documents and files will appear here when uploaded.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployeeDetails;