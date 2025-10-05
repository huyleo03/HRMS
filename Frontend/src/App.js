import React, { useState } from "react";
import Request from "./pages/Request";
import { Button, Box } from "@mui/material";

function App() {
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button variant="contained" onClick={() => setOpen(true)}>
        New Request
      </Button>
      <Request open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

export default App;
