import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Spin, Divider } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import ApprovalStepBuilder from './components/ApprovalStepBuilder';
import WorkflowPreview from './components/WorkflowPreview';
import { 
  getAllWorkflows, 
  createWorkflow, 
  updateWorkflow 
} from '../../service/WorkflowService';
import { getDepartmentOptions } from '../../service/DepartmentService';
import { getApprovers } from '../../service/UserService';
import { REQUEST_TYPES, validateApprovalFlow } from '../../utils/workflowConstants';
import './css/WorkflowForm.css';

const WorkflowForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Get token from localStorage
  const token = localStorage.getItem('auth_token');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [usedRequestTypes, setUsedRequestTypes] = useState([]);

  useEffect(() => {
    fetchDependencies();
    if (isEditMode) {
      fetchWorkflow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /**
   * Fetch all dependencies (departments, users, existing workflows)
   */
  const fetchDependencies = async () => {
    try {
      const [deptsRes, approversRes, workflowsRes] = await Promise.all([
        getDepartmentOptions(token),
        getApprovers(),
        getAllWorkflows(),
      ]);
      
      // Handle department response
      if (deptsRes && deptsRes.success && Array.isArray(deptsRes.data)) {
        setDepartments(deptsRes.data);
      } else {
        setDepartments([]);
      }
      
      // Handle approvers response (Admin + Manager only)
      if (approversRes && approversRes.success && Array.isArray(approversRes.data)) {
        setUsers(approversRes.data);
      } else {
        setUsers([]);
      }
      
      // Get used request types (exclude current workflow if editing)
      const workflows = workflowsRes.data || [];
      const used = workflows
        .filter(w => !isEditMode || w._id !== id)
        .map(w => w.requestType);
      setUsedRequestTypes(used);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      message.error('Không thể tải dữ liệu');
    }
  };

  /**
   * Fetch workflow data for editing
   */
  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const response = await getAllWorkflows();
      const workflow = response.data?.find(w => w._id === id);
      
      if (!workflow) {
        message.error('Không tìm thấy workflow');
        navigate('/admin/workflow');
        return;
      }
      
      form.setFieldsValue({
        name: workflow.name,
        description: workflow.description,
        requestType: workflow.requestType,
        applicableDepartments: workflow.applicableDepartments?.map(d => 
          typeof d === 'object' ? d._id : d
        ),
      });

      // Convert approval flow to have temporary IDs
      const stepsWithIds = workflow.approvalFlow.map((step, index) => ({
        ...step,
        id: `step-${index}`,
        // Keep ObjectId references as strings
        departmentId: step.departmentId?._id || step.departmentId,
        approverId: step.approverId?._id || step.approverId,
      }));
      setApprovalSteps(stepsWithIds);
    } catch (error) {
      message.error(error.message || 'Không thể tải workflow');
      navigate('/admin/workflow');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (values) => {
    // Validate approval flow
    const validation = validateApprovalFlow(approvalSteps);
    if (!validation.isValid) {
      message.error('Luồng phê duyệt không hợp lệ');
      validation.errors.forEach(err => message.error(err));
      return;
    }

    setSubmitting(true);
    try {
      // Prepare workflow data
      const workflowData = {
        name: values.name,
        description: values.description || '',
        requestType: values.requestType,
        applicableDepartments: values.applicableDepartments || [],
        approvalFlow: approvalSteps.map(({ id, ...step }) => ({
          level: step.level,
          approverType: step.approverType,
          displayName: step.displayName,
          isRequired: step.isRequired,
          // Only include if set
          ...(step.departmentId && { departmentId: step.departmentId }),
          ...(step.approverId && { approverId: step.approverId }),
        })),
      };

      if (isEditMode) {
        await updateWorkflow(id, workflowData);
        message.success('Cập nhật workflow thành công');
      } else {
        await createWorkflow(workflowData);
        message.success('Tạo workflow thành công');
      }

      navigate('/admin/workflow');
    } catch (error) {
      message.error(error.message || 'Không thể lưu workflow');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle preview
   */
  const handlePreview = () => {
    const validation = validateApprovalFlow(approvalSteps);
    if (!validation.isValid) {
      message.warning('Vui lòng hoàn thành cấu hình luồng phê duyệt trước');
      return;
    }
    setShowPreview(true);
  };

  /**
   * Filter available request types (exclude used ones)
   */
  const getAvailableRequestTypes = () => {
    return REQUEST_TYPES.filter(
      type => !usedRequestTypes.includes(type.value)
    );
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="workflow-form">
      <div className="workflow-form__header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/workflow')}
        >
          Quay lại
        </Button>
        <h1>{isEditMode ? 'Chỉnh Sửa Workflow' : 'Tạo Workflow Mới'}</h1>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="workflow-form__content"
      >
        {/* Basic Information Card */}
        <Card title="📋 Thông Tin Cơ Bản" className="workflow-form__card">
          <Form.Item
            label="Tên Workflow"
            name="name"
            rules={[
              { required: true, message: 'Vui lòng nhập tên workflow' },
              { max: 100, message: 'Tên workflow không quá 100 ký tự' },
              { min: 5, message: 'Tên workflow ít nhất 5 ký tự' },
            ]}
          >
            <Input 
              placeholder="Ví dụ: Quy trình phê duyệt nghỉ phép" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Mô Tả"
            name="description"
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả chi tiết về quy trình phê duyệt này..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            label="Loại Đơn Áp Dụng"
            name="requestType"
            rules={[{ required: true, message: 'Vui lòng chọn loại đơn' }]}
            tooltip="Mỗi loại đơn chỉ có thể có một workflow"
          >
            <Select 
              placeholder="Chọn loại đơn" 
              size="large"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {getAvailableRequestTypes().map(type => (
                <Select.Option key={type.value} value={type.value}>
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Áp Dụng Cho Phòng Ban"
            name="applicableDepartments"
            tooltip="Để trống để áp dụng cho tất cả phòng ban"
          >
            <Select
              mode="multiple"
              placeholder="Chọn phòng ban (để trống = tất cả)"
              allowClear
              size="large"
              maxTagCount="responsive"
            >
              {departments && departments.length > 0 ? (
                departments.map(dept => (
                  <Select.Option key={dept._id} value={dept._id}>
                    {dept.department_name}
                  </Select.Option>
                ))
              ) : (
                <Select.Option disabled value="loading">Đang tải...</Select.Option>
              )}
            </Select>
          </Form.Item>
        </Card>

        <Divider />

        {/* Approval Flow Card */}
        <Card title="🔄 Luồng Phê Duyệt" className="workflow-form__card">
          <ApprovalStepBuilder
            steps={approvalSteps}
            onChange={setApprovalSteps}
            departments={departments}
            users={users}
          />
        </Card>

        {/* Actions */}
        <div className="workflow-form__actions">
          <Button
            size="large"
            onClick={() => navigate('/admin/workflow')}
          >
            Hủy
          </Button>
          <Button
            size="large"
            icon={<EyeOutlined />}
            onClick={handlePreview}
            disabled={approvalSteps.length === 0}
          >
            Xem Trước
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={submitting}
            size="large"
          >
            {isEditMode ? 'Cập Nhật Workflow' : 'Tạo Workflow'}
          </Button>
        </div>
      </Form>

      {/* Preview Modal */}
      {showPreview && (
        <WorkflowPreview
          visible={showPreview}
          onClose={() => setShowPreview(false)}
          workflow={{
            ...form.getFieldsValue(),
            approvalFlow: approvalSteps,
          }}
          departments={departments}
          users={users}
        />
      )}
    </div>
  );
};

export default WorkflowForm;
