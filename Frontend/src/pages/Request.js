import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CloseIcon from "@mui/icons-material/Close";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertLinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import ImageIcon from "@mui/icons-material/Image";
import LockIcon from "@mui/icons-material/Lock";
import ScheduleSendIcon from "@mui/icons-material/ScheduleSend";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";

export default function Request({ open, onClose }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    console.log({ to, subject, message });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        style: {
          borderRadius: "12px",
          bottom: 0,
          right: 0,
          position: "fixed",
          margin: 0,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "grey.100",
          p: 1.5,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          New Message
        </Typography>
        <Box>
          <IconButton size="small">
            <MinimizeIcon />
          </IconButton>
          <IconButton size="small">
            <CropSquareIcon />
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Nội dung */}
      <DialogContent dividers>
        <TextField
          fullWidth
          margin="dense"
          label="To"
          variant="standard"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Subject"
          variant="standard"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Message"
          variant="standard"
          multiline
          rows={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{ justifyContent: "space-between", px: 2, bgcolor: "grey.50" }}
      >
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: "20px", px: 3 }}
          onClick={handleSend}
        >
          Send
        </Button>
        <Box>
          <IconButton size="small">
            <AttachFileIcon />
          </IconButton>
          <IconButton size="small">
            <InsertLinkIcon />
          </IconButton>
          <IconButton size="small">
            <EmojiEmotionsIcon />
          </IconButton>
          <IconButton size="small">
            <ImageIcon />
          </IconButton>
          <IconButton size="small">
            <LockIcon />
          </IconButton>
          <IconButton size="small">
            <ScheduleSendIcon />
          </IconButton>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
