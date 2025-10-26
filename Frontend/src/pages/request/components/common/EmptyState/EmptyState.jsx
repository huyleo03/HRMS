import React from "react";
import { Mail } from "lucide-react";

const EmptyState = ({ message = "Không có đơn nào" }) => {
  return (
    <div className="empty-state">
      <Mail size={48} />
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;