export interface User {
  id: string;
  email: string;
  role: 'student' | 'librarian';
  full_name: string;
  user_id: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  quantity: number;
  available_quantity: number;
  created_at: string;
}

export interface Borrowing {
  user: any;
  id: string;
  user_id: string;
  book_id: string;
  borrow_date: string;
  due_date: string;
  return_date?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  book: Book;
}

export interface Reservation {
  id: string;
  user_id: string;
  book_id: string;
  reservation_date: string;
  status: 'pending' | 'approved' | 'cancelled';
  book: Book;
}