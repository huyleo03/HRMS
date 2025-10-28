import React from "react";
import { Card, Tag, Descriptions, Steps } from "antd";
import {
  getRequestTypeDisplay,
  getApproverTypeDisplay,
} from "../../../utils/workflowConstants";
import "../css/WorkflowDetail.css";

const WorkflowDetail = ({ workflow }) => {
  if (!workflow) {
    return <div>Loading...</div>;
  }

  return (
    <div className="workflow-detail">
      <Card title="Thông Tin Workflow" style={{ marginBottom: "24px" }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Tên Workflow" span={2}>
            <strong style={{ fontSize: "16px" }}>{workflow.name}</strong>
          </Descriptions.Item>

          <Descriptions.Item label="Mô Tả" span={2}>
            {workflow.description || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Loại Đơn">
            {getRequestTypeDisplay(workflow.requestType)}
          </Descriptions.Item>

          <Descriptions.Item label="Số Bước">
            <Tag color="blue">{workflow.approvalFlow?.length || 0} bước</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng Thái">
            <Tag color={workflow.isActive ? "green" : "red"}>
              {workflow.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Phòng Ban Áp Dụng">
            {workflow.applicableDepartments &&
            workflow.applicableDepartments.length > 0 ? (
              <div>
                {workflow.applicableDepartments.map((dept, index) => {
                  const deptName =
                    typeof dept === "object" && dept !== null
                      ? dept.department_name || dept.code || "N/A"
                      : dept;
                  const deptKey =
                    typeof dept === "object" && dept !== null
                      ? dept._id || index
                      : dept || index;

                  return (
                    <Tag key={deptKey} color="green">
                      {deptName}
                    </Tag>
                  );
                })}
              </div>
            ) : (
              <Tag color="default">Tất cả phòng ban</Tag>
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Người Tạo">
            {workflow.createdBy?.full_name || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày Tạo">
            {workflow.createdAt
              ? new Date(workflow.createdAt).toLocaleDateString("vi-VN")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Luồng Phê Duyệt">
        <Steps
          direction="vertical"
          current={-1}
          items={workflow.approvalFlow?.map((step, index) => ({
            title: (
              <div>
                <strong>
                  Bước {step.level}: {step.displayName}
                </strong>
                {step.isRequired && (
                  <Tag color="red" style={{ marginLeft: "8px" }} size="small">
                    Bắt buộc
                  </Tag>
                )}
              </div>
            ),
            description: (
              <div>
                <div style={{ marginBottom: "8px" }}>
                  {getApproverTypeDisplay(step.approverType)}
                </div>
                {step.approverType === "SPECIFIC_DEPARTMENT_HEAD" &&
                  step.departmentId && (
                    <div className="text-muted">
                      Phòng ban:{" "}
                      {typeof step.departmentId === "object"
                        ? step.departmentId.department_name || step.departmentId.code
                        : step.departmentId}
                    </div>
                  )}
                {step.approverType === "SPECIFIC_USER" && step.approverId && (
                  <div className="text-muted">
                    Người duyệt:{" "}
                    {typeof step.approverId === "object"
                      ? step.approverId.full_name || step.approverId.email
                      : step.approverId}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
};

export default WorkflowDetail;
