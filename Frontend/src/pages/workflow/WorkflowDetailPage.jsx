import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Spin, Space, Popconfirm } from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined
} from '@ant-design/icons';
import WorkflowDetail from './components/WorkflowDetail';
import { getWorkflowById, deleteWorkflow } from '../../service/WorkflowService';
import './css/WorkflowDetailPage.css';

const WorkflowDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkflowDetail = async () => {
    setLoading(true);
    try {
      const response = await getWorkflowById(id);
      setWorkflow(response.data);
    } catch (error) {
      message.error(error.message || 'Không thể tải thông tin workflow');
      setTimeout(() => navigate('/admin/workflow'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBack = () => {
    navigate('/admin/workflow');
  };

  const handleEdit = () => {
    navigate(`/admin/workflow/edit/${id}`);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteWorkflow(id);
      message.success('Xóa workflow thành công');
      navigate('/admin/workflow');
    } catch (error) {
      message.error(error.message || 'Không thể xóa workflow');
    }
  };

  if (loading) {
    return (
      <div className="workflow-detail-page__loading">
        <Spin size="large" tip="Đang tải thông tin workflow..." />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="workflow-detail-page__error">
        <p>Không tìm thấy workflow</p>
        <Button onClick={handleBack}>Quay lại danh sách</Button>
      </div>
    );
  }

  return (
    <div className="workflow-detail-page">
      <div className="workflow-detail-page__header">
        <div className="workflow-detail-page__header-left">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: '16px' }}
          >
            Quay lại
          </Button>
          <div>
            <h1 className="workflow-detail-page__title">{workflow.name}</h1>
            <p className="workflow-detail-page__subtitle">Chi tiết thông tin workflow</p>
          </div>
        </div>
        
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            Chỉnh sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa workflow"
            description={
              <>
                <div>Bạn có chắc chắn muốn xóa workflow <strong>{workflow?.name}</strong>?</div>
                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                  Workflow này sẽ bị vô hiệu hóa và không thể sử dụng nữa.
                </div>
              </>
            }
            onConfirm={handleDeleteConfirm}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <div className="workflow-detail-page__content">
        <WorkflowDetail workflow={workflow} />
      </div>
    </div>
  );
};

export default WorkflowDetailPage;
