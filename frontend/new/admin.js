// ===== ADMIN PANEL INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is admin
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Access denied. Admin privileges required.');
    window.location.href = 'index.html';
    return;
  }

  // Update admin profile
  document.getElementById('adminName').textContent = currentUser.name;
  document.getElementById('navUsername').textContent = currentUser.name;

  // Initialize theme
  initializeTheme();

  // Load dashboard data
  loadDashboard();
  loadUsers();
  loadAllReviews();
  loadMovies();
  loadAnalytics();
});

// ===== THEME MANAGEMENT =====
function initializeTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
  
  themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ===== SECTION NAVIGATION =====
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show selected section
  document.getElementById(`${sectionName}-section`).classList.add('active');

  // Update nav items
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
}

// ===== DASHBOARD DATA =====
function loadDashboard() {
  const allUsers = getAllUsers();
  const allReviews = getAllReviews();
  
  // Calculate stats
  const totalUsers = allUsers.length;
  const totalReviews = allReviews.length;
  const uniqueMovies = new Set(allReviews.map(r => r.movie)).size;
  const avgRating = allReviews.length > 0 
    ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
    : '0.0';

  // Update stat cards
  document.getElementById('totalUsers').textContent = totalUsers;
  document.getElementById('totalReviews').textContent = totalReviews;
  document.getElementById('totalMovies').textContent = uniqueMovies;
  document.getElementById('avgRating').textContent = avgRating;

  // Load charts
  loadRatingsChart(allReviews);
  loadUsersChart(allUsers);

  // Load recent activity
  loadRecentActivity(allReviews, allUsers);
}

