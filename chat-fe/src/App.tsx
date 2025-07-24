import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ChatComponent from "./component/chat";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Example URL: /chat/senderId/receiverId */}
        <Route path="/chat/:senderId/:receiverId" element={<ChatComponent />} />
      </Routes>
    </Router>
  );
};

export default App;
