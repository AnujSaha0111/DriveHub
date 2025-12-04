let currentUserType = 'customer';

function openAuthModal(userType) {
    currentUserType = userType;
    const modal = document.getElementById('authModal');
    const loginTitle = document.getElementById('loginTitle');
    
    loginTitle.textContent = userType === 'agent' ? 'Agent Login' : 'Customer Login';
    
    modal.classList.add('active');
    showLogin();
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
    clearForms();
}

function showLogin(event) {
    if (event) event.preventDefault();
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('resetForm').classList.add('hidden');
    clearErrors();
}

function showSignup(event) {
    if (event) event.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('resetForm').classList.add('hidden');
    clearErrors();
}

function showResetPassword(event) {
    if (event) event.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('resetForm').classList.remove('hidden');
    clearErrors();
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showError('loginError', 'Please fill in all fields');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Logging in...</span>';
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('User data not found');
        }
        
        const userData = userDoc.data();
        
        if (userData.userType !== currentUserType) {
            await auth.signOut();
            throw new Error(`This account is registered as a ${userData.userType}. Please use the correct login.`);
        }
        
        showToast('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            if (userData.userType === 'agent') {
                window.location.href = 'agent-dashboard.html';
            } else {
                window.location.href = 'customer-dashboard.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'Invalid email or password';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later';
                break;
            default:
                errorMessage = error.message || errorMessage;
        }
        
        showError('loginError', errorMessage);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const signupBtn = document.getElementById('signupBtn');
    
    if (!name || !email || !password || !confirmPassword) {
        showError('signupError', 'Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('signupError', 'Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showError('signupError', 'Password must be at least 6 characters');
        return;
    }
    
    signupBtn.disabled = true;
    signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creating account...</span>';
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            userType: currentUserType,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            phoneNumber: '',
            address: '',
            driversLicense: '',
            paymentMethod: '',
            loyaltyPoints: 0,
            totalTrips: 0
        });
        
        showToast('Account created successfully!', 'success');
        
        setTimeout(() => {
            showLogin();
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'Signup failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email is already registered. Please login instead';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak';
                break;
            default:
                errorMessage = error.message || errorMessage;
        }
        
        showError('signupError', errorMessage);
    } finally {
        signupBtn.disabled = false;
        signupBtn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
    }
}

async function handleResetPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    const resetBtn = document.getElementById('resetBtn');
    
    if (!email) {
        showError('resetError', 'Please enter your email address');
        return;
    }
    
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Sending...</span>';
    
    try {
        await auth.sendPasswordResetEmail(email);
        showToast('Password reset email sent! Check your inbox.', 'success');
        
        setTimeout(() => {
            showLogin();
        }, 2000);
        
    } catch (error) {
        console.error('Reset password error:', error);
        let errorMessage = 'Failed to send reset email';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            default:
                errorMessage = error.message || errorMessage;
        }
        
        showError('resetError', errorMessage);
    } finally {
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<span>Send Reset Link</span><i class="fas fa-paper-plane"></i>';
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('active');
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.classList.remove('active');
        element.textContent = '';
    });
}

function clearForms() {
    document.querySelectorAll('input').forEach(input => {
        if (input.type !== 'checkbox') {
            input.value = '';
        }
    });
    clearErrors();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
    } else {
        icon.className = 'fas fa-info-circle';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAuthModal();
    }
});

console.log('DriveHub Rentals App initialized');
