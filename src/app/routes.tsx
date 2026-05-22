import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Documents from "./pages/Documents";
import Students from "./pages/Students";
import Parents from "./pages/Parents";
import Contacts from "./pages/Contacts";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "about", Component: About },
      { path: "documents", Component: Documents },
      { path: "students", Component: Students },
      { path: "parents", Component: Parents },
      { path: "contacts", Component: Contacts },
    ],
  },
  {
    path: "/admin",
    children: [
      { path: "login", Component: Login },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", Component: Dashboard },
        ],
      },
    ],
  },
]);
