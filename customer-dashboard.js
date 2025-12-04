let currentUser = null;
let selectedRating = 0;

function formatDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
}

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            item.classList.add('active');
            
            const sectionId = item.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('active');
                
                const titles = {
                    'overview': 'Dashboard Overview',
                    'browse': 'Browse Vehicles',
                    'bookings': 'My Bookings',
                    'history': 'Rental History',
                    'reviews': 'Reviews & Feedback',
                    'profile': 'My Profile'
                };
                document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
                
                if (sectionId === 'bookings') {
                    loadBookingsList();
                } else if (sectionId === 'history') {
                    loadHistory();
                } else if (sectionId === 'reviews') {
                    loadHistory(); // Load history to populate review dropdown
                }
            }
        });
    });
}

async function loadUserData() {
    currentUser = auth.currentUser;
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            document.querySelectorAll('#userName, #profileName').forEach(el => {
                el.textContent = userData.name || 'User';
            });
            
            document.getElementById('profileEmail').textContent = userData.email || currentUser.email;
            
            if (userData.createdAt) {
                const createdDate = userData.createdAt.toDate();
                const options = { year: 'numeric', month: 'long' };
                document.getElementById('memberSince').textContent = createdDate.toLocaleDateString('en-US', options);
            }
            
            document.getElementById('totalTrips').textContent = userData.totalTrips || 0;
            document.getElementById('loyaltyPoints').textContent = userData.loyaltyPoints || 0;
            
            document.getElementById('fullName').value = userData.name || '';
            document.getElementById('phoneNumber').value = userData.phoneNumber || '';
            document.getElementById('address').value = userData.address || '';
            document.getElementById('driversLicense').value = userData.driversLicense || '';
            document.getElementById('paymentMethod').value = userData.paymentMethod || '';
            
            loadActiveBookings();
            loadMyReviews();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to load user data', 'error');
    }
}

async function loadMyReviews() {
    try {
        const reviewsList = document.getElementById('myReviewsList');
        if (!reviewsList) return;
        
        const reviewsSnapshot = await db.collection('reviews')
            .where('userId', '==', currentUser.uid)
            .get();
        
        reviewsList.innerHTML = '';
        
        if (reviewsSnapshot.empty) {
            reviewsList.innerHTML = '<div class="empty-state"><i class="fas fa-comment-slash"></i><p>You haven\'t written any reviews yet</p></div>';
            return;
        }
        
        reviewsSnapshot.forEach(doc => {
            const review = doc.data();
            const reviewCard = document.createElement('div');
            reviewCard.style.cssText = 'padding: 1rem; background: var(--card-bg); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; margin-bottom: 1rem;';
            
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const reviewDate = review.createdAt ? review.createdAt.toDate().toLocaleDateString() : 'N/A';
            
            reviewCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--warning); font-size: 1.2rem;">${stars}</span>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">${reviewDate}</span>
                </div>
                <p style="color: var(--text-primary); line-height: 1.6;">${review.text}</p>
            `;
            
            reviewsList.appendChild(reviewCard);
        });
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

async function loadActiveBookings() {
    try {
        const bookingsSnapshot = await db.collection('bookings')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'active')
            .get();
        
        document.getElementById('activeBookings').textContent = bookingsSnapshot.size;
        
        loadBookingsList();
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

async function loadBookingsList() {
    try {
        const bookingsList = document.getElementById('bookingsList');
        if (!bookingsList) return;
        
        const bookingsSnapshot = await db.collection('bookings')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'active')
            .get();
        
        bookingsList.innerHTML = '';
        
        if (bookingsSnapshot.empty) {
            bookingsList.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>No active bookings</p></div>';
            return;
        }
        
        const bookingsArray = [];
        bookingsSnapshot.forEach(doc => {
            bookingsArray.push({ id: doc.id, ...doc.data() });
        });
        
        bookingsArray.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            }
            return 0;
        });
        
        bookingsArray.forEach(booking => {
            const bookingCard = document.createElement('div');
            bookingCard.className = 'booking-card';
            bookingCard.style.cssText = 'background: var(--card-bg); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-lg); padding: var(--spacing-lg); margin-bottom: var(--spacing-md);';
            
            bookingCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin-bottom: 0.5rem;">${booking.vehicleName}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;"><i class="fas fa-map-marker-alt"></i> ${booking.location}</p>
                    </div>
                    <span style="padding: 0.25rem 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 12px; font-size: 0.85rem; color: var(--success);">Active</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">Pickup Date</p>
                        <p style="font-weight: 600;">${booking.pickupDate}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">Return Date</p>
                        <p style="font-weight: 600;">${booking.returnDate}</p>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid rgba(139, 92, 246, 0.1);">
                    <div>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">Total Amount</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-violet);">$${booking.totalPrice}</p>
                    </div>
                    <button onclick="endRide('${booking.id}')" style="padding: 0.75rem 1.5rem; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--error); border-radius: 8px; color: var(--error); font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'">
                        <i class="fas fa-stop-circle"></i> End Ride
                    </button>
                </div>
            `;
            
            bookingsList.appendChild(bookingCard);
        });
    } catch (error) {
        console.error('Error loading bookings list:', error);
    }
}

