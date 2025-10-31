// =====================================================
// AUTHENTICATION SYSTEM - LOGIN & REGISTER
// =====================================================

// Demo users database (In production, this would be on backend)
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@moviereview.com',
    password: 'admin123', // In production: hashed password
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=667eea&color=fff'
  },
  {
    id: 2,
    username: 'user',
    email: 'user@moviereview.com',
    password: 'user123',
    name: 'Regular User',
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=Regular+User&background=764ba2&color=fff'
  }
];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const currentUser = getCurrentUser();
  if (currentUser && (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html'))) {
    // Redirect to dashboard if already logged in
    window.location.href = 'dashboard.html';
    return;
  }

  // Setup event listeners based on page
  if (document.getElementById('loginForm')) {
    setupLoginPage();
  }
  
  if (document.getElementById('registerForm')) {
    setupRegisterPage();
  }
});

// ===== LOGIN PAGE =====
function setupLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const loginBtn = document.getElementById('loginBtn');
  
  // Toggle password visibility
  if (togglePassword) {
    togglePassword.addEventListener('click', () => {
      const passwordInput = document.getElementById('loginPassword');
      const icon = togglePassword.querySelector('i');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  }
  
  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Check remember me
  const rememberMe = localStorage.getItem('rememberMe');
  if (rememberMe) {
    document.getElementById('loginUsername').value = rememberMe;
    document.getElementById('rememberMe').checked = true;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  
  // Validation
  if (!username) {
    showError('usernameError', 'Please enter your username or email');
    return;
  }
  
  if (!password) {
    showError('passwordError', 'Please enter your password');
    return;
  }
  
  // Show loading
  setLoadingState(true, 'login');
  
  // Simulate API call delay
  await sleep(1000);
  
  // Check credentials
  const user = DEMO_USERS.find(u => 
    (u.username === username || u.email === username) && u.password === password
  );
  
  if (user) {
    // Save remember me
    if (rememberMe) {
      localStorage.setItem('rememberMe', username);
    } else {
      localStorage.removeItem('rememberMe');
    }
    
    // Create session
    const session = {
      userId: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      loginTime: new Date().toISOString()
    };
    
    // Save session
    localStorage.setItem('currentUser', JSON.stringify(session));
    
    // Show success
    showNotification('Login successful! Redirecting...', 'success');
    
    // Redirect based on role
    await sleep(1000);
    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } else {
    setLoadingState(false, 'login');
    showError('passwordError', 'Invalid username or password');
    showNotification('Login failed. Please check your credentials.', 'danger');
    
    // Shake animation
    const form = document.getElementById('loginForm');
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
  }
}

// ===== REGISTER PAGE =====
function setupRegisterPage() {
  const registerForm = document.getElementById('registerForm');
  const toggleRegPassword = document.getElementById('toggleRegPassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const passwordInput = document.getElementById('registerPassword');
  
  // Toggle password visibility
  if (toggleRegPassword) {
    toggleRegPassword.addEventListener('click', () => {
      const input = document.getElementById('registerPassword');
      const icon = toggleRegPassword.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  }
  
  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener('click', () => {
      const input = document.getElementById('confirmPassword');
      const icon = toggleConfirmPassword.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  }
  
  // Password strength indicator
  if (passwordInput) {
    passwordInput.addEventListener('input', checkPasswordStrength);
  }
  
  // Real-time validation
  document.getElementById('registerUsername')?.addEventListener('input', validateUsername);
  document.getElementById('registerEmail')?.addEventListener('input', validateEmail);
  document.getElementById('confirmPassword')?.addEventListener('input', validateConfirmPassword);
  
  // Handle form submission
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
}

function checkPasswordStrength(e) {
  const password = e.target.value;
  const strengthFill = document.getElementById('strengthFill');
  const strengthText = document.getElementById('strengthText');
  
  if (!password) {
    strengthFill.className = 'strength-fill';
    strengthText.textContent = 'Password strength';
    strengthText.className = 'strength-text';
    return;
  }
  
  let strength = 0;
  
  // Length
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  
  // Has uppercase and lowercase
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  
  // Has numbers
  if (/\d/.test(password)) strength++;
  
  // Has special characters
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  // Update UI
  if (strength <= 2) {
    strengthFill.className = 'strength-fill weak';
    strengthText.textContent = 'Weak password';
    strengthText.className = 'strength-text weak';
  } else if (strength <= 4) {
    strengthFill.className = 'strength-fill medium';
    strengthText.textContent = 'Medium strength';
    strengthText.className = 'strength-text medium';
  } else {
    strengthFill.className = 'strength-fill strong';
    strengthText.textContent = 'Strong password';
    strengthText.className = 'strength-text strong';
  }
}

function validateUsername(e) {
  const username = e.target.value.trim();
  const errorDiv = document.getElementById('usernameRegError');
  const input = e.target;
  
  if (username.length === 0) {
    input.classList.remove('is-valid', 'is-invalid');
    errorDiv.textContent = '';
    return;
  }
  
  if (username.length < 3) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorDiv.textContent = 'Username must be at least 3 characters';
    return;
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorDiv.textContent = 'Username can only contain letters and numbers';
    return;
  }
  
  // Check if username already exists
  const exists = DEMO_USERS.some(u => u.username === username);
  if (exists) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorDiv.textContent = 'Username already taken';
    return;
  }
  
  input.classList.add('is-valid');
  input.classList.remove('is-invalid');
  errorDiv.textContent = '';
}

function validateEmail(e) {
  const email = e.target.value.trim();
  const errorDiv = document.getElementById('emailError');
  const input = e.target;
  
  if (email.length === 0) {
    input.classList.remove('is-valid', 'is-invalid');
    errorDiv.textContent = '';
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorDiv.textContent = 'Please enter a valid email address';
    return;
  }
  
  // Check if email already exists
  const exists = DEMO_USERS.some(u => u.email === email);
  if (exists) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorDiv.textContent = 'Email already registered';
    return;
  }
  
  input.classList.add('is-valid');
  input.classList.remove('is-invalid');
  errorDiv.textContent = '';
}

function validateConfirmPassword(e) {
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = e.target.value;
  const errorDiv = document.getElementById('confirmPasswordError');
  const input = e.target;
  
  if (confirmPassword.length === 0) {
    input.classList.remove('is-valid', 'is-invalid');
    errorDiv.textContent = '';
    return;
  }
  
  if (password !== confirmPassword) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorDiv.textContent = 'Passwords do not match';
    return;
  }
  
  input.classList.add('is-valid');
  input.classList.remove('is-invalid');
  errorDiv.textContent = '';
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value.trim();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const agreeTerms = document.getElementById('agreeTerms').checked;
  
  // Validation
  let isValid = true;
  
  if (!name || name.length < 2) {
    showError('nameError', 'Please enter your full name (minimum 2 characters)');
    isValid = false;
  }
  
  if (!username || username.length < 3) {
    showError('usernameRegError', 'Please enter a username (minimum 3 characters)');
    isValid = false;
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    showError('usernameRegError', 'Username can only contain letters and numbers');
    isValid = false;
  }
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('emailError', 'Please enter a valid email address');
    isValid = false;
  }
  
  if (!password || password.length < 6) {
    showError('passwordRegError', 'Password must be at least 6 characters');
    isValid = false;
  }
  
  if (password !== confirmPassword) {
    showError('confirmPasswordError', 'Passwords do not match');
    isValid = false;
  }
  
  if (!agreeTerms) {
    showError('termsError', 'You must agree to the terms and conditions');
    isValid = false;
  }
  
  if (!isValid) {
    showNotification('Please fix the errors in the form', 'danger');
    return;
  }
  
  // Show loading
  setLoadingState(true, 'register');
  
  // Simulate API call delay
  await sleep(1500);
  
  // Create new user
  const newUser = {
    id: DEMO_USERS.length + 1,
    username: username,
    email: email,
    password: password, // In production: hash this
    name: name,
    role: 'user',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=667eea&color=fff`
  };
  
  // Add to demo users (in production: save to database)
  DEMO_USERS.push(newUser);
  
  // Save to localStorage for persistence
  const allUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  allUsers.push(newUser);
  localStorage.setItem('registeredUsers', JSON.stringify(allUsers));
  
  // Show success
  showNotification('Registration successful! Redirecting to login...', 'success');
  
  // Redirect to login
  await sleep(1500);
  window.location.href = 'login.html';
}

// ===== QUICK LOGIN (DEMO) =====
function quickLogin(role) {
  const user = DEMO_USERS.find(u => u.role === role);
  
  if (!user) return;
  
  document.getElementById('loginUsername').value = user.username;
  document.getElementById('loginPassword').value = user.password;
  
  showNotification(`Quick login as ${role}. Click Login button.`, 'info');
}

// ===== SOCIAL LOGIN (DEMO - Frontend only) =====
function socialLogin(provider) {
  showNotification(`${provider} login is not implemented in this demo`, 'info');
}

// ===== UTILITY FUNCTIONS =====
function getCurrentUser() {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

function setLoadingState(loading, type) {
  const btn = document.getElementById(type === 'login' ? 'loginBtn' : 'registerBtn');
  const btnText = document.getElementById(type === 'login' ? 'loginBtnText' : 'registerBtnText');
  const spinner = document.getElementById(type === 'login' ? 'loginSpinner' : 'registerSpinner');
  
  if (loading) {
    btn.disabled = true;
    btn.classList.add('loading');
    btnText.textContent = type === 'login' ? 'Logging in...' : 'Creating account...';
    spinner.classList.remove('d-none');
  } else {
    btn.disabled = false;
    btn.classList.remove('loading');
    btnText.textContent = type === 'login' ? 'Login' : 'Create Account';
    spinner.classList.add('d-none');
  }
}

function showError(elementId, message) {
  const errorDiv = document.getElementById(elementId);
  if (errorDiv) {
    errorDiv.textContent = message;
    const input = errorDiv.previousElementSibling;
    if (input && input.classList.contains('form-control')) {
      input.classList.add('is-invalid');
    }
  }
}

function clearErrors() {
  document.querySelectorAll('.invalid-feedback').forEach(div => {
    div.textContent = '';
  });
  document.querySelectorAll('.form-control').forEach(input => {
    input.classList.remove('is-invalid');
  });
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.getCurrentUser = getCurrentUser;
  window.logout = logout;
  window.quickLogin = quickLogin;
  window.socialLogin = socialLogin;
}
