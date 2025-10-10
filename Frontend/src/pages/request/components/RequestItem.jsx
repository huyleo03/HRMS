import React from "react";
import { Star, Paperclip, Calendar, Users, MoreVertical, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getStatusInfo, getPriorityColor, formatDate } from "../../../utils/requestHelpers";

const RequestItem = ({ request, isSelected, onSelect, onToggleStar }) => {
  const statusInfo = getStatusInfo(request.status);

  const StatusIcon = {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
  }[statusInfo.icon];

  return (
    <div
      className={`request-item ${!request.isRead ? "unread" : ""} ${
        isSelected ? "selected" : ""
      }`}
      onClick={() => onSelect(request)}
    >
      <div className="item-checkbox">
        <input type="checkbox" onClick={(e) => e.stopPropagation()} />
      </div>

      <div
        className={`item-star ${request.isStarred ? "starred" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(request.id);
        }}
      >
        <Star size={18} fill={request.isStarred ? "gold" : "none"} />
      </div>

      <div className="item-avatar">
        <img src={request.submittedBy.avatar} alt={request.submittedBy.name} />
      </div>

      <div className="item-content">
        <div className="item-header">
          <span className="item-sender">{request.submittedBy.name}</span>
          <span className={`badge-type type-${request.type.toLowerCase()}`}>
            {request.type}
          </span>
          <span className={`badge-priority ${getPriorityColor(request.priority)}`}>
            {request.priority}
          </span>
        </div>

        <div className="item-subject">
          <span className="subject-text">{request.subject}</span>
          {request.attachments.length > 0 && (
            <Paperclip size={14} className="attachment-icon" />
          )}
        </div>

        <div className="item-preview">{request.reason.substring(0, 80)}...</div>

        <div className="item-meta">
          <span className={`status-badge status-${statusInfo.color}`}>
            <StatusIcon size={14} />
            {statusInfo.label}
          </span>
          <span className="meta-date">
            <Calendar size={14} />
            {formatDate(request.createdAt)}
          </span>
          {request.approvalFlow.length > 1 && (
            <span className="meta-approvers">
              <Users size={14} />
              {request.approvalFlow.length} cấp
            </span>
          )}
        </div>
      </div>

      <div className="item-actions">
        <button className="btn-icon" onClick={(e) => e.stopPropagation()}>
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
};

export default RequestItem;