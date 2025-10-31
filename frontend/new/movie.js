// =====================================================
// MOVIE REVIEW PAGE - ENHANCED JAVASCRIPT WITH VALIDATION
// =====================================================

// Get URL parameters
const url = new URL(location.href); 
const movieId = url.searchParams.get("id");
const movieTitle = url.searchParams.get("title");

// API Configuration
const APILINK = 'https://movie-review-site-k8fi.vercel.app/api/v1/reviews/';

// DOM Elements
const main = document.getElementById("section");
const titleElement = document.getElementById("title");
const loadingSpinner = document.getElementById("loadingSpinner");
const noReviews = document.getElementById("noReviews");
const reviewCount = document.getElementById("reviewCount");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Form Elements
const newReviewForm = document.getElementById("newReviewForm");
const newUserInput = document.getElementById("new_user");
const newReviewInput = document.getElementById("new_review");
const newRatingInput = document.getElementById("new_rating");
const ratingStars = document.getElementById("ratingStars");
const submitBtn = document.getElementById("submitBtn");
const userCharCount = document.getElementById("userCharCount");
const reviewCharCount = document.getElementById("reviewCharCount");
const ratingError = document.getElementById("ratingError");

// State
let currentRating = 0;
let reviews = [];
let isSubmitting = false;
let currentUser = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  checkAuthState();
  
  // Validate movie ID
  if (!movieId || !movieTitle) {
    showNotification('Invalid movie data. Redirecting to home...', 'danger');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return;
  }
  
  // Set movie title
  titleElement.innerText = decodeURIComponent(movieTitle);
  
  // Load theme preference
  loadThemePreference();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load reviews
  returnReviews(APILINK);
});

// ===== THEME MANAGEMENT =====
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIcon) {
      themeIcon.classList.replace('fa-moon', 'fa-sun');
    }
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
  
  // Form submission
  if (newReviewForm) {
    newReviewForm.addEventListener('submit', handleFormSubmit);
  }
  
  // Character counters
  if (newUserInput) {
    newUserInput.addEventListener('input', () => {
      updateCharCount(newUserInput, userCharCount, 50);
      validateInput(newUserInput);
    });
  }
  
  if (newReviewInput) {
    newReviewInput.addEventListener('input', () => {
      updateCharCount(newReviewInput, reviewCharCount, 500);
      validateInput(newReviewInput);
    });
  }
  
  // Rating stars
  if (ratingStars) {
    const stars = ratingStars.querySelectorAll('i');
    stars.forEach((star, index) => {
      star.addEventListener('click', () => setRating(index + 1));
      star.addEventListener('mouseenter', () => highlightStars(index + 1));
    });
    
    ratingStars.addEventListener('mouseleave', () => highlightStars(currentRating));
  }
}

// ===== RATING FUNCTIONALITY =====
function setRating(rating) {
  currentRating = rating;
  newRatingInput.value = rating;
  highlightStars(rating);
  
  // Remove error
  if (ratingError) {
    ratingError.style.display = 'none';
  }
}

function highlightStars(count) {
  const stars = ratingStars.querySelectorAll('i');
  stars.forEach((star, index) => {
    if (index < count) {
      star.classList.remove('far');
      star.classList.add('fas', 'active');
    } else {
      star.classList.remove('fas', 'active');
      star.classList.add('far');
    }
  });
}

// ===== CHARACTER COUNT =====
function updateCharCount(input, countElement, maxLength) {
  const length = input.value.length;
  if (countElement) {
    countElement.textContent = length;
    
    // Change color based on length
    if (length > maxLength * 0.9) {
      countElement.style.color = '#ef4444';
    } else if (length > maxLength * 0.7) {
      countElement.style.color = '#f59e0b';
    } else {
      countElement.style.color = '';
    }
  }
}

