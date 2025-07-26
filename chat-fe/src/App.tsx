import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ChatComponent from "./component/chat";
import Signup from "./component/signup";
import Welcome from "./component/welcome";
import Users from "./component/users";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome/>} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/users" element={<Users />} />

        <Route path="/chat/:senderId/:receiverId" element={<ChatComponent />} />
      </Routes>
    </Router>
  );
};

export default App;
