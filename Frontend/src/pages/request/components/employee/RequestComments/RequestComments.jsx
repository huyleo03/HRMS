import React, { useState, useEffect } from "react";
import { Avatar, Button, Input, message, Empty, Spin } from "antd";
import { MessageSquare, Send, User } from "lucide-react";
import { getRequestComments, addCommentToRequest } from "../../../../../service/RequestService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { TextArea } = Input;

const RequestComments = ({ requestId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Load comments when component mounts
  useEffect(() => {
    fetchComments();
  }, [requestId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await getRequestComments(requestId);
      if (response.success) {
        setComments(response.data.comments || []);
      } else {
        message.error(response.message || "Không thể tải comments");
      }
    } catch (error) {
      console.error("Lỗi khi tải comments:", error);
      message.error("Không thể tải comments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      message.warning("Vui lòng nhập nội dung comment");
      return;
    }

    try {
      setSubmitting(true);
      const response = await addCommentToRequest(requestId, newComment);
      if (response.success) {
        message.success("Đã thêm comment");
        setNewComment("");
        // Add new comment to the list (prepend to show newest first)
        setComments([response.data.newComment, ...comments]);
      } else {
        message.error(response.message || "Không thể thêm comment");
      }
    } catch (error) {
      console.error("Lỗi khi thêm comment:", error);
      message.error("Không thể thêm comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <MessageSquare className="comments-icon" size={20} />
        <h3>Thảo luận ({comments.length})</h3>
      </div>

      {/* Comment Input Form */}
      <div className="comment-input-form">
        <TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Nhập bình luận của bạn..."
          autoSize={{ minRows: 3, maxRows: 6 }}
          disabled={submitting}
          maxLength={500}
          showCount
        />
        <Button
          type="primary"
          icon={<Send size={16} />}
          onClick={handleAddComment}
          loading={submitting}
          disabled={!newComment.trim()}
          className="comment-submit-btn"
        >
          Gửi
        </Button>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">
            <Spin tip="Đang tải comments..." />
          </div>
        ) : comments.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có bình luận nào"
          />
        ) : (
          comments.map((comment) => (
            <div key={comment.commentId} className="comment-item">
              <div className="comment-avatar">
                {comment.userAvatar ? (
                  <Avatar src={comment.userAvatar} size={40} />
                ) : (
                  <Avatar icon={<User size={20} />} size={40} style={{ backgroundColor: "#1890ff" }} />
                )}
              </div>
              <div className="comment-content">
                <div className="comment-meta">
                  <span className="comment-author">
                    {comment.userId?.full_name || comment.userName || "Unknown User"}
                  </span>
                  <span className="comment-time">
                    {dayjs(comment.createdAt).fromNow()}
                  </span>
                </div>
                <div className="comment-text">{comment.content}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequestComments;
