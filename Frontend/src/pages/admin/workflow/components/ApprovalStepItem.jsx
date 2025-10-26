import React from 'react';
import { Card, Form, Input, Select, Switch, Button, Popconfirm } from 'antd';
import { DeleteOutlined, DragOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  APPROVER_TYPES
} from '../../../../utils/workflowConstants';

const ApprovalStepItem = ({ step, onUpdate, onDelete, departments, users }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  /**
   * Get approver type info
   */
  const selectedApproverType = APPROVER_TYPES.find(
    (t) => t.value === step.approverType
  );

  /**
   * Handle field change
   */
  const handleFieldChange = (field, value) => {
    const updates = { [field]: value };
    
    // Clear dependent fields when approver type changes
    if (field === 'approverType') {
      updates.departmentId = null;
      updates.approverId = null;
    }
    
    onUpdate(updates);
  };

  /**
   * Filter users by role (only Admin/Manager can approve)
   */
  const getApproverUsers = () => {
    return users?.filter((u) => ['Admin', 'Manager'].includes(u.role)) || [];
  };

  return (
    <div ref={setNodeRef} style={style} className="approval-step-item-wrapper">
      <Card
        className="approval-step-item"
        title={
          <div className="approval-step-item__title">
            <div className="step-drag-handle" {...attributes} {...listeners}>
              <DragOutlined style={{ fontSize: '16px', cursor: 'grab' }} />
            </div>
            <span className="step-level">Bước {step.level}</span>
            <span className="step-icon">{selectedApproverType?.icon}</span>
          </div>
        }
        extra={
          <Popconfirm
            title="Xóa bước này?"
            description="Bạn có chắc chắn muốn xóa bước phê duyệt này?"
            onConfirm={onDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        }
      >
        <Form layout="vertical">
          {/* Display Name */}
          <Form.Item
            label="Tên Hiển Thị"
            required
            tooltip="Tên này sẽ hiển thị trong quy trình phê duyệt"
          >
            <Input
              placeholder="Ví dụ: Quản lý trực tiếp"
              value={step.displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
            />
          </Form.Item>

          {/* Approver Type */}
          <Form.Item
            label="Loại Người Duyệt"
            required
            tooltip="Chọn cách xác định người duyệt"
          >
            <Select
              value={step.approverType}
              onChange={(value) => handleFieldChange('approverType', value)}
              optionLabelProp="label"
            >
              {APPROVER_TYPES.map((type) => (
                <Select.Option 
                  key={type.value} 
                  value={type.value}
                  label={
                    <span>
                      {type.icon} {type.label}
                    </span>
                  }
                >
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ marginRight: '8px' }}>{type.icon}</span>
                      <strong>{type.label}</strong>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      paddingLeft: '24px',
                      lineHeight: '1.4'
                    }}>
                      {type.description}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Conditional: Department Selector */}
          {step.approverType === 'SPECIFIC_DEPARTMENT_HEAD' && (
            <Form.Item
              label="Phòng Ban"
              required
              tooltip="Chọn phòng ban để lấy trưởng phòng làm người duyệt"
            >
              <Select
                placeholder="Chọn phòng ban"
                value={step.departmentId}
                onChange={(value) => handleFieldChange('departmentId', value)}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {departments?.map((dept) => (
                  <Select.Option key={dept._id} value={dept._id}>
                    {dept.department_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Conditional: User Selector */}
          {step.approverType === 'SPECIFIC_USER' && (
            <Form.Item
              label="Người Duyệt"
              required
              tooltip="Chọn người dùng cụ thể (Admin hoặc Manager)"
            >
              <Select
                placeholder="Chọn người duyệt"
                value={step.approverId}
                onChange={(value) => handleFieldChange('approverId', value)}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {getApproverUsers().map((user) => (
                  <Select.Option key={user._id} value={user._id}>
                    {user.full_name} ({user.role})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {/* Business Rule Info for DIRECT_MANAGER */}
          {step.approverType === 'DIRECT_MANAGER' && (
            <div className="approval-step-info">
              <div className="text-muted" style={{ fontSize: '12px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                <strong>📋 Quy tắc:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li>Nếu Employee gửi đơn → Manager duyệt</li>
                  <li>Nếu Manager gửi đơn → Admin duyệt</li>
                </ul>
              </div>
            </div>
          )}

          {/* Required Toggle */}
          <Form.Item
            label="Bắt Buộc"
            tooltip="Bước này có bắt buộc phải duyệt không?"
          >
            <Switch
              checked={step.isRequired}
              onChange={(checked) => handleFieldChange('isRequired', checked)}
              checkedChildren="Có"
              unCheckedChildren="Không"
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ApprovalStepItem;
