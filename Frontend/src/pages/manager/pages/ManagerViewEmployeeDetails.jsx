import React from 'react';
import ViewEmployeeDetails from '../../employee/pages/ViewEmployeeDetails';

const ManagerViewEmployeeDetails = () => {
  return <ViewEmployeeDetails isReadOnly={true} backPath="/manager/employees" />;
};

export default ManagerViewEmployeeDetails;
