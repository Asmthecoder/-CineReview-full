// =====================================================
// PREMIUM MOVIE REVIEW SITE - ENHANCED JAVASCRIPT
// =====================================================

// API Configuration
const APILINK = 'https://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=41ee980e4b5f05f6693fda00eb7c4fd4&page=1';
const IMG_PATH = "https://image.tmdb.org/t/p/w1280";
const SEARCHAPI = "https://api.themoviedb.org/3/search/movie?&api_key=41ee980e4b5f05f6693fda00eb7c4fd4&query=";
const API_KEY = '41ee980e4b5f05f6693fda00eb7c4fd4';

// DOM Elements
const main = document.getElementById("section");
const form = document.getElementById("form");
const search = document.getElementById("query");
const loadingSpinner = document.getElementById("loadingSpinner");
const noResults = document.getElementById("noResults");
const resultsCount = document.getElementById("resultsCount");
const sectionTitle = document.getElementById("sectionTitle");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// State Management
let currentFilter = 'popular';
let currentMovies = [];
let currentPage = 1;
let totalPages = 1;
let allMovies = [];

// Advanced search filters
let advancedFilters = {
  genre: '',
  year: '',
  sortBy: 'popularity.desc',
  minRating: 0
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication state
  checkAuthState();
  
  // Load theme preference
  loadThemePreference();
  
  // Load default movies
  returnMovies(APILINK);
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Setup accessibility
  setupAccessibility();
});

// ===== THEME MANAGEMENT =====
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  
  if (document.body.classList.contains('dark-mode')) {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
    localStorage.setItem('theme', 'dark');
  } else {
    themeIcon.classList.replace('fa-sun', 'fa-moon');
    localStorage.setItem('theme', 'light');
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Search form
  if (form) {
    form.addEventListener("submit", handleSearch);
  }
  
  // Filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn:not(#advancedSearchToggle)');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', handleFilterClick);
  });
  
  // Search input validation
  if (search) {
    search.addEventListener('input', validateSearchInput);
  }
  
  // Pagination
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => changePage(-1));
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => changePage(1));
  }
  
  // Advanced search toggle
  const advancedToggle = document.getElementById('advancedSearchToggle');
  const advancedPanel = document.getElementById('advancedSearchPanel');
  
  if (advancedToggle && advancedPanel) {
    advancedToggle.addEventListener('click', () => {
      const isHidden = advancedPanel.style.display === 'none';
      advancedPanel.style.display = isHidden ? 'block' : 'none';
      advancedToggle.classList.toggle('active');
    });
  }
  
  // Apply filters button
  const applyFiltersBtn = document.getElementById('applyFilters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyAdvancedFilters);
  }
  
  // Reset filters button
  const resetFiltersBtn = document.getElementById('resetFilters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetAdvancedFilters);
  }
}

// ===== SEARCH FUNCTIONALITY =====
function handleSearch(e) {
  e.preventDefault();
  
  const searchItem = search.value.trim();
  
  if (!searchItem) {
    showNotification('Please enter a search term', 'warning');
    search.focus();
    return;
  }
  
  if (searchItem.length < 2) {
    showNotification('Search term must be at least 2 characters', 'warning');
    return;
  }
  
  // Add to search history
  addToSearchHistory(searchItem);
  
  // Clear previous results
  main.innerHTML = '';
  currentFilter = 'search';
  currentPage = 1;
  updateSectionTitle('Search Results');
  
  // Perform search
  returnMovies(SEARCHAPI + encodeURIComponent(searchItem));
  search.value = "";
  
  // Update active filter
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
}

function validateSearchInput(e) {
  const value = e.target.value;
  
  // Remove special characters except spaces and hyphens
  const sanitized = value.replace(/[^a-zA-Z0-9\s-]/g, '');
  if (value !== sanitized) {
    e.target.value = sanitized;
  }
  
  // Limit length
  if (value.length > 100) {
    e.target.value = value.substring(0, 100);
  }
}

// ===== FILTER FUNCTIONALITY =====
function handleFilterClick(e) {
  const button = e.currentTarget;
  const filter = button.dataset.filter;
  
  // Update active state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  button.classList.add('active');
  
  // Clear search
  if (search) {
    search.value = '';
  }
  
  // Update current filter
  currentFilter = filter;
  
  // Build API URL based on filter
  let apiUrl = `https://api.themoviedb.org/3/movie/${filter}?api_key=${API_KEY}&language=en-US&page=1`;
  
  // Update section title
  const titles = {
    'popular': 'Popular Movies',
    'top_rated': 'Top Rated Movies',
    'upcoming': 'Upcoming Movies',
    'now_playing': 'Now Playing'
  };
  updateSectionTitle(titles[filter] || 'Movies');
  
  // Load movies
  main.innerHTML = '';
  returnMovies(apiUrl);
}