// ===== FORM VALIDATION =====
function validateInput(input) {
  const value = input.value.trim();
  const minLength = parseInt(input.getAttribute('minlength')) || 0;
  const maxLength = parseInt(input.getAttribute('maxlength')) || Infinity;
  
  // Remove previous validation states
  input.classList.remove('is-valid', 'is-invalid');
  
  // Check if empty and required
  if (input.hasAttribute('required') && !value) {
    input.classList.add('is-invalid');
    return false;
  }
  
  // Check length
  if (value && (value.length < minLength || value.length > maxLength)) {
    input.classList.add('is-invalid');
    return false;
  }
  
  // Valid input
  if (value) {
    input.classList.add('is-valid');
  }
  
  return true;
}

function validateForm() {
  let isValid = true;
  
  // Validate user name
  if (!validateInput(newUserInput)) {
    isValid = false;
  }
  
  // Validate review text
  if (!validateInput(newReviewInput)) {
    isValid = false;
  }
  
  // Validate rating
  if (currentRating === 0) {
    if (ratingError) {
      ratingError.style.display = 'block';
    }
    isValid = false;
  } else {
    if (ratingError) {
      ratingError.style.display = 'none';
    }
  }
  
  return isValid;
}

// ===== FORM SUBMISSION =====
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Prevent double submission
  if (isSubmitting) {
    return;
  }
  
  // Validate form
  if (!validateForm()) {
    showNotification('Please fill in all required fields correctly', 'warning');
    return;
  }
  
  // Get values
  const user = sanitizeInput(newUserInput.value.trim());
  const review = sanitizeInput(newReviewInput.value.trim());
  const rating = currentRating;
  
  // Additional validation
  if (user.length < 2 || user.length > 50) {
    showNotification('Name must be between 2 and 50 characters', 'warning');
    return;
  }
  
  if (review.length < 10 || review.length > 500) {
    showNotification('Review must be between 10 and 500 characters', 'warning');
    return;
  }
  
  if (rating < 1 || rating > 5) {
    showNotification('Please select a rating from 1 to 5 stars', 'warning');
    return;
  }
  
  // Show loading state
  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
  
  try {
    await saveReview(user, review, rating);
  } catch (error) {
    console.error('Error submitting review:', error);
    showNotification('Failed to submit review. Please try again.', 'danger');
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Review';
  }
}