function loadRatingsChart(reviews) {
  const ctx = document.getElementById('ratingsChart');
  if (!ctx) return;

  // Count reviews by rating
  const ratingCounts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
  reviews.forEach(review => {
    const rating = review.rating || 0;
    if (rating >= 1 && rating <= 5) {
      ratingCounts[rating]++;
    }
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
      datasets: [{
        label: 'Number of Reviews',
        data: [ratingCounts[1], ratingCounts[2], ratingCounts[3], ratingCounts[4], ratingCounts[5]],
        backgroundColor: [
          'rgba(245, 87, 108, 0.7)',
          'rgba(250, 112, 154, 0.7)',
          'rgba(254, 225, 64, 0.7)',
          'rgba(79, 172, 254, 0.7)',
          'rgba(102, 126, 234, 0.7)'
        ],
        borderColor: [
          'rgb(245, 87, 108)',
          'rgb(250, 112, 154)',
          'rgb(254, 225, 64)',
          'rgb(79, 172, 254)',
          'rgb(102, 126, 234)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function loadUsersChart(users) {
  const ctx = document.getElementById('usersChart');
  if (!ctx) return;

  // Count users by role
  const roleCounts = {admin: 0, user: 0, guest: 0};
  users.forEach(user => {
    const role = user.role || 'guest';
    roleCounts[role]++;
  });

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Admin', 'Users', 'Guests'],
      datasets: [{
        data: [roleCounts.admin, roleCounts.user, roleCounts.guest],
        backgroundColor: [
          'rgba(118, 75, 162, 0.7)',
          'rgba(102, 126, 234, 0.7)',
          'rgba(79, 172, 254, 0.7)'
        ],
        borderColor: [
          'rgb(118, 75, 162)',
          'rgb(102, 126, 234)',
          'rgb(79, 172, 254)'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function loadRecentActivity(reviews, users) {
  const container = document.getElementById('recentActivity');
  if (!container) return;

  // Combine reviews and user registrations
  const activities = [];

  // Add review activities
  reviews.slice(0, 10).forEach(review => {
    activities.push({
      type: 'review',
      user: review.user,
      movie: review.movie,
      rating: review.rating,
      time: review.createdAt || new Date().toISOString()
    });
  });

  // Add user registration activities
  users.slice(0, 5).forEach(user => {
    activities.push({
      type: 'user',
      name: user.name,
      time: user.loginTime || new Date().toISOString()
    });
  });

  // Sort by time (most recent first)
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  // Display activities
  container.innerHTML = activities.slice(0, 15).map(activity => {
    if (activity.type === 'review') {
      return `
        <div class="activity-item">
          <div class="activity-icon review">
            <i class="fas fa-star"></i>
          </div>
          <div class="activity-info">
            <p><strong>${escapeHtml(activity.user)}</strong> reviewed <strong>${escapeHtml(activity.movie)}</strong> with ${activity.rating} stars</p>
          </div>
          <span class="activity-time">${formatTimeAgo(activity.time)}</span>
        </div>
      `;
    } else {
      return `
        <div class="activity-item">
          <div class="activity-icon user">
            <i class="fas fa-user-plus"></i>
          </div>
          <div class="activity-info">
            <p><strong>${escapeHtml(activity.name)}</strong> joined the platform</p>
          </div>
          <span class="activity-time">${formatTimeAgo(activity.time)}</span>
        </div>
      `;
    }
  }).join('');
}

// ===== USERS MANAGEMENT =====
function loadUsers() {
  const users = getAllUsers();
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = users.map(user => {
    const reviewCount = getUserReviewCount(user.username);
    const joinDate = new Date(user.loginTime || Date.now()).toLocaleDateString();
    const roleClass = user.role === 'admin' ? 'bg-danger' : user.role === 'user' ? 'bg-primary' : 'bg-secondary';

    return `
      <tr>
        <td>
          <img src="${user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b5cf6&color=fff`}" 
               alt="${escapeHtml(user.name)}" class="table-avatar">
        </td>
        <td><strong>${escapeHtml(user.name)}</strong></td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="badge ${roleClass}">${escapeHtml(user.role.toUpperCase())}</span></td>
        <td>${reviewCount}</td>
        <td>${joinDate}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editUser('${user.userId}')" ${user.role === 'admin' ? 'disabled' : ''}>
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.userId}')" ${user.role === 'admin' ? 'disabled' : ''}>
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function getUserReviewCount(username) {
  const allReviews = getAllReviews();
  return allReviews.filter(r => r.user === username).length;
}

function addNewUser() {
  alert('Add User functionality - This would open a modal to create a new user account');
  // In a real implementation, this would open a modal with a form
}

function editUser(userId) {
  alert(`Edit user ${userId} - This would open a modal to edit user details`);
  // In a real implementation, this would open a modal with user data
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    const users = getAllUsers();
    const updatedUsers = users.filter(u => u.userId !== userId);
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));
    loadUsers();
    showNotification('User deleted successfully', 'success');
  }
}

// ===== REVIEWS MANAGEMENT =====
let currentReviewFilter = 'all';

function loadAllReviews() {
  const reviews = getAllReviews();
  filterReviews();
}

function filterReviews() {
  const filter = document.getElementById('reviewFilter').value;
  currentReviewFilter = filter;
  
  let reviews = getAllReviews();
  
  if (filter !== 'all') {
    const rating = parseInt(filter);
    reviews = reviews.filter(r => r.rating === rating);
  }

  displayReviews(reviews);
}

function displayReviews(reviews) {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fas fa-star fa-3x text-muted mb-3"></i>
        <p class="text-muted">No reviews found</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(review => {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    return `
      <div class="admin-review-card">
        <div class="review-user-info">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(review.user)}&background=8b5cf6&color=fff" 
               alt="${escapeHtml(review.user)}" class="table-avatar">
          <div>
            <strong>${escapeHtml(review.user)}</strong>
            <div class="text-muted small">${formatTimeAgo(review.createdAt)}</div>
          </div>
        </div>
        <div class="review-content">
          <div class="review-meta">
            <span class="review-movie">${escapeHtml(review.movie)}</span>
            <span class="review-stars">${stars}</span>
          </div>
          <p class="review-text-admin">${escapeHtml(review.review)}</p>
          <div class="review-actions-admin">
            <button class="btn btn-sm btn-warning" onclick="editReviewAdmin('${review._id}')">
              <i class="fas fa-edit me-1"></i>Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteReviewAdmin('${review._id}')">
              <i class="fas fa-trash me-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function editReviewAdmin(reviewId) {
  alert(`Edit review ${reviewId} - This would open a modal to edit the review`);
  // In a real implementation, this would open a modal with review data
}

function deleteReviewAdmin(reviewId) {
  if (confirm('Are you sure you want to delete this review?')) {
    const allReviews = getAllReviews();
    const updatedReviews = allReviews.filter(r => r._id !== reviewId);
    
    // Update localStorage
    const reviewsByMovie = {};
    updatedReviews.forEach(review => {
      if (!reviewsByMovie[review.movie]) {
        reviewsByMovie[review.movie] = [];
      }
      reviewsByMovie[review.movie].push(review);
    });
    
    localStorage.setItem('userReviewsData', JSON.stringify(reviewsByMovie));
    
    // Reload reviews
    loadAllReviews();
    loadDashboard();
    showNotification('Review deleted successfully', 'success');
  }
}

// ===== MOVIES MANAGEMENT =====
function loadMovies() {
  const reviews = getAllReviews();
  const movieMap = new Map();

  // Group reviews by movie
  reviews.forEach(review => {
    if (!movieMap.has(review.movie)) {
      movieMap.set(review.movie, {
        name: review.movie,
        reviews: [],
        totalRating: 0
      });
    }
    const movieData = movieMap.get(review.movie);
    movieData.reviews.push(review);
    movieData.totalRating += review.rating || 0;
  });

  const movies = Array.from(movieMap.values()).map(movie => ({
    name: movie.name,
    reviewCount: movie.reviews.length,
    avgRating: (movie.totalRating / movie.reviews.length).toFixed(1)
  }));

  displayMovies(movies);
}

function displayMovies(movies) {
  const container = document.getElementById('moviesContainer');
  if (!container) return;

  if (movies.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fas fa-film fa-3x text-muted mb-3"></i>
        <p class="text-muted">No movies reviewed yet</p>
      </div>
    `;
    return;
  }

  container.innerHTML = movies.map(movie => `
    <div class="admin-movie-card">
      <div class="movie-poster"></div>
      <div class="movie-info">
        <h5 class="movie-title">${escapeHtml(movie.name)}</h5>
        <div class="movie-stats">
          <span><i class="fas fa-star text-warning"></i> ${movie.avgRating}</span>
          <span><i class="fas fa-comment"></i> ${movie.reviewCount}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== ANALYTICS =====
function loadAnalytics() {
  const reviews = getAllReviews();
  const users = getAllUsers();

  // Load trends chart
  loadTrendsChart(reviews);

  // Load top movies
  loadTopMovies(reviews);

  // Load top users
  loadTopUsers(reviews);

  // Load insights
  loadInsights(reviews, users);
}

function loadTrendsChart(reviews) {
  const ctx = document.getElementById('trendsChart');
  if (!ctx) return;

  // Group reviews by month (last 6 months)
  const monthCounts = {};
  const months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[monthKey] = 0;
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }

  reviews.forEach(review => {
    const date = new Date(review.createdAt || Date.now());
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthCounts[monthKey] !== undefined) {
      monthCounts[monthKey]++;
    }
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Reviews',
        data: Object.values(monthCounts),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function loadTopMovies(reviews) {
  const container = document.getElementById('topMoviesList');
  if (!container) return;

  // Calculate average ratings per movie
  const movieStats = {};
  reviews.forEach(review => {
    if (!movieStats[review.movie]) {
      movieStats[review.movie] = { total: 0, count: 0 };
    }
    movieStats[review.movie].total += review.rating || 0;
    movieStats[review.movie].count++;
  });

  const topMovies = Object.entries(movieStats)
    .map(([movie, stats]) => ({
      movie,
      avgRating: (stats.total / stats.count).toFixed(1),
      reviewCount: stats.count
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 10);

  container.innerHTML = topMovies.map((item, index) => `
    <div class="top-item">
      <div class="top-rank">${index + 1}</div>
      <div class="top-info">
        <div class="top-name">${escapeHtml(item.movie)}</div>
        <small class="text-muted">${item.reviewCount} reviews</small>
      </div>
      <div class="top-value">${item.avgRating} ★</div>
    </div>
  `).join('');
}

function loadTopUsers(reviews) {
  const container = document.getElementById('topUsersList');
  if (!container) return;

  // Count reviews per user
  const userCounts = {};
  reviews.forEach(review => {
    userCounts[review.user] = (userCounts[review.user] || 0) + 1;
  });

  const topUsers = Object.entries(userCounts)
    .map(([user, count]) => ({ user, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  container.innerHTML = topUsers.map((item, index) => `
    <div class="top-item">
      <div class="top-rank">${index + 1}</div>
      <div class="top-info">
        <div class="top-name">${escapeHtml(item.user)}</div>
      </div>
      <div class="top-value">${item.count} reviews</div>
    </div>
  `).join('');
}

function loadInsights(reviews, users) {
  // Active users (users who created account or reviewed this month)
  const thisMonth = new Date().getMonth();
  const activeUsers = users.filter(user => {
    const loginDate = new Date(user.loginTime || Date.now());
    return loginDate.getMonth() === thisMonth;
  }).length;

  // 5-star reviews
  const fiveStars = reviews.filter(r => r.rating === 5).length;

  // Average reviews per user
  const avgPerUser = users.length > 0 ? (reviews.length / users.length).toFixed(1) : '0.0';

  document.getElementById('insightActiveUsers').textContent = activeUsers;
  document.getElementById('insightFiveStars').textContent = fiveStars;
  document.getElementById('insightAvgPerUser').textContent = avgPerUser;
}

// ===== UTILITY FUNCTIONS =====
function getAllUsers() {
  const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  return users;
}

function getAllReviews() {
  const reviewsData = JSON.parse(localStorage.getItem('userReviewsData') || '{}');
  const allReviews = [];
  
  Object.entries(reviewsData).forEach(([movie, reviews]) => {
    reviews.forEach(review => {
      allReviews.push({
        ...review,
        movie: movie,
        createdAt: review.createdAt || new Date().toISOString()
      });
    });
  });

  return allReviews;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
  notification.style.zIndex = '9999';
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}
