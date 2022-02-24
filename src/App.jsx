import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/index";
import Docs from "./pages/api/docs";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/api/docs" element={<Docs />} />
    </Routes>
  );
}

export default App;
