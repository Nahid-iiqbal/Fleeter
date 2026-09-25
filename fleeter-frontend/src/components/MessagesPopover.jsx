import React, { useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Autocomplete,
  Button,
  Divider,
  Alert,
  Avatar,
  Chip
} from "@mui/material";
import MailIcon from "@mui/icons-material/Mail";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { apiFetch } from "../utils/api";

export default function MessagesPopover() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState([]);

  const [receiverUsername, setReceiverUsername] = useState("");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState({ message: "", isError: false });


  const fetchUsers = async () => {
    try {
      const data = await apiFetch("/api/messages/users");
      setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await apiFetch("/api/messages");
      setMessages(data.messages || []);
      setUnreadCount((data.messages || []).filter(m => !m.is_read).length);
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchUsers();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setFeedback({ message: "", isError: false });
    // Mark all as read when opening
    messages.forEach(async (m) => {
      if (!m.is_read) {
        try {
          await apiFetch(`/api/messages/${m.message_id}/read`, { method: "PUT" });
        } catch (e) {}
      }
    });
    setUnreadCount(0);
  };


  const handleDelete = async (id) => {
    try {
      await apiFetch(`/api/messages/${id}`, { method: "DELETE" });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!receiverUsername || !content) return;
    try {
      await apiFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ receiver_username: receiverUsername, content }),
      });
      setFeedback({ message: "Message sent!", isError: false });
      setReceiverUsername("");
      setContent("");
      fetchMessages();
    } catch (err) {
      setFeedback({ message: err.message || "User not found", isError: true });
    }
  };

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Badge badgeContent={unreadCount} color="error">
          <MailIcon fontSize="small" />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 350, maxHeight: 500, display: "flex", flexDirection: "column" }}>
          <Box sx={{ p: 2, bgcolor: "primary.main", color: "primary.contrastText" }}>
            <Typography variant="subtitle1" fontWeight={700}>Messages</Typography>
          </Box>

          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 1 }}>
              NEW MESSAGE
            </Typography>
            <form onSubmit={handleSend}>
              <Autocomplete
                size="small"
                fullWidth
                options={users}
                getOptionLabel={(option) => option.username}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography variant="body2">{option.username}</Typography>
                    <Chip label={option.role} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                  </Box>
                )}
                value={users.find(u => u.username === receiverUsername) || null}
                onChange={(event, newValue) => {
                  setReceiverUsername(newValue ? newValue.username : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Search user..." required sx={{ mb: 1 }} />
                )}
              />
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="Type your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 1 }}
                required
              />
              <Button type="submit" variant="contained" fullWidth size="small" endIcon={<SendIcon />}>
                Send
              </Button>
            </form>
            {feedback.message && (
              <Alert severity={feedback.isError ? "error" : "success"} sx={{ mt: 1, py: 0 }}>
                {feedback.message}
              </Alert>
            )}
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 0 }}>
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center", fontStyle: "italic" }}>
                No messages yet.
              </Typography>
            ) : (
              <List disablePadding>
                {messages.map((m, i) => (
                  <React.Fragment key={m.message_id}>
                    {i > 0 && <Divider />}
                    <ListItem sx={{ alignItems: "flex-start", py: 1.5, bgcolor: m.is_read ? "transparent" : "action.hover", position: "relative", "&:hover .delete-btn": { opacity: 1 } }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: "primary.main", fontSize: "0.85rem", fontWeight: 700 }}>
                        {m.sender_username.charAt(0).toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>{m.sender_username}</Typography>
                            <Chip label={m.sender_role} size="small" sx={{ height: 16, fontSize: "0.6rem" }} />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.primary" sx={{ mt: 0.5, pr: 3 }}>
                              {m.content}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              {new Date(m.sent_at).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                      <IconButton
                        className="delete-btn"
                        size="small"
                        color="error"
                        onClick={() => handleDelete(m.message_id)}
                        sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", opacity: 0, transition: "opacity 0.2s" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
