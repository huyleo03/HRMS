import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout/Layout';
import './AddNewEmployee.css';

const AddNewEmployee = () => {
  const navigate = useNavigate();
  
  // Form state based on UserController requirements - simplified
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: '',
    department: '',
    jobTitle: '',
    salary: ''
  });

  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('personal');

  // Load departments from DepartmentController
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    // Department is now optional
    // if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    if (!formData.salary.trim()) newErrors.salary = 'Salary is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    // Salary validation
    if (formData.salary && isNaN(formData.salary)) {
      newErrors.salary = 'Salary must be a number';
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
      const token = localStorage.getItem('auth_token');
      
      // Find selected department details
      const selectedDept = departments.find(dept => dept._id === formData.department);
      
      const submitData = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        department: selectedDept ? {
          department_id: selectedDept._id,
          department_name: selectedDept.department_name
        } : null,
        jobTitle: formData.jobTitle,
        salary: parseFloat(formData.salary)
      };
      
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Employee created successfully! Temporary password: ${data.temporaryPassword}`, {
          position: "top-right",
          autoClose: 5000,
        });
        // Reset form
        setFormData({
          email: '',
          full_name: '',
          role: '',
          department: '',
          jobTitle: '',
          salary: ''
        });
      } else {
        toast.error(data.message || 'Error creating employee', {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error creating employee', {
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    toast.info('Operation cancelled', {
      position: "top-right",
    });
    navigate('/employees');
  };

  return (
    <Layout>
      <div className="add-employee-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span 
            className="breadcrumb-link" 
            onClick={() => navigate('/employees')}
          >
            All Employee
          </span>
          <span className="breadcrumb-separator"> &gt; </span>
          <span className="breadcrumb-current">Add new employee</span>
        </div>

        <div className="add-employee-card">
          <div className="tab-navigation">
            <div className="tab-list">
              <div className={`tab-item ${activeTab === 'personal' ? 'active' : ''}`} 
                   onClick={() => setActiveTab('personal')}>
                <div className="tab-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span>Personal Information</span>
              </div>
              
              <div className={`tab-item ${activeTab === 'documents' ? 'active' : ''}`}
                   onClick={() => setActiveTab('documents')}>
                <div className="tab-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6C4 3.79086 5.79086 2 8 2H15.3431C16.404 2 17.4214 2.42143 18.1716 3.17157L20.8284 5.82843C21.5786 6.57857 22 7.59599 22 8.65685V18C22 20.2091 20.2091 22 18 22H8C5.79086 22 4 20.2091 4 18V6Z" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span>Documents</span>
              </div>
            </div>
            
            <div className="tab-divider"></div>
            <div className={`tab-indicator ${activeTab === 'documents' ? 'documents-tab' : ''}`}></div>
          </div>

          <form onSubmit={handleSubmit} className="employee-form">
            {activeTab === 'personal' && (
              <div className="form-content">
                <div className="avatar-section">
                  <div className="avatar-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15 13.5C15 15.1569 13.6569 16.5 12 16.5C10.3431 16.5 9 15.1569 9 13.5C9 11.8431 10.3431 10.5 12 10.5C13.6569 10.5 15 11.8431 15 13.5Z" stroke="#16151C" strokeWidth="1.5"/>
                      <path d="M21 15.5V11.5C21 8.73858 18.7614 6.5 16 6.5H15.874C15.4299 4.77477 13.8638 3.5 12 3.5C10.1362 3.5 8.57006 4.77477 8.12602 6.5H8C5.23858 6.5 3 8.73858 3 11.5V15.5C3 18.2614 5.23858 20.5 8 20.5H16C18.7614 20.5 21 18.2614 21 15.5Z" stroke="#16151C" strokeWidth="1.5"/>
                    </svg>
                  </div>
                </div>

                <div className="form-rows">
                  {/* Row 1: Full Name và Email */}
                  <div className="form-row">
                    <div className="input-group">
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="Full name"
                        className={errors.full_name ? 'error' : ''}
                      />
                      {errors.full_name && <span className="error-text">{errors.full_name}</span>}
                    </div>
                    <div className="input-group">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Email"
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                  </div>

                  {/* Row 2: Role và Department */}
                  <div className="form-row">
                    <div className="input-group">
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className={errors.role ? 'error' : ''}
                      >
                        <option value="">Select Role</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                      </select>
                      {errors.role && <span className="error-text">{errors.role}</span>}
                    </div>
                    <div className="input-group">
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className={errors.department ? 'error' : ''}
                      >
                        <option value="">Select Department (Optional)</option>
                        {departments.map(dept => (
                          <option key={dept._id} value={dept._id}>
                            {dept.department_name}
                          </option>
                        ))}
                      </select>
                      {errors.department && <span className="error-text">{errors.department}</span>}
                    </div>
                  </div>

                  {/* Row 3: Job Title và Salary */}
                  <div className="form-row">
                    <div className="input-group">
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="Job Title"
                        className={errors.jobTitle ? 'error' : ''}
                      />
                      {errors.jobTitle && <span className="error-text">{errors.jobTitle}</span>}
                    </div>
                    <div className="input-group">
                      <input
                        type="text"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        placeholder="Salary (USD)"
                        className={errors.salary ? 'error' : ''}
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      {errors.salary && <span className="error-text">{errors.salary}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="form-content">
                <div className="documents-placeholder">
                  <div className="upload-area">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M4 6C4 3.79086 5.79086 2 8 2H15.3431C16.404 2 17.4214 2.42143 18.1716 3.17157L20.8284 5.82843C21.5786 6.57857 22 7.59599 22 8.65685V18C22 20.2091 20.2091 22 18 22H8C5.79086 22 4 20.2091 4 18V6Z" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                    <p>Upload employee documents</p>
                    <span>CV, ID Copy, Certificates, etc.</span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="btn-submit">
                {isLoading ? 'Creating...' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddNewEmployee;