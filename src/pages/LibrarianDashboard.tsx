// src/pages/LibrarianDashboard.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Book, Borrowing, User } from '../types';
import { BookOpen, ClipboardList, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LibrarianDashboard() {
  const { user } = useAuth();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [pendingBorrowings, setPendingBorrowings] = useState<Borrowing[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent books
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch pending borrowings
        const { data: borrowings } = await supabase
          .from('borrowings')
          .select('*, book:books(*), user:profiles(*)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch recent users
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (books) setRecentBooks(books);
        if (borrowings) setPendingBorrowings(borrowings);
        if (users) setRecentUsers(users);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Librarian Dashboard - Welcome {user?.email}
        </h1>
        <p className="mt-2 text-gray-600">
          Library management overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Books Added</h2>
          </div>
          <div className="mt-4 space-y-4">
            {recentBooks.map((book) => (
              <div key={book.id} className="border-b pb-4 last:border-0">
                <h3 className="font-medium text-gray-900">{book.title}</h3>
                <p className="text-sm text-gray-500">by {book.author}</p>
                <p className="text-sm text-gray-500">Qty: {book.available_quantity}/{book.quantity}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <ClipboardList className="h-8 w-8 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
          </div>
          <div className="mt-4 space-y-4">
            {pendingBorrowings.map((borrowing) => (
              <div key={borrowing.id} className="border-b pb-4 last:border-0">
                <h3 className="font-medium text-gray-900">{borrowing.book?.title}</h3>
                <p className="text-sm text-gray-500">Requested by: {borrowing.user?.full_name}</p>
                <p className="text-sm text-gray-500">Due: {new Date(borrowing.due_date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Users</h2>
          </div>
          <div className="mt-4 space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="border-b pb-4 last:border-0">
                <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                <p className="text-sm text-gray-500">{user.user_id}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}