import React, { useState, useEffect } from 'react';
import { Button, message, Modal } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import WorkflowList from './components/WorkflowList';
import { getAllWorkflows, deleteWorkflow } from '../../../service/WorkflowService';
import './css/WorkflowManagement.css';

const WorkflowManagement = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  /**
   * Fetch all workflows from API
   */
  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await getAllWorkflows();
      setWorkflows(response.data || []);
    } catch (error) {
      message.error(error.message || 'Không thể tải danh sách workflow');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to create workflow page
   */
  const handleCreate = () => {
    navigate('/admin/workflow/create');
  };

  /**
   * Navigate to edit workflow page
   * @param {Object} workflow - Workflow object to edit
   */
  const handleEdit = (workflow) => {
    navigate(`/admin/workflow/edit/${workflow._id}`);
  };

  /**
   * Navigate to view workflow detail page
   * @param {Object} workflow - Workflow object to view
   */
  const handleView = (workflow) => {
    navigate(`/admin/workflow/${workflow._id}`);
  };

  /**
   * Show delete confirmation modal and delete workflow
   * @param {Object} workflow - Workflow object to delete
   */
  const handleDelete = (workflow) => {
    Modal.confirm({
      title: 'Xác nhận xóa workflow',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa workflow <strong>{workflow.name}</strong>?</p>
          <p className="text-muted">Workflow này sẽ bị vô hiệu hóa và không thể sử dụng nữa.</p>
        </div>
      ),
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteWorkflow(workflow._id);
          message.success('Xóa workflow thành công');
          fetchWorkflows(); // Refresh list
        } catch (error) {
          message.error(error.message || 'Không thể xóa workflow');
        }
      },
    });
  };

  return (
    <div className="workflow-management">
      <div className="workflow-management__header">
        <div className="workflow-management__header-info">
          <h1>Quản lý Workflow</h1>
          <p>Cấu hình quy trình phê duyệt cho từng loại đơn</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Tạo Workflow Mới
        </Button>
      </div>

      <WorkflowList
        workflows={workflows}
        loading={loading}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onRefresh={fetchWorkflows}
      />
    </div>
  );
};

export default WorkflowManagement;
