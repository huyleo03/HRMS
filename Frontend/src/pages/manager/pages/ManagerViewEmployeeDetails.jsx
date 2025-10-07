import React from 'react';
import ViewEmployeeDetails from '../../employee/pages/ViewEmployeeDetails';

const ManagerViewEmployeeDetails = () => {
  // Sử dụng component ViewEmployeeDetails của Admin
  // Pass props để điều chỉnh cho Manager
  return <ViewEmployeeDetails isReadOnly={true} backPath="/manager/employees" />;
};

export default ManagerViewEmployeeDetails;
