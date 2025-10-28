import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import WorkflowList from './components/WorkflowList';
import { getAllWorkflows, deleteWorkflow } from '../../service/WorkflowService';
import './css/WorkflowManagement.css';

const WorkflowManagement = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

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

  const handleCreate = () => {
    navigate('/admin/workflow/create');
  };

  const handleEdit = (workflow) => {
    navigate(`/admin/workflow/edit/${workflow._id}`);
  };

  const handleView = (workflow) => {
    navigate(`/admin/workflow/${workflow._id}`);
  };

  const handleDelete = async (workflow) => {
    try {
      await deleteWorkflow(workflow._id);
      message.success('Xóa workflow thành công');
      fetchWorkflows();
    } catch (error) {
      message.error(error.message || 'Không thể xóa workflow');
    }
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
