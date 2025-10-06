import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOwnProfile, updateOwnProfile } from '../../service/UserService';
import { getDepartmentOptions } from '../../service/DepartmentService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './MyProfile.css';

const MyProfile = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  useEffect(() => {
    const fetchMyProfile = async () => {
      console.log('Fetching profile...', { 
        userId: user?.id, 
        hasToken: !!token,
        user: user,
        userKeys: user ? Object.keys(user) : 'no user'
      });
      
      if (!user?.id || !token) {
        console.log('Missing user ID or token');
        console.log('User object:', user);
        console.log('Token:', token ? 'exists' : 'missing');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Calling getOwnProfile with:', user.id);
        const response = await getOwnProfile(user.id, token);
        console.log('Profile response:', response);
        setEmployeeData(response.user);
        // Initialize edit form data
        setEditFormData({
          full_name: response.user.full_name || '',
          jobTitle: response.user.jobTitle || ''
        });
      } catch (err) {
        setError('Không thể tải thông tin cá nhân');
        console.error('Error fetching profile:', err);
        toast.error('Không thể tải thông tin cá nhân. Vui lòng thử lại!');
      } finally {
        setLoading(false);
      }
    };

    fetchMyProfile();
  }, [user, token]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentData = await getDepartmentOptions();
        setDepartments(departmentData.departments || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
        toast.error('Không thể tải danh sách phòng ban');
      }
    };

    fetchDepartments();
  }, []);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original employee data
    setEditFormData({
      full_name: employeeData.full_name || '',
      jobTitle: employeeData.jobTitle || ''
    });
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = async () => {
    // Validate required fields
    if (!editFormData.full_name?.trim()) {
      toast.error('Họ tên không được để trống');
      return;
    }
    
    if (!editFormData.jobTitle?.trim()) {
      toast.error('Chức vụ không được để trống');
      return;
    }

    try {
      setSaving(true);
      const response = await updateOwnProfile(user.id, editFormData, token);
      
      // Update employee data with new data
      setEmployeeData(response.user);
      setIsEditing(false);
      
      // Show success toast
      toast.success('Cập nhật thông tin cá nhân thành công!');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Show error toast
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="my-profile-loading">
        <div>Đang tải thông tin cá nhân...</div>
      </div>
    );
  }

  if (error || !employeeData) {
    return (
      <div className="my-profile-error">
        <div>{error || 'Không tìm thấy thông tin cá nhân'}</div>
        <button onClick={handleBackToDashboard} className="back-button">
          Quay lại Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="my-profile">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span 
          className="breadcrumb-link" 
          onClick={handleBackToDashboard}
        >
          Dashboard
        </span>
        <span className="breadcrumb-separator">{'>'}</span>
        <span className="breadcrumb-current">My Profile</span>
      </div>

      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-main">
            <div className="profile-avatar">
              {employeeData.avatar ? (
                <div 
                  className="avatar-image-container"
                  style={{
                    backgroundImage: `url(${employeeData.avatar})`
                  }}
                />
              ) : (
                <div className="avatar-circle">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12.25C14.0393 12.25 15.9229 12.7209 17.3223 13.5205C18.7002 14.308 19.75 15.5103 19.75 17C19.75 18.4897 18.7002 19.692 17.3223 20.4795C15.9229 21.2791 14.0393 21.75 12 21.75C9.96067 21.75 8.0771 21.2791 6.67773 20.4795C5.29976 19.692 4.25 18.4897 4.25 17C4.25 15.5103 5.29976 14.308 6.67773 13.5205C8.0771 12.7209 9.96067 12.25 12 12.25ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25Z" fill="white"/>
                  </svg>
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

        {/* Personal Information Tab */}
        <div className="profile-tab-header">
          <div className="tab-item active">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12.25C14.0393 12.25 15.9229 12.7209 17.3223 13.5205C18.7002 14.308 19.75 15.5103 19.75 17C19.75 18.4897 18.7002 19.692 17.3223 20.4795C15.9229 21.2791 14.0393 21.75 12 21.75C9.96067 21.75 8.0771 21.2791 6.67773 20.4795C5.29976 19.692 4.25 18.4897 4.25 17C4.25 15.5103 5.29976 14.308 6.67773 13.5205C8.0771 12.7209 9.96067 12.25 12 12.25ZM12 2.25C14.6234 2.25 16.75 4.37665 16.75 7C16.75 9.62335 14.6234 11.75 12 11.75C9.37665 11.75 7.25 9.62335 7.25 7C7.25 4.37665 9.37665 2.25 12 2.25Z" fill="#7152F3"/>
            </svg>
            <span>Personal Information</span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          <div className="personal-info">
            <div className="info-grid">
              <div className="info-row">
                <div className="info-field">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="field-input"
                      value={editFormData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  ) : (
                    <div className="field-value">{employeeData.full_name || 'N/A'}</div>
                  )}
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
                  <label>Email Address</label>
                  <div className="field-value">{employeeData.email}</div>
                  <div className="field-line"></div>
                </div>
                <div className="info-field">
                  <label>Start Date</label>
                  <div className="field-value">{formatDate(employeeData.startDate)}</div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;