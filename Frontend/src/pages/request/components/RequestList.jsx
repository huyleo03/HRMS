import React from "react";
import RequestItem from "./RequestItem";
import EmptyState from "./EmptyState";

const RequestList = ({
  requests,
  selectedRequest,
  onSelectRequest,
  onToggleStar,
  hasSelectedRequest,
}) => {
  return (
    <div className={`request-list ${hasSelectedRequest ? "compact" : "full"}`}>
      <div className="list-header">
        <h3>Hộp thư đến ({requests.length})</h3>
      </div>

      {requests.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="list-items">
          {requests.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              isSelected={selectedRequest?.id === request.id}
              onSelect={onSelectRequest}
              onToggleStar={onToggleStar}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestList;