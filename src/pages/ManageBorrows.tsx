import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Borrowing } from "../types";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function ManageBorrows() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrowings = async () => {
      try {
        const { data, error } = await supabase
          .from("borrowings")
          .select(
            `
            id,
            book_id,
            status,
            borrow_date,
            due_date,
            user:user_id (full_name, user_id),
            book:books (title , available_quantity , author)
          `
          )
          .order("borrow_date", { ascending: false });

        if (error) throw error;
        setBorrowings(data || []);
      } catch (error) {
        console.error("Error fetching borrowings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowings();
  }, []);

  const handleReturn = async (borrowing: Borrowing) => {
    try {
      // 1. Mark the book as returned
      const { error: borrowingError } = await supabase
        .from("borrowings")
        .update({
          status: "returned",
          return_date: new Date().toISOString(),
        })
        .eq("id", borrowing.id);

      if (borrowingError) throw borrowingError;

      // 2. Increment available quantity using RPC
      await supabase.rpc("increment_book_quantity", {
        book_id: borrowing.book_id,
      });

      // 3. Approve the next reservation (if any)
      const { data: nextReservation, error: reservationError } = await supabase
        .from("reservations")
        .select("*")
        .eq("book_id", borrowing.book_id)
        .eq("status", "pending")
        .order("reservation_date", { ascending: true })
        .limit(1)
        .maybeSingle();
        
      
        if (reservationError) throw reservationError;

        if (reservations && reservations.length > 0) {
          const nextReservation = reservations[0];
          await supabase.from("borrowings").insert([{
            user_id: nextReservation.user_id,
            book_id: nextReservation.book_id,
            borrow_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
            status: "borrowed",
          }]);

        // Update reservation status to approved
        await supabase
          .from("reservations")
          .update({ status: "approved" })
          .eq("id", nextReservation.id);

        // Decrement available quantity
        await supabase.rpc("decrement_book_quantity", {
          book_id: nextReservation.book_id,
        });
      }

      toast.success("Book returned successfully");
      fetchBorrowings(); // Refresh the list
    } catch (error) {
      console.error("Return failed:", error);
      toast.error("Return failed");
    }
  };

  // Handle delete
  const handleDelete = async (borrowingId: string, bookId: string) => {
    if (!window.confirm('Are you sure you want to delete this borrowing?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('borrowings')
        .delete()
        .eq('id', borrowingId);

      if (deleteError) throw deleteError;

      await supabase.rpc('increment_book_quantity', { book_id: bookId });

      fetchBorrowings();
      toast.success('Borrowing deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Delete failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "returned":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Returned
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            Borrowed
          </span>
        );
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Manage Borrowings</h1>
        <p className="mt-2 text-gray-600">Track and manage book borrowings</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Borrow Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {borrowings.map((borrowing) => (
                <tr key={borrowing.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {borrowing.book?.title || "Unknown Book"}
                    </div>
                    <div className="text-sm text-gray-500">
                      by {borrowing.book?.author || "Unknown Author"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {borrowing.user?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {borrowing.user?.user_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(borrowing.borrow_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {borrowing.due_date
                      ? new Date(borrowing.due_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(borrowing.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {borrowing.status === "borrowed" && (
                      <button
                        onClick={() => handleReturn(borrowing)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Mark as Returned
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDelete(borrowing.id, borrowing.book_id)
                      }
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {borrowings.length === 0 && (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No borrowings
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no active or past borrowings to display.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
