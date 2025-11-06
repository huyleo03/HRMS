import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOwnProfile, updateOwnProfile } from '../../service/UserService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './MyProfile.css';

const MyProfile = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const navigate = useNavigate();
  const { token, user, updateUser } = useAuth();

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
      if (!token) {
        return;
      }
      
      try {
        setLoading(true);
        const response = await getOwnProfile();
        setEmployeeData(response.user);
        // Initialize edit form data
        setEditFormData({
          full_name: response.user.full_name || '',
          jobTitle: response.user.jobTitle || '',
          phone: response.user.phone || '',
          gender: response.user.gender || '',
          address: response.user.address || '',
          dateOfBirth: response.user.dateOfBirth || ''
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
      jobTitle: employeeData.jobTitle || '',
      phone: employeeData.phone || '',
      gender: employeeData.gender || '',
      address: employeeData.address || '',
      dateOfBirth: employeeData.dateOfBirth || ''
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
    // ✅ Chỉ Admin mới được validate full_name và jobTitle
    if (employeeData.role === 'Admin') {
      if (!editFormData.full_name?.trim()) {
        toast.error('Họ tên không được để trống');
        return;
      }
      
      if (!editFormData.jobTitle?.trim()) {
        toast.error('Chức vụ không được để trống');
        return;
      }
    }

    try {
      setSaving(true);
      
      // Prepare data to send to backend
      const updateData = {
        phone: editFormData.phone || null,
        gender: editFormData.gender || null,
        address: editFormData.address || null,
        avatar: editFormData.avatar || null,
        dateOfBirth: editFormData.dateOfBirth || null
      };
      
      // ✅ Chỉ Admin mới được cập nhật full_name và jobTitle
      if (employeeData.role === 'Admin') {
        updateData.full_name = editFormData.full_name;
        updateData.jobTitle = editFormData.jobTitle;
      }
      
      const response = await updateOwnProfile(updateData);
      
      // Update employee data with new data
      setEmployeeData(response.user);
      
      // Update AuthContext to refresh Header avatar
      updateUser({
        name: response.user.full_name,
        avatar: response.user.avatar
      });
      
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
        <span className="breadcrumb-current">Hồ sơ cá nhân</span>
      </div>

      <div className="profile-content">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-main">
            <div className="profile-avatar-container">
              <div className="profile-avatar">
                {(previewUrl || (employeeData.avatar && employeeData.avatar !== 'https://i.pravatar.cc/150')) ? (
                  <div 
                    className="avatar-image-container"
                    style={{
                      backgroundImage: `url(${previewUrl || employeeData.avatar})`
                    }}
                  />
                ) : (
                  <div className="avatar-circle">
                    <span style={{
                      fontSize: '42px',
                      fontWeight: '700',
                      color: 'white',
                      letterSpacing: '2px'
                    }}>
                      {employeeData.full_name ? employeeData.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Avatar Upload Controls */}
              {isEditing && (
                <div className="avatar-upload-controls-external">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="my-profile-avatar-upload"
                  />
                  {!selectedFile ? (
                    <label htmlFor="my-profile-avatar-upload" className="upload-btn-external" title="Chọn ảnh đại diện">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </label>
                  ) : (
                    <div className="upload-actions-external">
                      <button 
                        type="button" 
                        className="upload-confirm-btn-external" 
                        onClick={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        title="Xác nhận"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        type="button" 
                        className="upload-cancel-btn-external" 
                        onClick={handleCancelAvatarUpload}
                        title="Hủy"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
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
                Sửa hồ sơ
              </button>
            ) : (
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button className="cancel-btn" onClick={handleCancelEdit}>
                  Hủy
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
            <span>Thông tin cá nhân</span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          <div className="personal-info">
            <div className="info-grid">
              <div className="info-row">
                <div className="info-field">
                  <label>Họ và tên</label>
                  {/* ✅ Chỉ Admin mới được sửa Full Name */}
                  {isEditing && employeeData.role === 'Admin' ? (
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
                  <label>Mã nhân viên</label>
                  <div className="field-value">{employeeData.employeeId || 'N/A'}</div>
                  <div className="field-line"></div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-field">
                  <label>Số điện thoại</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="field-input"
                      value={editFormData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <div className="field-value">{employeeData.phone || 'N/A'}</div>
                  )}
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
                  {isEditing ? (
                    <input
                      type="date"
                      className="field-input"
                      value={editFormData.dateOfBirth ? new Date(editFormData.dateOfBirth).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <div className="field-value">{formatDate(employeeData.dateOfBirth)}</div>
                  )}
                  <div className="field-line"></div>
                </div>
              </div>
              <div className="info-row">
                <div className="info-field">
                  <label>Chức danh</label>
                  {/* ✅ Chỉ Admin mới được sửa Job Title */}
                  {isEditing && employeeData.role === 'Admin' ? (
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
                  {isEditing ? (
                    <select
                      className="field-select"
                      value={editFormData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                    </select>
                  ) : (
                    <div className="field-value">{employeeData.gender || 'N/A'}</div>
                  )}
                  <div className="field-line"></div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-field">
                  <label>Địa chỉ</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="field-input"
                      value={editFormData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Nhập địa chỉ"
                    />
                  ) : (
                    <div className="field-value">{employeeData.address || 'N/A'}</div>
                  )}
                  <div className="field-line"></div>
                </div>
                <div className="info-field">
                  <label>Vai trò</label>
                  <div className="field-value">{employeeData.role}</div>
                  <div className="field-line"></div>
                </div>
              </div>

              {employeeData.role !== 'Admin' && (
                <div className="info-row">
                  <div className="info-field">
                    <label>Phòng ban</label>
                    <div className="field-value">
                      {employeeData.department?.department_name || 'N/A'}
                    </div>
                    <div className="field-line"></div>
                  </div>
                  <div className="info-field">
                    <label>Lương</label>
                    <div className="field-value">
                      {employeeData.salary ? `${employeeData.salary.toLocaleString()} VNĐ` : 'N/A'}
                    </div>
                    <div className="field-line"></div>
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

export default MyProfile;