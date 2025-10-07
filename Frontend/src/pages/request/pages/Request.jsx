import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import MailList from "../components/MailList";
import "../css/Request.css";

const Request = () => {
  const [selectedMail, setSelectedMail] = useState(null);

  return (
    <div className="request-page">
      <div className="request-layout">
        <Sidebar />
        <MailList 
          selectedMail={selectedMail} 
          setSelectedMail={setSelectedMail} 
        />
      </div>
    </div>
  );
};

export default Request;