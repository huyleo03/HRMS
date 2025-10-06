import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Button, Statistic, Table, Tag, DatePicker, Space, Typography } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// Dữ liệu mẫu
const mockHistoryData = [
  {
    key: '1',
    date: '2025-10-01',
    checkIn: '08:25',
    checkOut: '17:35',
    totalHours: 8.1,
    status: 'present',
  },
  {
    key: '2',
    date: '2025-10-02',
    checkIn: '08:45',
    checkOut: '17:30',
    totalHours: 7.75,
    status: 'late',
  },
  {
    key: '3',
    date: '2025-10-03',
    checkIn: '08:30',
    checkOut: '17:40',
    totalHours: 8.1,
    status: 'present',
  },
  {
    key: '4',
    date: '2025-10-04',
    checkIn: null,
    checkOut: null,
    totalHours: 0,
    status: 'absent',
  },
];

const columns = [
  { title: 'Ngày', dataIndex: 'date', key: 'date' },
  { title: 'Giờ vào', dataIndex: 'checkIn', key: 'checkIn' },
  { title: 'Giờ ra', dataIndex: 'checkOut', key: 'checkOut' },
  { title: 'Tổng giờ', dataIndex: 'totalHours', key: 'totalHours' },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: status => {
      let color = 'green';
      let text = 'Đúng giờ';
      if (status === 'late') {
        color = 'orange';
        text = 'Đi muộn';
      }
      if (status === 'absent') {
        color = 'red';
        text = 'Vắng';
      }
      return <Tag color={color}>{text}</Tag>;
    },
  },
];

const EmployeeAttendancePage = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [workingTime, setWorkingTime] = useState(0);

  // Tính thời gian làm việc real-time
  useEffect(() => {
    let interval;
    if (isCheckedIn && checkInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = (now - checkInTime) / 1000 / 60 / 60; // Tính theo giờ
        setWorkingTime(diff.toFixed(2));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCheckedIn, checkInTime]);

  const handleCheckIn = () => {
    const now = new Date();
    setCheckInTime(now);
    setIsCheckedIn(true);
    // TODO: Gọi API để lưu check-in
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    // TODO: Gọi API để lưu check-out
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Content style={{ padding: '24px' }}>
      <Title level={2}>Chấm công</Title>

      {/* 1. Khu vực Check-in/Check-out */}
      <Card style={{ marginBottom: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div style={{ color: 'white' }}>
          <ClockCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <Title level={3} style={{ color: 'white', margin: 0 }}>{getCurrentTime()}</Title>
          <Text style={{ color: 'white', fontSize: '16px' }}>{getCurrentDate()}</Text>
          
          <div style={{ margin: '24px 0' }}>
            {isCheckedIn ? (
              <div>
                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text strong style={{ color: 'white' }}>Đã check-in lúc: {checkInTime?.toLocaleTimeString('vi-VN')}</Text>
                  <br />
                  <Text style={{ color: 'white' }}>Thời gian làm việc: {workingTime} giờ</Text>
                </div>
              </div>
            ) : (
              <div>
                <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                <div style={{ marginTop: '8px' }}>
                  <Text style={{ color: 'white' }}>Bạn chưa check-in hôm nay</Text>
                </div>
              </div>
            )}
          </div>

          {!isCheckedIn ? (
            <Button 
              type="primary" 
              size="large" 
              onClick={handleCheckIn}
              style={{ width: '200px', height: '50px', fontSize: '18px', background: '#52c41a', borderColor: '#52c41a' }}
            >
              Check-in
            </Button>
          ) : (
            <Button 
              danger 
              size="large" 
              onClick={handleCheckOut}
              style={{ width: '200px', height: '50px', fontSize: '18px' }}
            >
              Check-out
            </Button>
          )}
        </div>
      </Card>

      {/* 2. Thống kê tháng này */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tổng ngày làm việc" 
              value={20} 
              suffix="/ 22 ngày"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Tổng giờ làm việc" 
              value={160} 
              suffix="giờ"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Số lần đi muộn" 
              value={2} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Số ngày nghỉ" 
              value={1} 
            />
          </Card>
        </Col>
      </Row>

      {/* 3. Lịch sử chấm công */}
      <Card>
        <Space style={{ marginBottom: '16px' }}>
          <Text strong>Lịch sử chấm công</Text>
          <RangePicker placeholder={['Từ ngày', 'Đến ngày']} />
        </Space>
        <Table 
          columns={columns} 
          dataSource={mockHistoryData}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Content>
  );
};

export default EmployeeAttendancePage;