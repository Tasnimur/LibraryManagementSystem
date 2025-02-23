import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Book, Borrowing } from '../types';
import { BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, role , isLoading: isAuthLoading } = useAuth();
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent books

        if (!user?.id) return;


        const { data: books } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (books) setRecentBooks(books);

        // Fetch user's borrowings
        if (role === 'student') {
          const { data: userBorrowings } = await supabase
            .from('borrowings')
            .select('*, book:books(*)')
            .eq('user_id', user.id) // Use user.id directly
            .eq('status', 'borrowed')
            .order('due_date', { ascending: true });
  
          setBorrowings(userBorrowings || []);
        }
  
        setRecentBooks(books || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, role]);

  if (isAuthLoading || loading) {
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
          Welcome back, {user?.email}
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your library activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Books</h2>
          </div>
          <div className="mt-4 space-y-4">
            {recentBooks.map((book) => (
              <div key={book.id} className="border-b pb-4 last:border-0">
                <h3 className="font-medium text-gray-900">{book.title}</h3>
                <p className="text-sm text-gray-500">by {book.author}</p>
              </div>
            ))}
          </div>
        </div>

        {role === 'student' && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Current Borrowings</h2>
              </div>
              <div className="mt-4 space-y-4">
                {borrowings.map((borrowing) => (
                  <div key={borrowing.id} className="border-b pb-4 last:border-0">
                    <h3 className="font-medium text-gray-900">{borrowing.book.title}</h3>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(borrowing.due_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-8 w-8 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">Reminders</h2>
              </div>
              <div className="mt-4">
                {borrowings.some(b => new Date(b.due_date) < new Date()) ? (
                  <p className="text-red-600">
                    You have overdue books! Please return them as soon as possible.
                  </p>
                ) : (
                  <p className="text-gray-600">No overdue books. Keep it up!</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}