// ===== SAVE REVIEW =====
async function saveReview(user, review, rating, id = "") {
  const reviewData = {
    user: user,
    review: review,
    rating: rating,
    movieId: movieId
  };
  
  const apiUrl = id ? `${APILINK}${id}` : `${APILINK}new`;
  const method = id ? 'PUT' : 'POST';
  
  try {
    const response = await fetch(apiUrl, {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save review');
    }
    
    const data = await response.json();
    console.log('Review saved:', data);
    
    showNotification(id ? 'Review updated successfully!' : 'Review submitted successfully!', 'success');
    
    // Reload page after short delay
    setTimeout(() => {
      location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Error saving review:', error);
    throw error;
  }
}

// ===== DELETE REVIEW =====
async function deleteReview(id) {
  if (!confirm('Are you sure you want to delete this review?')) {
    return;
  }
  
  try {
    const response = await fetch(`${APILINK}${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete review');
    }
    
    const data = await response.json();
    console.log('Review deleted:', data);
    
    showNotification('Review deleted successfully!', 'success');
    
    // Reload page after short delay
    setTimeout(() => {
      location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Error deleting review:', error);
    showNotification('Failed to delete review. Please try again.', 'danger');
  }
}

// ===== EDIT REVIEW =====
function editReview(id, review, user, rating) {
  const element = document.getElementById(id);
  if (!element) return;
  
  const reviewInputId = "review" + id;
  const userInputId = "user" + id;
  const ratingInputId = "rating" + id;
  
  element.innerHTML = `
    <div class="review-header">
      <h5><i class="fas fa-edit me-2"></i>Edit Review</h5>
    </div>
    <div class="review-body">
      <form id="editForm${id}" class="needs-validation" novalidate>
        <div class="mb-3">
          <label for="${userInputId}" class="form-label">
            <i class="fas fa-user me-2"></i>Your Name
          </label>
          <input 
            type="text" 
            class="form-control" 
            id="${userInputId}" 
            value="${escapeHtml(user)}"
            required
            minlength="2"
            maxlength="50"
          >
          <div class="invalid-feedback">Please enter a valid name (2-50 characters)</div>
        </div>
        
        <div class="mb-3">
          <label class="form-label">
            <i class="fas fa-star me-2"></i>Rating
          </label>
          <div class="rating-input" id="editRatingStars${id}">
            ${[1, 2, 3, 4, 5].map(i => 
              `<i class="${i <= rating ? 'fas' : 'far'} fa-star ${i <= rating ? 'active' : ''}" 
                  data-rating="${i}" 
                  onclick="setEditRating('${id}', ${i})"></i>`
            ).join('')}
          </div>
          <input type="hidden" id="${ratingInputId}" value="${rating}">
        </div>
        
        <div class="mb-3">
          <label for="${reviewInputId}" class="form-label">
            <i class="fas fa-comment me-2"></i>Your Review
          </label>
          <textarea 
            class="form-control" 
            id="${reviewInputId}" 
            rows="4"
            required
            minlength="10"
            maxlength="500"
          >${escapeHtml(review)}</textarea>
          <div class="invalid-feedback">Please enter a review (10-500 characters)</div>
        </div>
        
        <div class="review-actions">
          <button type="button" class="btn btn-secondary" onclick="location.reload()">
            <i class="fas fa-times me-2"></i>Cancel
          </button>
          <button type="button" class="btn btn-primary" onclick="saveEditedReview('${reviewInputId}', '${userInputId}', '${ratingInputId}', '${id}')">
            <i class="fas fa-save me-2"></i>Save Changes
          </button>
        </div>
      </form>
    </div>
  `;
}

// Set rating for edit form
function setEditRating(formId, rating) {
  const ratingInputId = "rating" + formId;
  const ratingInput = document.getElementById(ratingInputId);
  if (ratingInput) {
    ratingInput.value = rating;
  }
  
  const stars = document.querySelectorAll(`#editRatingStars${formId} i`);
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.remove('far');
      star.classList.add('fas', 'active');
    } else {
      star.classList.remove('fas', 'active');
      star.classList.add('far');
    }
  });
}

// Save edited review
async function saveEditedReview(reviewInputId, userInputId, ratingInputId, id) {
  const reviewInput = document.getElementById(reviewInputId);
  const userInput = document.getElementById(userInputId);
  const ratingInput = document.getElementById(ratingInputId);
  
  if (!reviewInput || !userInput || !ratingInput) {
    showNotification('Form elements not found', 'danger');
    return;
  }
  
  const review = sanitizeInput(reviewInput.value.trim());
  const user = sanitizeInput(userInput.value.trim());
  const rating = parseInt(ratingInput.value);
  
  // Validate
  if (user.length < 2 || user.length > 50) {
    showNotification('Name must be between 2 and 50 characters', 'warning');
    return;
  }
  
  if (review.length < 10 || review.length > 500) {
    showNotification('Review must be between 10 and 500 characters', 'warning');
    return;
  }
  
  if (rating < 1 || rating > 5) {
    showNotification('Please select a valid rating', 'warning');
    return;
  }
  
  await saveReview(user, review, rating, id);
}

// ===== RESET FORM =====
function resetForm() {
  if (newReviewForm) {
    newReviewForm.reset();
  }
  
  // Reset rating
  currentRating = 0;
  newRatingInput.value = 0;
  highlightStars(0);
  
  // Reset validation states
  document.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
    el.classList.remove('is-valid', 'is-invalid');
  });
  
  // Reset character counts
  if (userCharCount) userCharCount.textContent = '0';
  if (reviewCharCount) reviewCharCount.textContent = '0';
  
  // Hide rating error
  if (ratingError) {
    ratingError.style.display = 'none';
  }
}