// End ride function
async function endRide(bookingId) {
    if (!confirm('Are you sure you want to end this ride?')) return;
    
    try {
        await db.collection('bookings').doc(bookingId).update({
            status: 'completed',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Ride ended successfully!', 'success');
        loadActiveBookings();
        loadBookingsList();
        loadHistory();
    } catch (error) {
        console.error('Error ending ride:', error);
        showToast('Failed to end ride', 'error');
    }
}

// Load rental history
async function loadHistory() {
    try {
        const historyBody = document.getElementById('historyTableBody');
        if (!historyBody) return;
        
        const historySnapshot = await db.collection('bookings')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'completed')
            .get();
        
        historyBody.innerHTML = '';
        
        if (historySnapshot.empty) {
            historyBody.innerHTML = '<tr class="empty-row"><td colspan="5">No rental history found</td></tr>';
            return;
        }
        
        const historyArray = [];
        historySnapshot.forEach(doc => {
            historyArray.push({ id: doc.id, ...doc.data() });
        });
        
        historyArray.sort((a, b) => {
            if (a.completedAt && b.completedAt) {
                return b.completedAt.toMillis() - a.completedAt.toMillis();
            }
            return 0;
        });
        
        historyArray.forEach(rental => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rental.vehicleName}</td>
                <td>${rental.pickupDate}</td>
                <td>${rental.returnDate}</td>
                <td>$${rental.totalPrice}</td>
                <td><span style="color: var(--success);">Completed</span></td>
            `;
            historyBody.appendChild(row);
        });
        
        populateReviewDropdown(historyArray);
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function populateReviewDropdown(historyArray) {
    const reviewSelect = document.getElementById('reviewRental');
    if (!reviewSelect) return;
    
    reviewSelect.innerHTML = '<option value="">Choose a completed rental</option>';
    
    historyArray.forEach(rental => {
        const option = document.createElement('option');
        option.value = rental.id;
        option.textContent = `${rental.vehicleName} - ${rental.pickupDate}`;
        reviewSelect.appendChild(option);
    });
}

async function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        const recentBookings = await db.collection('bookings')
            .where('userId', '==', currentUser.uid)
            .limit(10)
            .get();
        
        activityList.innerHTML = '';
        
        if (recentBookings.empty) {
            activityList.innerHTML = '<div class="activity-item empty"><i class="fas fa-info-circle"></i><p>No recent activity. Start by booking a vehicle!</p></div>';
            return;
        }
        
        const bookingsArray = [];
        recentBookings.forEach(doc => {
            const data = doc.data();
            bookingsArray.push({ id: doc.id, ...data });
        });
        
        bookingsArray.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            }
            return 0;
        });
        
        const displayBookings = bookingsArray.slice(0, 5);
        
        displayBookings.forEach(booking => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            const statusColor = booking.status === 'active' ? 'var(--success)' : 'var(--text-muted)';
            const statusIcon = booking.status === 'active' ? 'fa-car' : 'fa-check-circle';
            
            activityItem.innerHTML = `
                <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center;">
                    <i class="fas ${statusIcon}" style="color: ${statusColor};"></i>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 0.25rem;">${booking.vehicleName}</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">${booking.status === 'active' ? 'Currently rented' : 'Completed'} - ${booking.pickupDate}</p>
                </div>
                <span style="color: ${statusColor}; font-weight: 600;">$${booking.totalPrice}</span>
            `;
            
            activityList.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Error loading recent activity:', error);
        const activityList = document.getElementById('activityList');
        if (activityList) {
            activityList.innerHTML = '<div class="activity-item empty"><i class="fas fa-info-circle"></i><p>No recent activity. Start by booking a vehicle!</p></div>';
        }
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('address').value.trim();
    const driversLicense = document.getElementById('driversLicense').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!fullName) {
        showToast('Please enter your full name', 'error');
        return;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            name: fullName,
            phoneNumber: phoneNumber,
            address: address,
            driversLicense: driversLicense,
            paymentMethod: paymentMethod,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Profile updated successfully!', 'success');
        
        document.querySelectorAll('#userName, #profileName').forEach(el => {
            el.textContent = fullName;
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
    }
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        await currentUser.reauthenticateWithCredential(credential);
        
        await currentUser.updatePassword(newPassword);
        
        showToast('Password changed successfully!', 'success');
        
        document.getElementById('passwordForm').reset();
    } catch (error) {
        console.error('Error changing password:', error);
        let errorMessage = 'Failed to change password';
        
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Current password is incorrect';
        }
        
        showToast(errorMessage, 'error');
    }
});

const starRating = document.getElementById('starRating');
if (starRating) {
    const stars = starRating.querySelectorAll('i');
    
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            
            stars.forEach((s, index) => {
                if (index < selectedRating) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'active');
                } else {
                    s.classList.remove('fas', 'active');
                    s.classList.add('far');
                }
            });
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.getAttribute('data-rating'));
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
    
    starRating.addEventListener('mouseleave', () => {
        stars.forEach((s, index) => {
            if (index < selectedRating) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    });
}

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rentalId = document.getElementById('reviewRental').value;
    const reviewText = document.getElementById('reviewText').value.trim();
    
    if (!rentalId) {
        showToast('Please select a rental', 'error');
        return;
    }
    
    if (selectedRating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }
    
    if (!reviewText) {
        showToast('Please write a review', 'error');
        return;
    }
    
    try {
        await db.collection('reviews').add({
            userId: currentUser.uid,
            rentalId: rentalId,
            rating: selectedRating,
            text: reviewText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Review submitted successfully!', 'success');
        
        document.getElementById('reviewForm').reset();
        selectedRating = 0;
        const stars = starRating.querySelectorAll('i');
        stars.forEach(s => {
            s.classList.remove('fas', 'active');
            s.classList.add('far');
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Failed to submit review', 'error');
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showToast('Failed to logout', 'error');
    }
});

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

auth.onAuthStateChanged((user) => {
    if (user) {
        formatDate();
        initializeNavigation();
        loadUserData();
        
        const today = new Date().toISOString().split('T')[0];
        const pickupDate = document.getElementById('pickupDate');
        const returnDate = document.getElementById('returnDate');
        
        if (pickupDate) pickupDate.min = today;
        if (returnDate) returnDate.min = today;
        
        if (pickupDate && returnDate) {
            pickupDate.addEventListener('change', () => {
                returnDate.min = pickupDate.value;
            });
        }
    } else {
        window.location.href = 'index.html';
    }
});
