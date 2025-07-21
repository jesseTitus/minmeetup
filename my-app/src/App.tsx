import "./App.css";
import Home from "./Home";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GroupList from "./GroupList";
import GroupEdit from "./GroupEdit";
import EventList from "./EventList";
import EventEdit from "./EventEdit";
import EventDetails from "./EventDetails";
import AuthCallback from "./AuthCallback";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/groups" element={<GroupList />} />
        <Route path="/groups/new" element={<GroupEdit />} />
        <Route path="/groups/:id" element={<GroupEdit />} />
        <Route path="/groups/:groupId/events" element={<EventList />} />
        <Route path="/groups/:groupId/events/new" element={<EventEdit />} />
        <Route path="/events/:id/edit" element={<EventEdit />} />
        <Route path="/events/:id" element={<EventDetails />} />
      </Routes>
    </Router>
  );
};

export default App;
