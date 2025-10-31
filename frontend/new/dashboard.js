// =====================================================
// USER DASHBOARD - FUNCTIONALITY
// =====================================================

let currentUser = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  currentUser = getCurrentUser();
  
  if (!currentUser) {
    // Redirect to login if not authenticated
    window.location.href = 'login.html';
    return;
  }
  
  // Initialize dashboard
  loadUserProfile();
  loadDashboardData();
  setupEventListeners();
});

// ===== LOAD USER PROFILE =====
function loadUserProfile() {
  // Update navigation
  document.getElementById('navUserAvatar').src = currentUser.avatar;
  document.getElementById('navUsername').textContent = currentUser.name;
  
  // Update sidebar profile
  document.getElementById('dashUserAvatar').src = currentUser.avatar;
  document.getElementById('dashUsername').textContent = currentUser.name;
  document.getElementById('dashUserRole').textContent = currentUser.role.toUpperCase();
  
  // Load profile edit form
  document.getElementById('editName').value = currentUser.name;
  document.getElementById('editEmail').value = currentUser.email;
  document.getElementById('editUsername').value = currentUser.username;
}

// ===== LOAD DASHBOARD DATA =====
function loadDashboardData() {
  // Load all data
  loadOverviewStats();
  loadMyReviews();
  loadFavorites();
  loadRecentlyViewed();
}

// ===== OVERVIEW STATS =====
function loadOverviewStats() {
  // Get user's reviews from localStorage (simplified - in production would be from API)
  const allReviews = JSON.parse(localStorage.getItem('userReviewsData') || '{}');
  const userReviews = allReviews[currentUser.username] || [];
  
  // Get favorites
  const favorites = getFavorites();
  
  // Calculate stats
  const totalReviews = userReviews.length;
  const totalFavorites = favorites.length;
  const avgRating = userReviews.length > 0 
    ? (userReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / userReviews.length).toFixed(1)
    : '0.0';
  
  // Update stat cards
  document.getElementById('totalReviews').textContent = totalReviews;
  document.getElementById('totalFavorites').textContent = totalFavorites;
  document.getElementById('avgRating').textContent = avgRating;
  
  // Update sidebar stats
  document.getElementById('userReviewCount').textContent = totalReviews;
  document.getElementById('userFavoriteCount').textContent = totalFavorites;
  
  // Load recent activity
  loadRecentActivity(userReviews);
  
  // Load quick stats
  loadQuickStats(userReviews, favorites);
}

function loadRecentActivity(reviews) {
  const activityList = document.getElementById('recentActivity');
  
  if (reviews.length === 0) {
    activityList.innerHTML = '<p class="text-muted">No recent activity</p>';
    return;
  }
  
  // Show last 5 activities
  const recentReviews = reviews.slice(0, 5);
  
  activityList.innerHTML = recentReviews.map(review => `
    <div class="activity-item">
      <strong>Reviewed:</strong> ${escapeHtml(review.movieTitle || 'Movie')}
      <small>${timeAgo(review.createdAt || new Date())}</small>
    </div>
  `).join('');
}

function loadQuickStats(reviews, favorites) {
  const quickStats = document.getElementById('quickStats');
  
  const fiveStarReviews = reviews.filter(r => r.rating === 5).length;
  const thisMonthReviews = reviews.filter(r => {
    const reviewDate = new Date(r.createdAt);
    const now = new Date();
    return reviewDate.getMonth() === now.getMonth() && 
           reviewDate.getFullYear() === now.getFullYear();
  }).length;
  
  quickStats.innerHTML = `
    <div class="quick-stat-item">
      <span class="quick-stat-label">5-Star Reviews</span>
      <span class="quick-stat-value">${fiveStarReviews}</span>
    </div>
    <div class="quick-stat-item">
      <span class="quick-stat-label">Reviews This Month</span>
      <span class="quick-stat-value">${thisMonthReviews}</span>
    </div>
    <div class="quick-stat-item">
      <span class="quick-stat-label">Favorite Movies</span>
      <span class="quick-stat-value">${favorites.length}</span>
    </div>
    <div class="quick-stat-item">
      <span class="quick-stat-label">Member Since</span>
      <span class="quick-stat-value">${new Date(currentUser.loginTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
    </div>
  `;
}