function updateSectionTitle(title) {
  if (sectionTitle) {
    sectionTitle.textContent = title;
  }
}

// ===== MOVIE FETCHING & DISPLAY =====
function returnMovies(url) {
  // Show loading state
  showLoading(true);
  hideNoResults();
  
  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return res.json();
    })
    .then(function(data) {
      console.log(data.results);
      currentMovies = data.results;
      allMovies = data.results;
      totalPages = data.total_pages || 1;
      
      // Hide loading
      showLoading(false);
      
      // Check if results exist
      if (!data.results || data.results.length === 0) {
        showNoResults();
        updateResultsCount(0);
        updatePaginationControls();
        return;
      }
      
      // Update results count
      updateResultsCount(data.results.length);
      
      // Clear main container
      main.innerHTML = '';
      
      // Display movies
      data.results.forEach((movie, index) => {
        createMovieCard(movie, index);
      });
      
      // Update pagination
      updatePaginationControls();
    })
    .catch(error => {
      console.error('Error fetching movies:', error);
      showLoading(false);
      showNotification('Failed to load movies. Please try again.', 'danger');
      showNoResults();
      updatePaginationControls();
    });
}

function createMovieCard(movie, index) {
  const { id, title, poster_path, vote_average, overview, release_date } = movie;
  
  // Create card column
  const col = document.createElement('div');
  col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
  col.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s backwards`;
  
  // Format rating
  const rating = vote_average ? vote_average.toFixed(1) : 'N/A';
  const ratingClass = vote_average >= 7 ? 'success' : vote_average >= 5 ? 'warning' : 'danger';
  
  // Format date
  const releaseYear = release_date ? new Date(release_date).getFullYear() : 'TBA';
  
  // Handle missing poster
  const posterUrl = poster_path 
    ? IMG_PATH + poster_path 
    : 'https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image';
  
  // Check if movie is in favorites
  const isFavorite = isMovieInFavorites(id);
  const favoriteClass = isFavorite ? 'active' : '';
  const heartIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
  
  // Create card HTML
  col.innerHTML = `
    <div class="movie-card" onclick="navigateToMovie('${id}', '${escapeHtml(title)}')">
      <div class="movie-card-img-wrapper">
        <img src="${posterUrl}" 
             alt="${escapeHtml(title)}" 
             class="movie-card-img"
             onerror="this.src='https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image'">
        <div class="movie-rating-badge">
          <i class="fas fa-star"></i>
          ${rating}
        </div>
        <button class="favorite-btn ${favoriteClass}" 
                onclick="event.stopPropagation(); toggleFavorite('${id}', '${escapeHtml(title)}', '${posterUrl}', ${vote_average}, '${releaseYear}')" 
                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
          <i class="${heartIcon}"></i>
        </button>
      </div>
      <div class="movie-card-body">
        <h5 class="movie-card-title" title="${escapeHtml(title)}">
          ${escapeHtml(title)}
        </h5>
        <p class="movie-card-overview">
          ${overview ? escapeHtml(overview) : 'No description available.'}
        </p>
        <div class="movie-card-footer">
          <span class="movie-release-date">
            <i class="fas fa-calendar-alt"></i>
            ${releaseYear}
          </span>
          <button class="btn btn-review btn-sm" onclick="event.stopPropagation(); navigateToMovie('${id}', '${escapeHtml(title)}')">
            <i class="fas fa-comment-dots"></i>
            Reviews
          </button>
        </div>
      </div>
    </div>
  `;
  
  main.appendChild(col);
}

// ===== NAVIGATION =====
function navigateToMovie(id, title) {
  // Validate inputs
  if (!id || !title) {
    showNotification('Invalid movie data', 'danger');
    return;
  }
  
  // Find movie data from current movies
  const movie = currentMovies.find(m => m.id.toString() === id.toString());
  if (movie) {
    const posterUrl = movie.poster_path 
      ? IMG_PATH + movie.poster_path 
      : 'https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image';
    addToRecentlyViewed(id, title, posterUrl, movie.vote_average);
  }
  
  window.location.href = `movie.html?id=${encodeURIComponent(id)}&title=${encodeURIComponent(title)}`;
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function showLoading(show) {
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? 'block' : 'none';
  }
}

function showNoResults() {
  if (noResults) {
    noResults.style.display = 'block';
  }
}

function hideNoResults() {
  if (noResults) {
    noResults.style.display = 'none';
  }
}

function updateResultsCount(count) {
  if (resultsCount) {
    resultsCount.textContent = `${count} movie${count !== 1 ? 's' : ''} found`;
  }
}

function showNotification(message, type = 'info') {
  // Create toast element if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : 
                  type === 'danger' ? 'bg-danger' : 
                  type === 'warning' ? 'bg-warning' : 'bg-info';
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'danger' ? 'fa-exclamation-circle' : 
               type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
  
  const toastHTML = `
    <div id="${toastId}" class="toast" role="alert">
      <div class="toast-header ${bgClass} text-white">
        <i class="fas ${icon} me-2"></i>
        <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        ${escapeHtml(message)}
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();
  
  // Remove toast element after it's hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
});

