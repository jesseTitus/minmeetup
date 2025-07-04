import React from "react";
import "./App.css";
import Home from "./Home";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GroupList from "./GroupList";
import GroupEdit from "./GroupEdit";
import GroupSelect from "./GroupSelect";
import EventList from "./EventList";
import EventEdit from "./EventEdit";
import EventDetails from "./EventDetails";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/groups" element={<GroupList />} />
        <Route path="/groups/:id" element={<GroupEdit />} />
        <Route path="/groups/:groupId/events" element={<EventList />} />
        <Route path="/groups/select" element={<GroupSelect />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/events/:id/edit" element={<EventEdit />} />
      </Routes>
    </Router>
  );
};

export default App;
