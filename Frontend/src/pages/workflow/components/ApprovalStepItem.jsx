import React from 'react';
import { Card, Input, Select, Switch, Button, Popconfirm } from 'antd';
import { DeleteOutlined, DragOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { APPROVER_TYPES } from '../../../utils/workflowConstants';

const ApprovalStepItem = ({ step, onUpdate, onDelete, departments, users }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const selectedApproverType = APPROVER_TYPES.find((t) => t.value === step.approverType);
  
  const handleFieldChange = (field, value) => {
    const updates = { [field]: value };
    if (field === 'approverType') {
      updates.departmentId = null;
      updates.approverId = null;
    }
    onUpdate(updates);
  };
  
  const getApproverUsers = () => users?.filter((u) => ['Admin', 'Manager'].includes(u.role)) || [];
  
  return (
    <div ref={setNodeRef} style={style} className="approval-step-item-wrapper">
      <Card className="approval-step-item" title={<div className="approval-step-item__title"><div className="step-drag-handle" {...attributes} {...listeners}><DragOutlined style={{ fontSize: '16px', cursor: 'grab' }} /></div><span className="step-level">Bước {step.level}</span><span className="step-icon">{selectedApproverType?.icon}</span></div>} extra={<Popconfirm title="Xóa bước này?" description="Bạn có chắc chắn muốn xóa bước phê duyệt này?" onConfirm={onDelete} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}><Button type="text" danger size="small" icon={<DeleteOutlined />} /></Popconfirm>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tên Hiển Thị <span style={{ color: 'red' }}>*</span></label><Input placeholder="Ví dụ: Quản lý trực tiếp" value={step.displayName} onChange={(e) => handleFieldChange('displayName', e.target.value)} /></div>
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Loại Người Duyệt <span style={{ color: 'red' }}>*</span></label><Select style={{ width: '100%' }} value={step.approverType} onChange={(value) => handleFieldChange('approverType', value)} optionLabelProp="label">{APPROVER_TYPES.map((type) => (<Select.Option key={type.value} value={type.value} label={<span>{type.icon} {type.label}</span>}><div style={{ padding: '4px 0' }}><div style={{ marginBottom: '4px' }}><span style={{ marginRight: '8px' }}>{type.icon}</span><strong>{type.label}</strong></div><div style={{ fontSize: '12px', color: '#8c8c8c', paddingLeft: '24px', lineHeight: '1.4' }}>{type.description}</div></div></Select.Option>))}</Select></div>
          {step.approverType === 'SPECIFIC_DEPARTMENT_HEAD' && (<div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Phòng Ban <span style={{ color: 'red' }}>*</span></label><Select style={{ width: '100%' }} placeholder="Chọn phòng ban" value={step.departmentId || undefined} onChange={(value) => handleFieldChange('departmentId', value)} showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>{departments?.map((dept) => (<Select.Option key={dept._id} value={dept._id}>{dept.department_name}</Select.Option>))}</Select></div>)}
          {step.approverType === 'SPECIFIC_USER' && (<div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Người Duyệt <span style={{ color: 'red' }}>*</span></label><Select style={{ width: '100%' }} placeholder="Chọn người duyệt" value={step.approverId || undefined} onChange={(value) => handleFieldChange('approverId', value)} showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>{getApproverUsers().map((user) => (<Select.Option key={user._id} value={user._id}>{user.full_name} ({user.role})</Select.Option>))}</Select></div>)}
          {step.approverType === 'DIRECT_MANAGER' && (<div><div style={{ fontSize: '12px', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}><strong> Quy tắc:</strong><ul style={{ margin: '4px 0 0 16px', padding: 0 }}><li>Nếu Employee gửi đơn  Manager duyệt</li><li>Nếu Manager gửi đơn  Admin duyệt</li></ul></div></div>)}
          <div><label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Bắt Buộc</label><Switch checked={step.isRequired} onChange={(checked) => handleFieldChange('isRequired', checked)} checkedChildren="Có" unCheckedChildren="Không" /></div>
        </div>
      </Card>
    </div>
  );
};

export default ApprovalStepItem;
