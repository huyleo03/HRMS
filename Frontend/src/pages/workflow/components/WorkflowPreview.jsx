import React from 'react';
import { Modal, Steps, Tag, Descriptions, Alert, Divider } from 'antd';
import { 
  REQUEST_TYPES, 
  APPROVER_TYPES
} from '../../../utils/workflowConstants';

const WorkflowPreview = ({ visible, onClose, workflow, departments, users }) => {
  if (!workflow) {
    return null;
  }

  /**
   * Get approver type display with icon
   */
  const getApproverTypeDisplay = (step) => {
    const approverType = APPROVER_TYPES.find(t => t.value === step.approverType);
    if (!approverType) return step.approverType;

    let display = `${approverType.icon} ${approverType.label}`;

    // Add specific info
    if (step.approverType === 'SPECIFIC_DEPARTMENT_HEAD' && step.departmentId) {
      const dept = departments?.find(d => d._id === step.departmentId);
      display += ` - ${dept?.name || 'N/A'}`;
    } else if (step.approverType === 'SPECIFIC_USER' && step.approverId) {
      const user = users?.find(u => u._id === step.approverId);
      display += ` - ${user?.full_name || 'N/A'}`;
    }

    return display;
  };

  /**
   * Get department names
   */
  const getDepartmentNames = () => {
    if (!workflow.applicableDepartments || workflow.applicableDepartments.length === 0) {
      return 'Tất cả phòng ban';
    }
    return workflow.applicableDepartments
      .map(deptId => {
        const dept = departments?.find(d => d._id === deptId);
        return dept?.name || deptId;
      })
      .join(', ');
  };

  /**
   * Get request type info
   */
  const getRequestTypeInfo = () => {
    const type = REQUEST_TYPES.find(t => t.value === workflow.requestType);
    return type || { value: workflow.requestType, label: workflow.requestType, icon: '📋' };
  };

  const requestTypeInfo = getRequestTypeInfo();

  return (
    <Modal
      title="👁️ Xem Trước Workflow"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      className="workflow-preview-modal"
    >
      <div className="workflow-preview">
        {/* Warning Alert */}
        <Alert
          message="Đây là bản xem trước"
          description="Workflow chưa được lưu. Vui lòng kiểm tra kỹ trước khi lưu."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {/* Basic Information */}
        <Descriptions 
          bordered 
          column={2}
          size="middle"
          styles={{ label: { fontWeight: 600, background: '#fafafa' } }}
        >
          <Descriptions.Item label="Tên Workflow" span={2}>
            <strong style={{ fontSize: '16px' }}>{workflow.name}</strong>
          </Descriptions.Item>
          
          <Descriptions.Item label="Mô Tả" span={2}>
            {workflow.description || <span className="text-muted">Không có mô tả</span>}
          </Descriptions.Item>
          
          <Descriptions.Item label="Loại Đơn">
            <span style={{ fontSize: '15px' }}>
              {requestTypeInfo.icon} {requestTypeInfo.label}
            </span>
          </Descriptions.Item>
          
          <Descriptions.Item label="Số Bước">
            <Tag color="blue" style={{ fontSize: '14px' }}>
              {workflow.approvalFlow?.length || 0} bước
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Phòng Ban Áp Dụng" span={2}>
            {getDepartmentNames()}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">
          <strong>🔄 Luồng Phê Duyệt Chi Tiết</strong>
        </Divider>

        {/* Approval Flow Steps */}
        {workflow.approvalFlow && workflow.approvalFlow.length > 0 ? (
          <Steps
            direction="vertical"
            current={-1}
            style={{ marginTop: '24px' }}
            items={workflow.approvalFlow.map((step, index) => ({
              title: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '15px' }}>
                    Bước {step.level}: {step.displayName}
                  </strong>
                  {step.isRequired && (
                    <Tag color="red" size="small">
                      Bắt buộc
                    </Tag>
                  )}
                </div>
              ),
              description: (
                <div style={{ paddingTop: '8px' }}>
                  <div style={{ 
                    padding: '12px', 
                    background: '#f0f0f0', 
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}>
                    <strong>Loại người duyệt:</strong>
                    <div style={{ marginTop: '4px', fontSize: '14px' }}>
                      {getApproverTypeDisplay(step)}
                    </div>
                  </div>

                  {/* Business Rule Info for DIRECT_MANAGER */}
                  {step.approverType === 'DIRECT_MANAGER' && (
                    <div style={{ 
                      padding: '8px 12px', 
                      background: '#e6f7ff', 
                      borderLeft: '3px solid #1890ff',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <strong>📋 Quy tắc tự động:</strong>
                      <ul style={{ margin: '4px 0 0 16px', paddingLeft: '0' }}>
                        <li>Employee gửi đơn → Manager của họ duyệt</li>
                        <li>Manager gửi đơn → Admin duyệt</li>
                      </ul>
                    </div>
                  )}
                </div>
              ),
              status: 'wait',
            }))}
          />
        ) : (
          <Alert
            message="Chưa có bước phê duyệt"
            description="Vui lòng thêm ít nhất một bước phê duyệt"
            type="warning"
            showIcon
          />
        )}

        {/* Summary Info */}
        <Divider />
        <div style={{ 
          padding: '16px', 
          background: '#f0f8ff', 
          borderRadius: '8px',
          border: '1px solid #d6e4ff'
        }}>
          <div style={{ fontSize: '13px', color: '#595959' }}>
            <div>💡 <strong>Lưu ý:</strong></div>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Workflow sẽ được áp dụng ngay sau khi tạo</li>
              <li>Người gửi đơn phải hoàn thành tất cả các bước có đánh dấu "Bắt buộc"</li>
              <li>Thứ tự các bước theo level từ nhỏ đến lớn</li>
              <li>Có thể chỉnh sửa workflow sau khi tạo</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WorkflowPreview;