// ===== FETCH REVIEWS =====
function returnReviews(url) {
  showLoading(true);
  
  fetch(url + "movie/" + movieId)
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return res.json();
    })
    .then(function(data) {
      console.log('Reviews:', data);
      reviews = data;
      
      showLoading(false);
      
      // Update review count
      updateReviewCount(data.length);
      
      // Check if no reviews
      if (!data || data.length === 0) {
        showNoReviews();
        return;
      }
      
      hideNoReviews();
      
      // Calculate and display statistics
      calculateStatistics(data);
      
      // Display reviews
      data.forEach((review, index) => {
        createReviewCard(review, index);
      });
    })
    .catch(error => {
      console.error('Error fetching reviews:', error);
      showLoading(false);
      showNotification('Failed to load reviews', 'danger');
      showNoReviews();
    });
}

// ===== CALCULATE STATISTICS =====
let ratingChart = null;

function calculateStatistics(reviewsData) {
  if (!reviewsData || reviewsData.length === 0) {
    return;
  }
  
  // Show statistics section
  const statsSection = document.getElementById('statsSection');
  if (statsSection) {
    statsSection.style.display = 'block';
  }
  
  // Calculate metrics
  const totalReviews = reviewsData.length;
  const ratings = reviewsData.map(r => r.rating || 0).filter(r => r > 0);
  
  // Average rating
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : 0;
  
  // Count by rating
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => {
    if (r >= 1 && r <= 5) {
      ratingCounts[r]++;
    }
  });
  
  // Calculate percentages
  const fiveStarCount = ratingCounts[5];
  const fourPlusCount = ratingCounts[4] + ratingCounts[5];
  const recommendPercent = ratings.length > 0
    ? Math.round((fourPlusCount / ratings.length) * 100)
    : 0;
  
  // Update UI
  document.getElementById('avgRating').textContent = avgRating;
  document.getElementById('totalReviews').textContent = totalReviews;
  document.getElementById('fiveStarCount').textContent = fiveStarCount;
  document.getElementById('recommendPercent').textContent = recommendPercent + '%';
  
  // Update rating bars
  for (let i = 1; i <= 5; i++) {
    const count = ratingCounts[i];
    const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
    
    document.getElementById(`count${i}`).textContent = count;
    document.getElementById(`bar${i}`).style.width = percentage + '%';
  }
  
  // Create/Update chart
  createRatingChart(ratingCounts);
}

