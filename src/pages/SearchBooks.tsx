import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../types';
import { Search, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function SearchBooks() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('genre')
        .not('genre', 'is', null);

      if (error) {
        console.error('Error fetching genres:', error);
        return;
      }

      if (data) {
        const uniqueGenres = Array.from(new Set(data.map(book => book.genre)));
        setGenres(uniqueGenres);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm || selectedGenre !== 'all') {
        searchBooks();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedGenre]);

  const searchBooks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('books')
        .select('*')
        .order('title', { ascending: true });

      // Apply genre filter
      if (selectedGenre !== 'all') {
        query = query.eq('genre', selectedGenre);
      }

      // Apply search term filters
      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,isbn.eq.${searchTerm}`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error searching books:', error);
      toast.error('Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (bookId: string) => {
    try {
      // 1. Check book availability
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('available_quantity')
        .eq('id', bookId)
        .single();
  
      if (bookError) throw bookError;
  
      // 2. Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert([{ 
          user_id: user?.id, 
          book_id: bookId,
          status: book.available_quantity > 0 ? 'approved' : 'pending'
        }])
        .select()
        .single();
  
      if (reservationError) throw reservationError;
  
      // 3. If available, create borrowing immediately
      if (book.available_quantity > 0) {
        await supabase
          .from('borrowings')
          .insert([{
            user_id: user?.id,
            book_id: bookId,
            borrow_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 14 * 86400000).toISOString(), // 14 days later
            status: 'borrowed'
          }]);
  
        // Decrement available quantity using RPC
        await supabase.rpc('decrement_book_quantity', { book_id: bookId });
          
      }
  
      toast.success('Reservation successful!');
    } catch (error) {
      console.error('Reservation failed:', error);
      toast.error('Reservation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Books</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or ISBN"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{book.title}</h2>
                  <p className="text-gray-600">by {book.author}</p>
                  <p className="text-sm text-gray-500 mt-2">Genre: {book.genre}</p>
                  <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
                  <p className={`mt-2 ${book.available_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {book.available_quantity} copies available
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>

              <button
                onClick={() => handleReserve(book.id)}
                disabled={book.available_quantity === 0}
                className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {book.available_quantity === 0 ? 'Not Available' : 'Reserve'}
              </button>
            </div>
          ))}
        </div>
      )}

      {books.length === 0 && !loading && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </div>
  );
}