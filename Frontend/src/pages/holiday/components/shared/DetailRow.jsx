import React from "react";
import "../../css/HolidayModal.css";

/**
 * DetailRow - Reusable detail display component
 * Used to show label-value pairs consistently
 * NOTE: Keeps "detail-row-huyleo" className for custom CSS (do not change!)
 */
const DetailRow = ({ label, value, children }) => {
  return (
    <div className="detail-row-huyleo">
      <span className="detail-label">{label}</span>
      {children ? (
        children
      ) : (
        <span className="detail-value">{value}</span>
      )}
    </div>
  );
};

export default DetailRow;