function createRatingChart(ratingCounts) {
  const ctx = document.getElementById('ratingChart');
  if (!ctx) return;
  
  // Destroy existing chart
  if (ratingChart) {
    ratingChart.destroy();
  }
  
  // Get theme colors
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#f1f5f9' : '#1f2937';
  const gridColor = isDark ? '#334155' : '#e5e7eb';
  
  // Create new chart
  ratingChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
      datasets: [{
        label: 'Reviews',
        data: [
          ratingCounts[5],
          ratingCounts[4],
          ratingCounts[3],
          ratingCounts[2],
          ratingCounts[1]
        ],
        backgroundColor: [
          '#10b981', // Green
          '#3b82f6', // Blue
          '#f59e0b', // Orange
          '#f97316', // Dark orange
          '#ef4444'  // Red
        ],
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 15,
            font: {
              size: 12,
              family: 'Poppins'
            }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
  
  // Update chart when theme changes
  const observer = new MutationObserver(() => {
    if (ratingChart) {
      const isDark = document.body.classList.contains('dark-mode');
      const textColor = isDark ? '#f1f5f9' : '#1f2937';
      
      ratingChart.options.plugins.legend.labels.color = textColor;
      ratingChart.options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
      ratingChart.options.plugins.tooltip.titleColor = textColor;
      ratingChart.options.plugins.tooltip.bodyColor = textColor;
      ratingChart.data.datasets[0].borderColor = isDark ? '#1e293b' : '#ffffff';
      ratingChart.update();
    }
  });
  
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// ===== CREATE REVIEW CARD =====
function createReviewCard(review, index) {
  const { _id, user, review: reviewText, rating } = review;
  
  const div_card = document.createElement('div');
  div_card.className = 'review-item';
  div_card.id = _id;
  div_card.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s backwards`;
  
  // Get user initials
  const initials = user ? user.substring(0, 2).toUpperCase() : 'NA';
  
  // Create star rating
  const stars = Array(5).fill(0).map((_, i) => 
    `<i class="fas fa-star${i < (rating || 0) ? '' : ' text-muted'}"></i>`
  ).join('');
  
  // Get vote counts
  const votes = getReviewVotes(_id);
  const userVote = getUserVote(_id);
  
  const helpfulClass = userVote === 'helpful' ? 'active' : '';
  const notHelpfulClass = userVote === 'not-helpful' ? 'active' : '';
  
  // Check if current user can edit/delete this review
  const canEdit = canEditReview(user);
  const editDeleteButtons = canEdit ? `
    <div class="review-actions">
      <button class="btn btn-warning btn-sm" onclick="editReview('${_id}', '${escapeHtml(reviewText)}', '${escapeHtml(user)}', ${rating || 0})">
        <i class="fas fa-edit me-2"></i>Edit
      </button>
      <button class="btn btn-danger btn-sm" onclick="deleteReview('${_id}')">
        <i class="fas fa-trash me-2"></i>Delete
      </button>
    </div>
  ` : '';
  
  div_card.innerHTML = `
    <div class="review-header">
      <div class="review-user">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <h5>${escapeHtml(user || 'Anonymous')}</h5>
          <div class="review-rating">
            ${stars}
          </div>
        </div>
      </div>
      <div class="review-helpful">
        <span class="helpful-text">Was this helpful?</span>
        <button class="helpful-btn ${helpfulClass}" onclick="voteReview('${_id}', 'helpful')">
          <i class="fas fa-thumbs-up"></i>
          <span class="vote-count">${votes.helpful}</span>
        </button>
        <button class="helpful-btn not-helpful ${notHelpfulClass}" onclick="voteReview('${_id}', 'not-helpful')">
          <i class="fas fa-thumbs-down"></i>
          <span class="vote-count">${votes.notHelpful}</span>
        </button>
      </div>
    </div>
    <div class="review-body">
      <p class="review-text">${escapeHtml(reviewText || 'No review text')}</p>
      ${editDeleteButtons}
    </div>
  `;
  
  main.appendChild(div_card);
}

// ===== UTILITY FUNCTIONS =====
function sanitizeInput(input) {
  // Remove HTML tags and trim
  return input.replace(/<[^>]*>/g, '').trim();
}

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

function showNoReviews() {
  if (noReviews) {
    noReviews.style.display = 'block';
  }
}

function hideNoReviews() {
  if (noReviews) {
    noReviews.style.display = 'none';
  }
}

function updateReviewCount(count) {
  if (reviewCount) {
    reviewCount.textContent = count;
  }
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
  if (!toastContainer) {
    toastContainer = document.querySelector('.toast-container');
  }
  
  if (!toastContainer) return;
  
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
  
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// ===== REVIEW VOTING SYSTEM =====
function voteReview(reviewId, voteType) {
  const votes = getAllVotes();
  
  // Check if user already voted on this review
  if (!votes[reviewId]) {
    votes[reviewId] = {
      helpful: 0,
      notHelpful: 0,
      userVote: null
    };
  }
  
  const currentVote = votes[reviewId];
  
  // If clicking the same vote, remove it
  if (currentVote.userVote === voteType) {
    if (voteType === 'helpful') {
      currentVote.helpful--;
    } else {
      currentVote.notHelpful--;
    }
    currentVote.userVote = null;
  } else {
    // Remove previous vote if exists
    if (currentVote.userVote === 'helpful') {
      currentVote.helpful--;
    } else if (currentVote.userVote === 'not-helpful') {
      currentVote.notHelpful--;
    }
    
    // Add new vote
    if (voteType === 'helpful') {
      currentVote.helpful++;
    } else {
      currentVote.notHelpful++;
    }
    currentVote.userVote = voteType;
  }
  
  // Save votes
  saveVotes(votes);
  
  // Update UI
  updateVoteButtons(reviewId, currentVote);
}

function getAllVotes() {
  try {
    const votes = localStorage.getItem('reviewVotes');
    return votes ? JSON.parse(votes) : {};
  } catch (error) {
    console.error('Error getting votes:', error);
    return {};
  }
}

function saveVotes(votes) {
  try {
    localStorage.setItem('reviewVotes', JSON.stringify(votes));
  } catch (error) {
    console.error('Error saving votes:', error);
  }
}

function getReviewVotes(reviewId) {
  const votes = getAllVotes();
  if (votes[reviewId]) {
    return {
      helpful: votes[reviewId].helpful || 0,
      notHelpful: votes[reviewId].notHelpful || 0
    };
  }
  return { helpful: 0, notHelpful: 0 };
}

function getUserVote(reviewId) {
  const votes = getAllVotes();
  return votes[reviewId] ? votes[reviewId].userVote : null;
}

function updateVoteButtons(reviewId, voteData) {
  const reviewElement = document.getElementById(reviewId);
  if (!reviewElement) return;
  
  const helpfulBtn = reviewElement.querySelector('.helpful-btn:not(.not-helpful)');
  const notHelpfulBtn = reviewElement.querySelector('.helpful-btn.not-helpful');
  
  if (helpfulBtn) {
    const helpfulCount = helpfulBtn.querySelector('.vote-count');
    if (helpfulCount) {
      helpfulCount.textContent = voteData.helpful;
    }
    
    if (voteData.userVote === 'helpful') {
      helpfulBtn.classList.add('active');
    } else {
      helpfulBtn.classList.remove('active');
    }
  }
  
  if (notHelpfulBtn) {
    const notHelpfulCount = notHelpfulBtn.querySelector('.vote-count');
    if (notHelpfulCount) {
      notHelpfulCount.textContent = voteData.notHelpful;
    }
    
    if (voteData.userVote === 'not-helpful') {
      notHelpfulBtn.classList.add('active');
    } else {
      notHelpfulBtn.classList.remove('active');
    }
  }
}

// ===== AUTHENTICATION & AUTHORIZATION =====
function checkAuthState() {
  currentUser = getCurrentUser();
  
  // Get elements
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const userMenu = document.getElementById('userMenu');
  const reviewForm = document.getElementById('newReviewForm');
  
  if (currentUser) {
    // User is logged in
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'block';
      
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
    
    // Pre-fill username in review form
    if (newUserInput) {
      newUserInput.value = currentUser.name;
      newUserInput.readOnly = true;
      newUserInput.style.background = '#e9ecef';
    }
  } else {
    // User is NOT logged in
    if (loginLink) loginLink.style.display = 'block';
    if (registerLink) registerLink.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
    
    // Show message to login for posting reviews
    if (reviewForm) {
      const loginMessage = document.createElement('div');
      loginMessage.className = 'alert alert-info';
      loginMessage.innerHTML = `
        <i class="fas fa-info-circle me-2"></i>
        Please <a href="login.html" class="alert-link">login</a> to write a review
      `;
      reviewForm.parentElement.insertBefore(loginMessage, reviewForm);
      reviewForm.style.display = 'none';
    }
  }
}

function canEditReview(reviewUsername) {
  if (!currentUser) return false;
  
  // Admin can edit any review
  if (currentUser.role === 'admin') return true;
  
  // User can only edit their own reviews
  return currentUser.name === reviewUsername || currentUser.username === reviewUsername;
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