// ===== MY REVIEWS =====
function loadMyReviews() {
  const reviewsList = document.getElementById('myReviewsList');
  const allReviews = JSON.parse(localStorage.getItem('userReviewsData') || '{}');
  const userReviews = allReviews[currentUser.username] || [];
  
  if (userReviews.length === 0) {
    reviewsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-comments"></i>
        <h4>No Reviews Yet</h4>
        <p>Start writing reviews to see them here</p>
        <a href="index.html" class="btn btn-primary">
          <i class="fas fa-film me-2"></i>Browse Movies
        </a>
      </div>
    `;
    return;
  }
  
  reviewsList.innerHTML = userReviews.map(review => `
    <div class="review-card">
      <div class="review-card-header">
        <div>
          <h5 class="review-movie-title">${escapeHtml(review.movieTitle || 'Movie')}</h5>
          <div class="review-rating">
            ${Array(5).fill(0).map((_, i) => 
              `<i class="fas fa-star${i < review.rating ? '' : ' text-muted'}"></i>`
            ).join('')}
          </div>
        </div>
        <span class="review-date">${formatDate(review.createdAt)}</span>
      </div>
      <p class="review-text">${escapeHtml(review.review)}</p>
      <div class="review-actions">
        <a href="movie.html?id=${review.movieId}&title=${encodeURIComponent(review.movieTitle)}" class="btn btn-sm btn-primary">
          <i class="fas fa-eye me-1"></i>View Movie
        </a>
        <button class="btn btn-sm btn-warning" onclick="editReviewFromDashboard('${review._id}')">
          <i class="fas fa-edit me-1"></i>Edit
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteReviewFromDashboard('${review._id}')">
          <i class="fas fa-trash me-1"></i>Delete
        </button>
      </div>
    </div>
  `).join('');
}

// ===== FAVORITES =====
function loadFavorites() {
  const favoritesList = document.getElementById('favoritesList');
  const favorites = getFavorites();
  
  if (favorites.length === 0) {
    favoritesList.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="fas fa-heart"></i>
          <h4>No Favorites Yet</h4>
          <p>Add movies to your favorites to see them here</p>
          <a href="index.html" class="btn btn-primary">
            <i class="fas fa-film me-2"></i>Browse Movies
          </a>
        </div>
      </div>
    `;
    return;
  }
  
  favoritesList.innerHTML = favorites.map(movie => `
    <div class="col-md-4 col-sm-6">
      <div class="movie-card-small" onclick="window.location.href='movie.html?id=${movie.id}&title=${encodeURIComponent(movie.title)}'">
        <img src="${movie.poster}" alt="${escapeHtml(movie.title)}" onerror="this.src='https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image'">
        <div class="movie-card-small-body">
          <h6 class="movie-card-small-title">${escapeHtml(movie.title)}</h6>
          <div class="d-flex justify-content-between align-items-center">
            <span class="movie-card-small-rating">
              <i class="fas fa-star"></i> ${movie.rating || 'N/A'}
            </span>
            <span class="movie-card-small-year">${movie.year || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== RECENTLY VIEWED =====
function loadRecentlyViewed() {
  const recentlyViewedList = document.getElementById('recentlyViewedList');
  const recentlyViewed = getRecentlyViewed();
  
  if (recentlyViewed.length === 0) {
    recentlyViewedList.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <h4>No Recently Viewed Movies</h4>
          <p>Movies you view will appear here</p>
          <a href="index.html" class="btn btn-primary">
            <i class="fas fa-film me-2"></i>Browse Movies
          </a>
        </div>
      </div>
    `;
    return;
  }
  
  // Show last 12
  const recentMovies = recentlyViewed.slice(0, 12);
  
  recentlyViewedList.innerHTML = recentMovies.map(movie => `
    <div class="col-md-3 col-sm-6">
      <div class="movie-card-small" onclick="window.location.href='movie.html?id=${movie.id}&title=${encodeURIComponent(movie.title)}'">
        <img src="${movie.poster}" alt="${escapeHtml(movie.title)}" onerror="this.src='https://via.placeholder.com/300x450/667eea/ffffff?text=No+Image'">
        <div class="movie-card-small-body">
          <h6 class="movie-card-small-title">${escapeHtml(movie.title)}</h6>
          <div class="d-flex justify-content-between align-items-center">
            <span class="movie-card-small-rating">
              <i class="fas fa-star"></i> ${movie.rating || 'N/A'}
            </span>
            <small class="text-muted">${timeAgo(movie.viewedAt)}</small>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Sidebar navigation
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      showSection(section);
    });
  });
  
  // Profile form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }
}

function showSection(sectionName) {
  // Update active menu item
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
  
  // Show corresponding content section
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(`${sectionName}-section`).classList.add('active');
}

// ===== PROFILE UPDATE =====
function handleProfileUpdate(e) {
  e.preventDefault();
  
  const newName = document.getElementById('editName').value.trim();
  const newEmail = document.getElementById('editEmail').value.trim();
  
  // Update current user
  currentUser.name = newName;
  currentUser.email = newEmail;
  
  // Save to localStorage
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  
  // Update UI
  loadUserProfile();
  
  showNotification('Profile updated successfully!', 'success');
}

// ===== REVIEW ACTIONS =====
function editReviewFromDashboard(reviewId) {
  // In a real app, this would navigate to edit page
  showNotification('Edit functionality - navigate to movie page to edit', 'info');
}

function deleteReviewFromDashboard(reviewId) {
  if (!confirm('Are you sure you want to delete this review?')) {
    return;
  }
  
  const allReviews = JSON.parse(localStorage.getItem('userReviewsData') || '{}');
  const userReviews = allReviews[currentUser.username] || [];
  
  // Filter out the deleted review
  allReviews[currentUser.username] = userReviews.filter(r => r._id !== reviewId);
  localStorage.setItem('userReviewsData', JSON.stringify(allReviews));
  
  // Reload data
  loadDashboardData();
  showNotification('Review deleted successfully', 'success');
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

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}

function showNotification(message, type = 'info') {
  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : 
                  type === 'danger' ? 'bg-danger' : 
                  type === 'warning' ? 'bg-warning' : 'bg-info';
  
  const icon = type === 'success' ? 'fa-check-circle' : 
               type === 'danger' ? 'fa-exclamation-circle' : 
               type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
  
  let toastContainer = document.querySelector('.toast-container');
  
  const toastHTML = `
    <div id="${toastId}" class="toast" role="alert">
      <div class="toast-header ${bgClass} text-white">
        <i class="fas ${icon} me-2"></i>
        <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();
  
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// ===== GET USER-SPECIFIC FAVORITES =====
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

// ===== GET RECENTLY VIEWED =====
function getRecentlyViewed() {
  try {
    const recentlyViewed = localStorage.getItem('recentlyViewed');
    return recentlyViewed ? JSON.parse(recentlyViewed) : [];
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return [];
  }
}
