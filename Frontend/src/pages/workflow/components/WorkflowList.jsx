import React, { useState, useMemo } from 'react';
import { Table, Tag, Button, Space, Tooltip, Empty, Input, Select, Popconfirm } from 'antd';
import { 
  EditOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { 
  REQUEST_TYPES, 
  getRequestTypeDisplay, 
  WORKFLOW_STATUS_LABELS 
} from '../../../utils/workflowConstants';

const { Option } = Select;

const WorkflowList = ({ workflows, loading, onEdit, onView, onDelete, onRefresh }) => {
  // State for filters and sorting
  const [searchText, setSearchText] = useState('');
  const [selectedRequestType, setSelectedRequestType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc'); // Format: 'field-direction'

  const processedWorkflows = useMemo(() => {
    let result = [...workflows];

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(workflow => 
        workflow.name?.toLowerCase().includes(searchLower) ||
        workflow.description?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedRequestType !== 'all') {
      result = result.filter(workflow => workflow.requestType === selectedRequestType);
    }

    if (selectedStatus !== 'all') {
      const isActive = selectedStatus === 'active';
      result = result.filter(workflow => workflow.isActive === isActive);
    }

    const [field, direction] = sortBy.split('-');
    result.sort((a, b) => {
      let compareResult = 0;

      switch (field) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'requestType':
          const typeA = getRequestTypeDisplay(a.requestType);
          const typeB = getRequestTypeDisplay(b.requestType);
          compareResult = typeA.localeCompare(typeB);
          break;
        case 'steps':
          compareResult = (a.approvalFlow?.length || 0) - (b.approvalFlow?.length || 0);
          break;
        case 'createdAt':
          compareResult = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
        default:
          break;
      }

      return direction === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [workflows, searchText, selectedRequestType, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedRequestType('all');
    setSelectedStatus('all');
    setSortBy('name-asc');
  };

  const getRequestTypeLabel = (type) => {
    return getRequestTypeDisplay(type);
  };

  /**
   * Table columns configuration
   */
  const columns = [
    {
      title: 'Tên Workflow',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (text, record) => (
        <div>
          <strong style={{ fontSize: '14px' }}>{text}</strong>
          {record.description && (
            <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Loại Đơn',
      dataIndex: 'requestType',
      key: 'requestType',
      width: '18%',
      render: (type) => (
        <span style={{ fontSize: '14px' }}>{getRequestTypeLabel(type)}</span>
      ),
    },
    {
      title: 'Số Bước',
      dataIndex: 'approvalFlow',
      key: 'steps',
      width: '10%',
      align: 'center',
      render: (flow) => (
        <Tag color="blue" style={{ fontSize: '13px' }}>
          {flow?.length || 0} bước
        </Tag>
      ),
    },
    {
      title: 'Phòng Ban',
      dataIndex: 'applicableDepartments',
      key: 'departments',
      width: '15%',
      render: (depts) => {
        if (!depts || depts.length === 0) {
          return <Tag color="default">Tất cả</Tag>;
        }
        return (
          <div>
            {depts.slice(0, 2).map((dept, index) => {
              // Handle both cases: dept as object or dept as ID string
              const deptName = typeof dept === 'object' && dept !== null 
                ? (dept.department_name || dept.code || 'N/A')
                : dept; // If it's a string ID, just show the ID
              const deptKey = typeof dept === 'object' && dept !== null
                ? (dept._id || index)
                : (dept || index);
              
              return (
                <Tag key={deptKey} color="green" style={{ marginBottom: '4px' }}>
                  {deptName}
                </Tag>
              );
            })}
            {depts.length > 2 && (
              <Tag color="default">+{depts.length - 2}</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: '12%',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} style={{ fontSize: '13px' }}>
          {isActive ? WORKFLOW_STATUS_LABELS.active : WORKFLOW_STATUS_LABELS.inactive}
        </Tag>
      ),
    },
    {
      title: 'Người Tạo',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: '12%',
      render: (creator) => (
        <div>
          <div style={{ fontSize: '13px' }}>{creator?.full_name || '-'}</div>
          {creator?.role && (
            <div className="text-muted" style={{ fontSize: '11px' }}>
              {creator.role}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      width: '12%',
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa workflow"
            description={
              <>
                <div>Bạn có chắc chắn muốn xóa workflow <strong>{record.name}</strong>?</div>
                <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                  Workflow này sẽ bị vô hiệu hóa và không thể sử dụng nữa.
                </div>
              </>
            }
            onConfirm={() => onDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="workflow-list">
      <div className="workflow-list__toolbar" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Input
              placeholder="Tìm kiếm theo tên hoặc mô tả workflow..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '350px', maxWidth: '100%' }}
              allowClear
            />
            <Space>
              <Button
                onClick={handleResetFilters}
                disabled={
                  searchText === '' && 
                  selectedRequestType === 'all' && 
                  selectedStatus === 'all' && 
                  sortBy === 'name-asc'
                }
              >
                Đặt lại bộ lọc
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={onRefresh}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Space size="middle">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FilterOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 500 }}>Loại đơn:</span>
                <Select
                  value={selectedRequestType}
                  onChange={setSelectedRequestType}
                  style={{ width: '200px' }}
                >
                  <Option value="all">Tất cả loại</Option>
                  {REQUEST_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FilterOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 500 }}>Trạng thái:</span>
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  style={{ width: '160px' }}
                >
                  <Option value="all">Tất cả</Option>
                  <Option value="active">Đang hoạt động</Option>
                  <Option value="inactive">Vô hiệu hóa</Option>
                </Select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SortAscendingOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 500 }}>Sắp xếp:</span>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: '200px' }}
                >
                  <Option value="name-asc">Tên A → Z</Option>
                  <Option value="name-desc">Tên Z → A</Option>
                  <Option value="requestType-asc">Loại đơn A → Z</Option>
                  <Option value="requestType-desc">Loại đơn Z → A</Option>
                  <Option value="steps-asc">Số bước tăng dần</Option>
                  <Option value="steps-desc">Số bước giảm dần</Option>
                  <Option value="createdAt-asc">Tạo cũ nhất</Option>
                  <Option value="createdAt-desc">Tạo mới nhất</Option>
                </Select>
              </div>
            </Space>
          </div>

          <div style={{ fontSize: '14px', color: '#666' }}>
            Hiển thị <strong>{processedWorkflows.length}</strong> / <strong>{workflows.length}</strong> workflows
            {(searchText || selectedRequestType !== 'all' || selectedStatus !== 'all') && (
              <span style={{ marginLeft: '8px', color: '#1890ff' }}>
                (đã lọc)
              </span>
            )}
          </div>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={processedWorkflows}
        loading={loading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} workflows`,
          pageSizeOptions: ['10', '20', '50'],
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchText || selectedRequestType !== 'all' || selectedStatus !== 'all'
                  ? "Không tìm thấy workflow nào phù hợp"
                  : "Chưa có workflow nào"
              }
            />
          ),
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default WorkflowList;
