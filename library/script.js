// Local Storage Management
const STORAGE_KEY = 'library_books';

class LibraryManager {
    constructor() {
        this.books = this.loadBooks();
        this.currentFilter = 'all';
        this.editingBookIndex = null;
        this.init();
    }

    loadBooks() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    saveBooks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.books));
    }

    addBook(bookData) {
        this.books.push({
            ...bookData,
            id: Date.now(),
            dateAdded: new Date().toLocaleString()
        });
        this.saveBooks();
        this.render();
    }

    updateBook(index, bookData) {
        this.books[index] = {
            ...this.books[index],
            ...bookData
        };
        this.saveBooks();
        this.render();
    }

    deleteBook(index) {
        if (confirm('Are you sure you want to delete this book?')) {
            this.books.splice(index, 1);
            this.saveBooks();
            this.render();
        }
    }

    getFilteredBooks() {
        if (this.currentFilter === 'all') {
            return this.books;
        } else if (this.currentFilter === 'owned') {
            return this.books.filter(book => !book.isWishlist);
        } else if (this.currentFilter === 'wishlist') {
            return this.books.filter(book => book.isWishlist);
        }
        return this.books;
    }

    updateStats() {
        const ownedBooks = this.books.filter(b => !b.isWishlist);
        const wishlistBooks = this.books.filter(b => b.isWishlist);
        const totalValue = ownedBooks.reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

        document.getElementById('total-books').textContent = ownedBooks.length;
        document.getElementById('wishlist-count').textContent = wishlistBooks.length;
        document.getElementById('total-value').textContent = '$' + totalValue.toFixed(2);
    }

    renderBooks() {
        const grid = document.getElementById('books-grid');
        const emptyState = document.getElementById('empty-state');
        const filtered = this.getFilteredBooks();

        grid.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach((book, index) => {
            const actualIndex = this.books.indexOf(book);
            const card = this.createBookCard(book, actualIndex);
            grid.appendChild(card);
        });
    }

    createBookCard(book, index) {
        const card = document.createElement('div');
        card.className = 'book-card';

        const location = book.location === 'other' ? book.otherLocation : this.getLocationLabel(book.location);

        card.innerHTML = `
            <div class="book-card-header">
                <div class="book-title">${this.escapeHtml(book.title)}</div>
                <div class="book-author">by ${this.escapeHtml(book.author)}</div>
            </div>
            <div class="book-card-body">
                ${book.isWishlist ? '<span class="book-badge badge-wishlist">Coming Soon</span>' : '<span class="book-badge badge-owned">In Collection</span>'}
                
                ${book.isbn ? `<div class="book-detail">
                    <span class="book-detail-label">ISBN:</span>
                    <span class="book-detail-value">${this.escapeHtml(book.isbn)}</span>
                </div>` : ''}
                
                <div class="book-price">$${parseFloat(book.price).toFixed(2)}</div>
                
                ${book.publisher ? `<div class="book-detail">
                    <span class="book-detail-label">Publisher:</span>
                    <span class="book-detail-value">${this.escapeHtml(book.publisher)}</span>
                </div>` : ''}
                
                ${book.year ? `<div class="book-detail">
                    <span class="book-detail-label">Year:</span>
                    <span class="book-detail-value">${book.year}</span>
                </div>` : ''}
                
                <div class="book-location">📍 ${this.escapeHtml(location)}</div>
                
                ${book.notes ? `<div class="book-notes">"${this.escapeHtml(book.notes)}"</div>` : ''}
                
                <div class="book-card-footer">
                    <button class="btn-edit" onclick="library.editBook(${index})">Edit</button>
                    <button class="btn-delete" onclick="library.deleteBook(${index})">Delete</button>
                </div>
            </div>
        `;

        return card;
    }

    getLocationLabel(locationCode) {
        const locations = {
            'la': 'Los Angeles, CA',
            'philly': 'Philadelphia, PA',
            'dc': 'Washington, DC',
            'other': 'Other'
        };
        return locations[locationCode] || locationCode;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderLocationTracker() {
        const section = document.getElementById('location-section');
        const tracker = document.getElementById('location-tracker');

        const locations = {};
        this.books.forEach(book => {
            const loc = book.location === 'other' ? book.otherLocation : this.getLocationLabel(book.location);
            if (!locations[loc]) {
                locations[loc] = [];
            }
            locations[loc].push(book);
        });

        tracker.innerHTML = '';
        Object.keys(locations).forEach(loc => {
            const card = document.createElement('div');
            card.className = 'location-card';

            const booksList = locations[loc]
                .map(b => `• ${this.escapeHtml(b.title)}`)
                .join('<br>');

            card.innerHTML = `
                <h3>${this.escapeHtml(loc)}</h3>
                <div class="location-book-count">${locations[loc].length} book${locations[loc].length !== 1 ? 's' : ''}</div>
                <div class="location-books-list">
                    <p>${booksList}</p>
                </div>
            `;

            tracker.appendChild(card);
        });

        section.style.display = Object.keys(locations).length > 0 ? 'block' : 'none';
    }

    editBook(index) {
        this.editingBookIndex = index;
        const book = this.books[index];

        document.getElementById('modal-title').textContent = 'Edit Book';
        document.getElementById('book-title').value = book.title;
        document.getElementById('book-author').value = book.author;
        document.getElementById('book-isbn').value = book.isbn || '';
        document.getElementById('book-price').value = book.price;
        document.getElementById('book-publisher').value = book.publisher || '';
        document.getElementById('book-year').value = book.year || '';
        document.getElementById('book-location').value = book.location;
        document.getElementById('book-other-location').value = book.otherLocation || '';
        document.getElementById('book-notes').value = book.notes || '';
        document.getElementById('book-type').checked = book.isWishlist;

        document.getElementById('book-modal').classList.remove('hidden');
    }

    render() {
        this.renderBooks();
        this.updateStats();
        this.renderLocationTracker();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;

                // Update section title and visibility
                const contentSection = document.getElementById('content-section');
                const locationSection = document.getElementById('location-section');

                if (this.currentFilter === 'locations') {
                    contentSection.style.display = 'none';
                    locationSection.classList.remove('hidden');
                } else {
                    contentSection.style.display = 'block';
                    locationSection.classList.add('hidden');

                    const titles = {
                        'all': 'My Collection',
                        'owned': 'In Collection',
                        'wishlist': 'Coming Soon'
                    };
                    document.getElementById('section-title').textContent = titles[this.currentFilter];
                }

                this.render();
            });
        });

        // Add book buttons
        document.getElementById('add-book-btn').addEventListener('click', () => {
            this.editingBookIndex = null;
            document.getElementById('modal-title').textContent = 'Add New Book';
            document.getElementById('book-form').reset();
            document.getElementById('book-type').checked = false;
            document.getElementById('book-modal').classList.remove('hidden');
        });

        document.getElementById('add-wishlist-btn').addEventListener('click', () => {
            this.editingBookIndex = null;
            document.getElementById('modal-title').textContent = 'Add to Wishlist';
            document.getElementById('book-form').reset();
            document.getElementById('book-type').checked = true;
            document.getElementById('book-modal').classList.remove('hidden');
        });

        // Modal controls
        document.querySelector('.close-btn').addEventListener('click', () => {
            document.getElementById('book-modal').classList.add('hidden');
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            document.getElementById('book-modal').classList.add('hidden');
        });

        document.getElementById('book-modal').addEventListener('click', (e) => {
            if (e.target.id === 'book-modal') {
                document.getElementById('book-modal').classList.add('hidden');
            }
        });

        // Form submission
        document.getElementById('book-form').addEventListener('submit', (e) => {
            e.preventDefault();

            const bookData = {
                title: document.getElementById('book-title').value,
                author: document.getElementById('book-author').value,
                isbn: document.getElementById('book-isbn').value,
                price: document.getElementById('book-price').value,
                publisher: document.getElementById('book-publisher').value,
                year: document.getElementById('book-year').value,
                location: document.getElementById('book-location').value,
                otherLocation: document.getElementById('book-other-location').value,
                notes: document.getElementById('book-notes').value,
                isWishlist: document.getElementById('book-type').checked
            };

            if (this.editingBookIndex !== null) {
                this.updateBook(this.editingBookIndex, bookData);
            } else {
                this.addBook(bookData);
            }

            document.getElementById('book-modal').classList.add('hidden');
        });
    }
}

// Initialize the library manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.library = new LibraryManager();
});