// ===== PAGINATION =====
function changePage(direction) {
  const newPage = currentPage + direction;
  
  if (newPage < 1 || newPage > totalPages) {
    return;
  }
  
  currentPage = newPage;
  
  // Build URL with new page
  let baseUrl = '';
  
  if (currentFilter === 'search') {
    // Can't paginate search easily with TMDB, would need to re-search
    showNotification('Search pagination not available', 'info');
    return;
  } else {
    baseUrl = `https://api.themoviedb.org/3/movie/${currentFilter}?api_key=${API_KEY}&language=en-US&page=${currentPage}`;
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Load movies
  main.innerHTML = '';
  returnMovies(baseUrl);
}

function updatePaginationControls() {
  const paginationContainer = document.getElementById('paginationContainer');
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  
  if (!paginationContainer) return;
  
  // Show pagination if we have results
  if (allMovies.length > 0 && totalPages > 1) {
    paginationContainer.style.display = 'flex';
    
    // Update buttons
    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;
    }
    
    // Update page info
    if (pageInfo) {
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
  } else {
    paginationContainer.style.display = 'none';
  }
}

// ===== ADVANCED SEARCH =====
function applyAdvancedFilters() {
  // Get filter values
  const genreFilter = document.getElementById('genreFilter');
  const yearFilter = document.getElementById('yearFilter');
  const sortBy = document.getElementById('sortBy');
  const minRating = document.getElementById('minRating');
  
  advancedFilters = {
    genre: genreFilter ? genreFilter.value : '',
    year: yearFilter ? yearFilter.value : '',
    sortBy: sortBy ? sortBy.value : 'popularity.desc',
    minRating: minRating ? parseFloat(minRating.value) : 0
  };
  
  // Build API URL with filters
  let apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&page=1`;
  
  // Add sort
  apiUrl += `&sort_by=${advancedFilters.sortBy}`;
  
  // Add genre
  if (advancedFilters.genre) {
    apiUrl += `&with_genres=${advancedFilters.genre}`;
  }
  
  // Add year
  if (advancedFilters.year) {
    if (advancedFilters.year.includes('-')) {
      // Year range
      const [startYear, endYear] = advancedFilters.year.split('-');
      apiUrl += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
    } else {
      // Single year
      apiUrl += `&primary_release_year=${advancedFilters.year}`;
    }
  }
  
  // Add minimum rating
  if (advancedFilters.minRating > 0) {
    apiUrl += `&vote_average.gte=${advancedFilters.minRating}`;
  }
  
  // Reset page
  currentPage = 1;
  currentFilter = 'advanced';
  
  // Update UI
  updateSectionTitle('Filtered Movies');
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById('advancedSearchToggle').classList.add('active');
  
  // Load movies
  main.innerHTML = '';
  returnMovies(apiUrl);
  
  showNotification('Filters applied successfully', 'success');
}

function resetAdvancedFilters() {
  // Reset filter values
  const genreFilter = document.getElementById('genreFilter');
  const yearFilter = document.getElementById('yearFilter');
  const sortBy = document.getElementById('sortBy');
  const minRating = document.getElementById('minRating');
  
  if (genreFilter) genreFilter.value = '';
  if (yearFilter) yearFilter.value = '';
  if (sortBy) sortBy.value = 'popularity.desc';
  if (minRating) minRating.value = '0';
  
  advancedFilters = {
    genre: '',
    year: '',
    sortBy: 'popularity.desc',
    minRating: 0
  };
  
  // Close advanced panel
  const advancedPanel = document.getElementById('advancedSearchPanel');
  if (advancedPanel) {
    advancedPanel.style.display = 'none';
  }
  
  // Reset to popular
  currentFilter = 'popular';
  currentPage = 1;
  
  // Update UI
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector('[data-filter="popular"]').classList.add('active');
  
  updateSectionTitle('Popular Movies');
  
  // Load default movies
  main.innerHTML = '';
  returnMovies(APILINK);
  
  showNotification('Filters reset', 'info');
}

// ===== FAVORITES / WISHLIST =====
function toggleFavorite(id, title, poster, rating, year) {
  // Check if user is logged in
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showNotification('Please login to add favorites', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  let favorites = getFavorites();
  
  const movieIndex = favorites.findIndex(m => m.id === id);
  
  if (movieIndex > -1) {
    // Remove from favorites
    favorites.splice(movieIndex, 1);
    saveFavorites(favorites);
    showNotification(`Removed "${title}" from favorites`, 'info');
  } else {
    // Add to favorites
    const movie = {
      id: id,
      title: title,
      poster: poster,
      rating: rating,
      year: year,
      addedAt: new Date().toISOString(),
      addedBy: currentUser.username
    };
    favorites.push(movie);
    saveFavorites(favorites);
    showNotification(`Added "${title}" to favorites`, 'success');
  }
  
  // Update button state
  updateFavoriteButtons();
}

function getFavorites() {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return [];
    }
    
    // Get user-specific favorites
    const allFavorites = localStorage.getItem('movieFavorites');
    const favoritesData = allFavorites ? JSON.parse(allFavorites) : {};
    
    // Return favorites for current user
    return favoritesData[currentUser.username] || [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

function saveFavorites(favorites) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return;
    }
    
    // Get all favorites data
    const allFavorites = localStorage.getItem('movieFavorites');
    const favoritesData = allFavorites ? JSON.parse(allFavorites) : {};
    
    // Save favorites for current user
    favoritesData[currentUser.username] = favorites;
    localStorage.setItem('movieFavorites', JSON.stringify(favoritesData));
  } catch (error) {
    console.error('Error saving favorites:', error);
    showNotification('Failed to save favorites', 'danger');
  }
}

function isMovieInFavorites(id) {
  const favorites = getFavorites();
  return favorites.some(m => m.id === id);
}

function updateFavoriteButtons() {
  const favoriteButtons = document.querySelectorAll('.favorite-btn');
  
  favoriteButtons.forEach(btn => {
    const movieId = btn.getAttribute('onclick').match(/'(\d+)'/)[1];
    const isFavorite = isMovieInFavorites(movieId);
    
    if (isFavorite) {
      btn.classList.add('active');
      btn.querySelector('i').className = 'fas fa-heart';
      btn.title = 'Remove from favorites';
    } else {
      btn.classList.remove('active');
      btn.querySelector('i').className = 'far fa-heart';
      btn.title = 'Add to favorites';
    }
  });
}

// ===== RECENTLY VIEWED =====
function addToRecentlyViewed(id, title, poster, rating) {
  try {
    let recentlyViewed = localStorage.getItem('recentlyViewed');
    recentlyViewed = recentlyViewed ? JSON.parse(recentlyViewed) : [];
    
    // Remove if already exists
    recentlyViewed = recentlyViewed.filter(m => m.id !== id);
    
    // Add to beginning
    recentlyViewed.unshift({
      id: id,
      title: title,
      poster: poster,
      rating: rating,
      viewedAt: new Date().toISOString()
    });
    
    // Keep only last 20
    recentlyViewed = recentlyViewed.slice(0, 20);
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  } catch (error) {
    console.error('Error saving to recently viewed:', error);
  }
}

function getRecentlyViewed() {
  try {
    const recentlyViewed = localStorage.getItem('recentlyViewed');
    return recentlyViewed ? JSON.parse(recentlyViewed) : [];
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return [];
  }
}

// ===== SEARCH HISTORY =====
function addToSearchHistory(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return;
  
  try {
    let searchHistory = localStorage.getItem('searchHistory');
    searchHistory = searchHistory ? JSON.parse(searchHistory) : [];
    
    // Remove if already exists
    searchHistory = searchHistory.filter(term => term.toLowerCase() !== searchTerm.toLowerCase());
    
    // Add to beginning
    searchHistory.unshift(searchTerm);
    
    // Keep only last 10
    searchHistory = searchHistory.slice(0, 10);
    
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

function getSearchHistory() {
  try {
    const searchHistory = localStorage.getItem('searchHistory');
    return searchHistory ? JSON.parse(searchHistory) : [];
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
}

// ===== KEYBOARD SHORTCUTS =====
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // / key - Focus search
    if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const activeElement = document.activeElement;
      if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (search) {
          search.focus();
          search.select();
        }
      }
    }
    
    // ESC key - Clear search and close panels
    if (e.key === 'Escape') {
      if (search && search === document.activeElement) {
        search.value = '';
        search.blur();
      }
      
      // Close advanced search panel
      const advancedPanel = document.getElementById('advancedSearchPanel');
      if (advancedPanel && advancedPanel.style.display !== 'none') {
        advancedPanel.style.display = 'none';
        const advancedToggle = document.getElementById('advancedSearchToggle');
        if (advancedToggle) {
          advancedToggle.classList.remove('active');
        }
      }
    }
    
    // Ctrl/Cmd + K - Toggle theme
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleTheme();
    }
  });
}

// ===== ACCESSIBILITY =====
function setupAccessibility() {
  // Add skip to content link
  const skipLink = document.createElement('a');
  skipLink.href = '#section';
  skipLink.className = 'skip-to-content';
  skipLink.textContent = 'Skip to main content';
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Add ARIA labels to buttons without text
  document.querySelectorAll('button:not([aria-label])').forEach(btn => {
    const icon = btn.querySelector('i');
    if (icon && !btn.textContent.trim()) {
      const iconClass = icon.className;
      if (iconClass.includes('fa-moon')) {
        btn.setAttribute('aria-label', 'Switch to dark mode');
      } else if (iconClass.includes('fa-sun')) {
        btn.setAttribute('aria-label', 'Switch to light mode');
      } else if (iconClass.includes('fa-heart')) {
        btn.setAttribute('aria-label', 'Add to favorites');
      }
    }
  });
  
  // Add role and aria-live to results section
  if (main) {
    main.setAttribute('role', 'region');
    main.setAttribute('aria-label', 'Movie results');
  }
  
  // Add aria-label to search
  if (search) {
    search.setAttribute('aria-label', 'Search for movies');
    search.setAttribute('aria-describedby', 'searchHelp');
    
    // Add search help text (visually hidden)
    const searchHelp = document.createElement('span');
    searchHelp.id = 'searchHelp';
    searchHelp.className = 'visually-hidden';
    searchHelp.textContent = 'Press / to focus search, type at least 2 characters and press Enter to search';
    if (search.parentElement) {
      search.parentElement.appendChild(searchHelp);
    }
  }
}

// ===== AUTHENTICATION STATE =====
function checkAuthState() {
  const currentUser = getCurrentUser();
  
  // Get elements
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const userMenu = document.getElementById('userMenu');
  
  if (currentUser) {
    // User is logged in - show user menu, hide auth links
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'block';
      
      // Update user info
      const navAvatar = document.getElementById('navUserAvatar');
      const navUsername = document.getElementById('navUsername');
      
      if (navAvatar) navAvatar.src = currentUser.avatar;
      if (navUsername) navUsername.textContent = currentUser.name;
      
      // Show admin panel link if admin
      if (currentUser.role === 'admin') {
        const adminLink = document.getElementById('adminPanelLink');
        if (adminLink) adminLink.style.display = 'block';
      }
    }
  } else {
    // User is NOT logged in - show auth links, hide user menu
    if (loginLink) loginLink.style.display = 'block';
    if (registerLink) registerLink.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}

function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

function logout() {
  localStorage.removeItem('currentUser');
  showNotification('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ===== SCROLL TO TOP FUNCTIONALITY =====
const scrollToTopBtn = document.getElementById('scrollToTop');

if (scrollToTopBtn) {
  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollToTopBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
    }
  });

  // Scroll to top smoothly when clicked
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  // "/" key - Focus on search input
  if (e.key === '/' && !e.ctrlKey && !e.altKey) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  }
  
  // Escape key - Clear search or close modals
  if (e.key === 'Escape') {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  }
  
  // Arrow keys for pagination (only when not in input fields)
  if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    if (e.key === 'ArrowLeft') {
      const prevBtn = document.querySelector('.pagination-btn:not([disabled]):first-child');
      if (prevBtn) prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      const nextBtn = document.querySelector('.pagination-btn:not([disabled]):last-child');
      if (nextBtn) nextBtn.click();
    }
  }
});

// ===== IMPROVED SEARCH UX =====
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  // Add search icon indicator
  const searchWrapper = searchInput.parentElement;
  if (searchWrapper && !searchWrapper.querySelector('.search-icon-indicator')) {
    const iconIndicator = document.createElement('span');
    iconIndicator.className = 'search-icon-indicator';
    iconIndicator.innerHTML = '<i class="fas fa-search"></i>';
    iconIndicator.style.cssText = 'position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none;';
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(iconIndicator);
  }
  
  // Add keyboard shortcut hint
  searchInput.setAttribute('placeholder', 'Search movies... (Press "/" to focus)');
}
