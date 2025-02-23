import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import SearchBooks from "./pages/SearchBooks";
import BorrowingHistory from "./pages/BorrowingHistory";
import Profile from "./pages/Profile";
import ManageCatalog from "./pages/ManageCatalog";
import ManageBorrows from "./pages/ManageBorrows";
import ManageUsers from "./pages/ManageUsers";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/" 
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route
            index
            element={
              role === 'librarian' ? <LibrarianDashboard /> : <Dashboard />
            }
          />
          <Route path="search" element={<SearchBooks />} />
          <Route path="history" element={<BorrowingHistory />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="manage-catalog" element={<ManageCatalog />} />
          <Route path="manage-borrows" element={<ManageBorrows />} />
          <Route path="manage-users" element={<ManageUsers />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;