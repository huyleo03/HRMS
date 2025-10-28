import React from 'react';
import { Button, Empty, message, Space } from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ApprovalStepItem from './ApprovalStepItem';
import '../css/ApprovalStepBuilder.css';

const ApprovalStepBuilder = ({ steps, onChange, departments, users }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Add new approval step
   */
  const handleAddStep = () => {
    const newStep = {
      id: `step-${Date.now()}`, // Temporary ID for drag & drop
      level: steps.length + 1,
      approverType: 'DIRECT_MANAGER',
      displayName: `Bước ${steps.length + 1}`,
      isRequired: true,
    };
    onChange([...steps, newStep]);
    message.success('Đã thêm bước phê duyệt mới');
  };

  /**
   * Update a specific step
   */
  const handleUpdateStep = (stepId, updatedData) => {
    const updatedSteps = steps.map((step) =>
      step.id === stepId ? { ...step, ...updatedData } : step
    );
    onChange(updatedSteps);
  };

  /**
   * Delete a step
   */
  const handleDeleteStep = (stepId) => {
    const filteredSteps = steps.filter((step) => step.id !== stepId);
    // Re-calculate levels
    const reorderedSteps = filteredSteps.map((step, index) => ({
      ...step,
      level: index + 1,
      displayName: step.displayName.includes('Bước') 
        ? `Bước ${index + 1}` 
        : step.displayName,
    }));
    onChange(reorderedSteps);
    message.success('Đã xóa bước phê duyệt');
  };

  /**
   * Handle drag end event
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over.id);

      const reorderedSteps = arrayMove(steps, oldIndex, newIndex);

      // Re-calculate levels
      const updatedSteps = reorderedSteps.map((step, index) => ({
        ...step,
        level: index + 1,
      }));

      onChange(updatedSteps);
      message.success('Đã thay đổi thứ tự bước phê duyệt');
    }
  };

  return (
    <div className="approval-step-builder">
      <div className="approval-step-builder__header">
        <div>
          <h3>Luồng Phê Duyệt</h3>
          <p className="text-muted">
            <InfoCircleOutlined /> Kéo thả để sắp xếp lại thứ tự các bước
          </p>
        </div>
        <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddStep}>
          Thêm Bước
        </Button>
      </div>

      {steps.length === 0 ? (
        <Empty
          description="Chưa có bước phê duyệt nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStep}>
            Thêm Bước Đầu Tiên
          </Button>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="approval-steps-list">
              {steps.map((step) => (
                <ApprovalStepItem
                  key={step.id}
                  step={step}
                  onUpdate={(data) => handleUpdateStep(step.id, data)}
                  onDelete={() => handleDeleteStep(step.id)}
                  departments={departments}
                  users={users}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="approval-step-builder__info">
        <Space direction="vertical" size="small">
          <div>
            💡 <strong>Gợi ý:</strong> Kéo biểu tượng ⋮⋮ để sắp xếp lại thứ tự
          </div>
          <div>
            📌 <strong>Lưu ý:</strong> Phải có ít nhất 1 bước phê duyệt
          </div>
        </Space>
      </div>
    </div>
  );
};

export default ApprovalStepBuilder;
