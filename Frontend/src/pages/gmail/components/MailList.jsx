import React, { useState } from "react";
import {
  CheckSquareOutlined,
  StarOutlined,
  StarFilled,
  ClockCircleOutlined,
  DeleteOutlined,
  MailOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import "../css/MailList.css";

// Mock data cho danh sách mail
const mockMails = [
  {
    id: 1,
    sender: "systemhrms1",
    subject: "OTP đổi mật khẩu",
    preview: "Mã OTP của bạn là: 13526",
    time: "02:16",
    isRead: false,
    isStarred: true,
    hasAttachment: false,
    label: "important",
  },
  {
    id: 2,
    sender: "Grammarly Insights",
    subject: "Uh-oh—you might be logged out",
    preview: "Your writing activity was quiet last week—jump back in!",
    time: "02:16",
    isRead: true,
    isStarred: false,
    hasAttachment: false,
  },
  {
    id: 3,
    sender: "Matt Palmer",
    subject: "🍁 This month's updates will make you FALL for Replit again",
    preview:
      "We launched Agent 3 with some genuinely game-changing capabilities, expanded Agent to work with any codebas...",
    time: "6 thg 10",
    isRead: true,
    isStarred: false,
    hasAttachment: false,
  },
  {
    id: 4,
    sender: "Reuters Daily Brief.",
    subject: "French government quits",
    preview:
      "Plus, how China waged an infowar against US interests. Daily Briefing Daily Briefing By Kate Turton Hello. In today's top news, the French government qui...",
    time: "6 thg 10",
    isRead: true,
    isStarred: false,
    hasAttachment: false,
  },
  {
    id: 5,
    sender: "Dat, Google, vừ",
    count: 5,
    subject: "WDP301",
    preview:
      "Hoạt động mới trong tài liệu sau WDP301 3 nhận xét 2.1 Actors Dat Nguyen Cong • 23:07, 16 thg 9 (GMT+07:00) Tạo mới đã làm Trả lời@đ 2. Product Background Dat Nguyen...",
    time: "6 thg 10",
    isRead: true,
    isStarred: false,
    hasAttachment: true,
    attachmentName: "WDP301",
  },
  {
    id: 6,
    sender: "systemhrms1",
    count: 3,
    subject: "OTP đổi mật khẩu",
    preview: "Mã OTP của bạn là: 12397",
    time: "6 thg 10",
    isRead: false,
    isStarred: false,
    hasAttachment: false,
  },
  {
    id: 7,
    sender: "Trello",
    subject: "Premium đừng thử của bạn sắp hết hạn",
    preview:
      "Dùng thử miễn phí Trello Premium của bạn sắp kết thúc ------------------ Tiếp tục làm việc thật năng suất với những tính năng tốt nhất ...",
    time: "5 thg 10",
    isRead: true,
    isStarred: false,
    hasAttachment: false,
  },
  {
    id: 9,
    sender: "Reuters Weekend Bri.",
    subject: "Trump tells Israel to stop bombing Gaza",
    preview:
      "Plus, the lap dances that led to a fraud indictment Weekend Briefing Weekend Briefing From Reuters Daily Briefing By Robert MacMillan, ...",
    time: "4 thg 10",
    isRead: true,
    isStarred: false,
    hasAttachment: false,
  },
  {
    id: 9,
    sender: "Quora Suggested Spa.",
    subject:
      "BREAKING: FBI documents from 2008 confirm that Jeffrey Epstein provided information to the FBI as part of a non-prosecution agreement with the Stat...",
    preview: "BREAKING: FB...",
    time: "4 thg 10",
    isRead: true,
    isStarred: false,
    hasAttachment: false,
  },
];


const MailList = ({ selectedMail, setSelectedMail }) => {
  const [mails, setMails] = useState(mockMails);
  const [selectedMails, setSelectedMails] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectMail = (mailId) => {
    if (selectedMails.includes(mailId)) {
      setSelectedMails(selectedMails.filter((id) => id !== mailId));
    } else {
      setSelectedMails([...selectedMails, mailId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMails([]);
    } else {
      setSelectedMails(mails.map((mail) => mail.id));
    }
    setSelectAll(!selectAll);
  };

  const handleStarToggle = (mailId, e) => {
    e.stopPropagation();
    setMails(
      mails.map((mail) =>
        mail.id === mailId ? { ...mail, isStarred: !mail.isStarred } : mail
      )
    );
  };

  const handleMailClick = (mail) => {
    setSelectedMail(mail);
    // Đánh dấu là đã đọc
    setMails(
      mails.map((m) => (m.id === mail.id ? { ...m, isRead: true } : m))
    );
  };

  const handleRefresh = () => {
    console.log("Refresh mails");
  };

  return (
    <div className="mail-list-container">
      {/* Header */}
      <div className="mail-list-header">
        <div className="mail-list-header-left">
          <div className="select-checkbox">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
          </div>
          <button className="icon-button" title="Refresh">
            <ReloadOutlined />
          </button>
          <button className="icon-button" title="More">
            <MoreOutlined />
          </button>
        </div>

        <div className="mail-list-header-right">
          <span className="mail-count">1-15 of 123</span>
          <div className="pagination-buttons">
            <button className="icon-button" disabled>
              ←
            </button>
            <button className="icon-button">→</button>
          </div>
        </div>
      </div>

      {/* Action Bar - hiện khi có mail được chọn */}
      {selectedMails.length > 0 && (
        <div className="mail-action-bar">
          <span className="selected-count">
            {selectedMails.length} selected
          </span>
          <div className="action-buttons">
            <button className="action-btn" title="Delete">
              <DeleteOutlined />
            </button>
            <button className="action-btn" title="Mark as read">
              <MailOutlined />
            </button>
            <button className="action-btn" title="Snooze">
              <ClockCircleOutlined />
            </button>
            <button className="action-btn" title="More">
              <MoreOutlined />
            </button>
          </div>
        </div>
      )}

      {/* Mail List */}
      <div className="mail-list">
        {mails.map((mail) => (
          <div
            key={mail.id}
            className={`mail-item ${!mail.isRead ? "unread" : ""} ${
              selectedMails.includes(mail.id) ? "selected" : ""
            }`}
            onClick={() => handleMailClick(mail)}
          >
            <div className="mail-checkbox">
              <input
                type="checkbox"
                checked={selectedMails.includes(mail.id)}
                onChange={() => handleSelectMail(mail.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div
              className="mail-star"
              onClick={(e) => handleStarToggle(mail.id, e)}
            >
              {mail.isStarred ? (
                <StarFilled style={{ color: "#f59e0b" }} />
              ) : (
                <StarOutlined />
              )}
            </div>

            <div className="mail-content">
              <div className="mail-sender">
                {mail.sender}
                {mail.count && (
                  <span className="mail-count-badge">{mail.count}</span>
                )}
              </div>
              <div className="mail-subject-preview">
                <span className="mail-subject">{mail.subject}</span>
                <span className="mail-preview"> - {mail.preview}</span>
              </div>
            </div>

            <div className="mail-meta">
              {mail.hasAttachment && (
                <div className="attachment-icon">
                  <PaperClipOutlined />
                </div>
              )}
              <div className="mail-time">{mail.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MailList;