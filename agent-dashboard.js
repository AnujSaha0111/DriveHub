let currentAgent = null;

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
                    'overview': 'Analytics Dashboard',
                    'vehicles': 'Manage Vehicles',
                    'rentals': 'Rental Requests',
                    'customers': 'Customer Database',
                    'reports': 'Revenue Reports',
                    'reviews': 'Customer Reviews',
                    'profile': 'Agent Profile'
                };
                document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
            }
        });
    });
}

async function loadAgentData() {
    currentAgent = auth.currentUser;
    
    if (!currentAgent) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const agentDoc = await db.collection('users').doc(currentAgent.uid).get();
        
        if (agentDoc.exists) {
            const agentData = agentDoc.data();
            
            if (agentData.userType !== 'agent') {
                await auth.signOut();
                window.location.href = 'index.html';
                return;
            }
            
            document.querySelectorAll('#agentName, #profileName').forEach(el => {
                el.textContent = agentData.name || 'Agent';
            });
            
            document.getElementById('profileEmail').textContent = agentData.email || currentAgent.email;
            
            if (agentData.createdAt) {
                const createdDate = agentData.createdAt.toDate();
                const options = { year: 'numeric', month: 'long' };
                document.getElementById('memberSince').textContent = createdDate.toLocaleDateString('en-US', options);
            }
            
            document.getElementById('fullName').value = agentData.name || '';
            document.getElementById('phoneNumber').value = agentData.phoneNumber || '';
            
            loadDashboardStats();
            loadCustomers();
            loadVehicles();
            loadAgentReviews();
        }
    } catch (error) {
        console.error('Error loading agent data:', error);
        showToast('Failed to load agent data', 'error');
    }
}

async function loadDashboardStats() {
    try {
        const vehiclesSnapshot = await db.collection('vehicles')
            .where('agentId', '==', currentAgent.uid)
            .get();
        document.getElementById('totalVehicles').textContent = vehiclesSnapshot.size;
        
        const vehicleIds = [];
        vehiclesSnapshot.forEach(doc => {
            vehicleIds.push(doc.id);
        });
        
        let activeRentals = 0;
        if (vehicleIds.length > 0) {
            const rentalsSnapshot = await db.collection('bookings')
                .where('vehicleId', 'in', vehicleIds)
                .where('status', '==', 'active')
                .get();
            activeRentals = rentalsSnapshot.size;
        }
        document.getElementById('activeRentals').textContent = activeRentals;
        
        const customerIds = new Set();
        if (vehicleIds.length > 0) {
            const bookingsSnapshot = await db.collection('bookings')
                .where('vehicleId', 'in', vehicleIds)
                .get();
            bookingsSnapshot.forEach(doc => {
                customerIds.add(doc.data().userId);
            });
        }
        document.getElementById('totalCustomers').textContent = customerIds.size;
        
        let monthlyRevenue = 0;
        if (vehicleIds.length > 0) {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const monthlyBookings = await db.collection('bookings')
                .where('vehicleId', 'in', vehicleIds)
                .where('createdAt', '>=', firstDayOfMonth)
                .get();
            
            monthlyBookings.forEach(doc => {
                const booking = doc.data();
                monthlyRevenue += booking.totalPrice || 0;
            });
        }
        
        document.getElementById('monthlyRevenue').textContent = '$' + monthlyRevenue.toFixed(0);
        document.getElementById('monthRevenue').textContent = '$' + monthlyRevenue.toFixed(0);
        
        loadRecentRentals();
        loadRevenueReports();
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent rental requests for THIS agent's vehicles
async function loadRecentRentals() {
    try {
        const recentList = document.getElementById('recentRentals');
        if (!recentList) return;
        
        // First get this agent's vehicles
        const agentVehicles = await db.collection('vehicles')
            .where('agentId', '==', currentAgent.uid)
            .get();
        
        const vehicleIds = [];
        agentVehicles.forEach(doc => {
            vehicleIds.push(doc.id);
        });
        
        if (vehicleIds.length === 0) {
            recentList.innerHTML = '<div class="activity-item empty"><i class="fas fa-info-circle"></i><p>No vehicles added yet. Add vehicles to see rental requests!</p></div>';
            return;
        }
        
        // Get bookings for these vehicles
        const recentSnapshot = await db.collection('bookings')
            .where('vehicleId', 'in', vehicleIds)
            .where('status', '==', 'active')
            .limit(10)
            .get();
        
        recentList.innerHTML = '';
        
        if (recentSnapshot.empty) {
            recentList.innerHTML = '<div class="activity-item empty"><i class="fas fa-info-circle"></i><p>No recent rental requests</p></div>';
            return;
        }
        
        // Convert to array and sort
        const rentalsArray = [];
        for (const doc of recentSnapshot.docs) {
            const rental = doc.data();
            const userDoc = await db.collection('users').doc(rental.userId).get();
            const userName = userDoc.exists ? userDoc.data().name : 'Unknown';
            rentalsArray.push({ ...rental, userName, id: doc.id });
        }
        
        // Sort by createdAt if available
        rentalsArray.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            }
            return 0;
        });
        
        // Take first 5
        const displayRentals = rentalsArray.slice(0, 5);
        
        displayRentals.forEach(rental => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            activityItem.innerHTML = `
                <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-car" style="color: var(--success);"></i>
                </div>
                <div style="flex: 1;">
                    <h4 style="margin-bottom: 0.25rem;">${rental.userName} - ${rental.vehicleName}</h4>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">${rental.pickupDate} to ${rental.returnDate}</p>
                </div>
                <span style="color: var(--success); font-weight: 600;">$${rental.totalPrice}</span>
            `;
            
            recentList.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Error loading recent rentals:', error);
        const recentList = document.getElementById('recentRentals');
        if (recentList) {
            recentList.innerHTML = '<div class="activity-item empty"><i class="fas fa-info-circle"></i><p>Error loading rental requests</p></div>';
        }
    }
}

// Load revenue reports for THIS agent only
async function loadRevenueReports() {
    try {
        // First get this agent's vehicles
        const agentVehicles = await db.collection('vehicles')
            .where('agentId', '==', currentAgent.uid)
            .get();
        
        const vehicleIds = [];
        agentVehicles.forEach(doc => {
            vehicleIds.push(doc.id);
        });
        
        if (vehicleIds.length === 0) {
            document.getElementById('todayRevenue').textContent = '$0';
            document.getElementById('weekRevenue').textContent = '$0';
            return;
        }
        
        // Get all bookings for these vehicles
        const bookingsSnapshot = await db.collection('bookings')
            .where('vehicleId', 'in', vehicleIds)
            .get();
        
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        let todayRevenue = 0;
        let weekRevenue = 0;
        
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            const bookingDate = booking.createdAt ? booking.createdAt.toDate() : null;
            
            if (bookingDate) {
                if (bookingDate >= startOfDay) {
                    todayRevenue += booking.totalPrice || 0;
                }
                if (bookingDate >= startOfWeek) {
                    weekRevenue += booking.totalPrice || 0;
                }
            }
        });
        
        document.getElementById('todayRevenue').textContent = '$' + todayRevenue.toFixed(0);
        document.getElementById('weekRevenue').textContent = '$' + weekRevenue.toFixed(0);
    } catch (error) {
        console.error('Error loading revenue reports:', error);
    }
}

// Load customers who have booked from this agent
async function loadCustomers() {
    try {
        // First, get all vehicles from this agent
        const agentVehicles = await db.collection('vehicles')
            .where('agentId', '==', currentAgent.uid)
            .get();
        
        const vehicleIds = [];
        agentVehicles.forEach(doc => {
            vehicleIds.push(doc.id);
        });
        
        if (vehicleIds.length === 0) {
            const tableBody = document.getElementById('customersTableBody');
            tableBody.innerHTML = '<tr class="empty-row"><td colspan="5">No customers yet. Add vehicles to get started!</td></tr>';
            return;
        }
        
        // Get all bookings for these vehicles
        const bookingsSnapshot = await db.collection('bookings')
            .where('vehicleId', 'in', vehicleIds)
            .get();
        
        // Get unique customer IDs
        const customerIds = new Set();
        bookingsSnapshot.forEach(doc => {
            customerIds.add(doc.data().userId);
        });
        
        if (customerIds.size === 0) {
            const tableBody = document.getElementById('customersTableBody');
            tableBody.innerHTML = '<tr class="empty-row"><td colspan="5">No customers have booked your vehicles yet</td></tr>';
            return;
        }
        
        // Load customer data and calculate trips from THIS agent
        const tableBody = document.getElementById('customersTableBody');
        tableBody.innerHTML = '';
        
        for (const customerId of customerIds) {
            const customerDoc = await db.collection('users').doc(customerId).get();
            if (customerDoc.exists) {
                const customer = customerDoc.data();
                
                // Count trips from THIS agent only
                let agentTrips = 0;
                bookingsSnapshot.forEach(doc => {
                    if (doc.data().userId === customerId) {
                        agentTrips++;
                    }
                });
                
                const row = document.createElement('tr');
                
                const memberSince = customer.createdAt ? 
                    customer.createdAt.toDate().toLocaleDateString() : 'N/A';
                
                row.innerHTML = `
                    <td>${customer.name || 'N/A'}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${agentTrips}</td>
                    <td>${customer.loyaltyPoints || 0}</td>
                    <td>${memberSince}</td>
                `;
                
                tableBody.appendChild(row);
            }
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        const tableBody = document.getElementById('customersTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr class="empty-row"><td colspan="5">Error loading customers</td></tr>';
        }
    }
}

// Load reviews for this agent's vehicles
async function loadAgentReviews() {
    try {
        const reviewsList = document.getElementById('agentReviewsList');
        if (!reviewsList) return;
        
        // First get this agent's vehicles
        const agentVehicles = await db.collection('vehicles')
            .where('agentId', '==', currentAgent.uid)
            .get();
        
        const vehicleIds = [];
        const vehicleNames = {};
        agentVehicles.forEach(doc => {
            vehicleIds.push(doc.id);
            vehicleNames[doc.id] = doc.data().name;
        });
        
        if (vehicleIds.length === 0) {
            reviewsList.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>Add vehicles to receive reviews</p></div>';
            return;
        }
        
        // Get all bookings for these vehicles
        const bookingsSnapshot = await db.collection('bookings')
            .where('vehicleId', 'in', vehicleIds)
            .get();
        
        // Get rental IDs
        const rentalIds = [];
        bookingsSnapshot.forEach(doc => {
            rentalIds.push(doc.id);
        });
        
        if (rentalIds.length === 0) {
            reviewsList.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>No rentals yet. Reviews will appear here once customers rent your vehicles.</p></div>';
            return;
        }
        
        // Get reviews for these rentals
        const reviewsSnapshot = await db.collection('reviews')
            .where('rentalId', 'in', rentalIds)
            .get();
        
        reviewsList.innerHTML = '';
        
        if (reviewsSnapshot.empty) {
            reviewsList.innerHTML = '<div class="empty-state"><i class="fas fa-star"></i><p>No reviews yet. Customers can leave reviews after completing rentals.</p></div>';
            return;
        }
        
        // Load reviews with user data
        for (const doc of reviewsSnapshot.docs) {
            const review = doc.data();
            const userDoc = await db.collection('users').doc(review.userId).get();
            const userName = userDoc.exists ? userDoc.data().name : 'Anonymous';
            
            // Get booking to find vehicle name
            const bookingDoc = await db.collection('bookings').doc(review.rentalId).get();
            const vehicleName = bookingDoc.exists ? vehicleNames[bookingDoc.data().vehicleId] || 'Unknown Vehicle' : 'Unknown Vehicle';
            
            const reviewCard = document.createElement('div');
            reviewCard.style.cssText = 'padding: 1.5rem; background: var(--card-bg); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); margin-bottom: 1rem;';
            
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const reviewDate = review.createdAt ? review.createdAt.toDate().toLocaleDateString() : 'N/A';
            
            reviewCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="margin-bottom: 0.25rem;">${userName}</h4>
                        <p style="color: var(--text-muted); font-size: 0.85rem;">${vehicleName}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: var(--warning); font-size: 1.2rem; margin-bottom: 0.25rem;">${stars}</div>
                        <span style="color: var(--text-muted); font-size: 0.85rem;">${reviewDate}</span>
                    </div>
                </div>
                <p style="color: var(--text-primary); line-height: 1.6;">${review.text}</p>
            `;
            
            reviewsList.appendChild(reviewCard);
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        const reviewsList = document.getElementById('agentReviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading reviews</p></div>';
        }
    }
}

// Load vehicles for this agent
async function loadVehicles() {
    const vehiclesGrid = document.getElementById('agentVehiclesGrid');
    if (!vehiclesGrid) return;
    
    vehiclesGrid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading vehicles...</p></div>';
    
    try {
        console.log('Loading vehicles for agent:', currentAgent.uid);
        
        // Load vehicles created by this agent
        const vehiclesSnapshot = await db.collection('vehicles')
            .where('agentId', '==', currentAgent.uid)
            .get();
        
        console.log('Found vehicles:', vehiclesSnapshot.size);
        
        vehiclesGrid.innerHTML = '';
        
        if (vehiclesSnapshot.empty) {
            vehiclesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-car"></i><p>No vehicles added yet. Click "Add Vehicle" to get started!</p></div>';
            return;
        }
        
        vehiclesSnapshot.forEach(doc => {
            const vehicle = doc.data();
            console.log('Vehicle:', doc.id, vehicle);
            const card = document.createElement('div');
            card.className = 'vehicle-card';
            card.style.cursor = 'default';
            
            const statusColor = vehicle.status === 'Available' ? 'var(--success)' : 
                               vehicle.status === 'Rented' ? 'var(--warning)' : 'var(--error)';
            
            card.innerHTML = `
                <div style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin-bottom: 0.5rem;">${vehicle.name}</h3>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">${vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}</p>
                        </div>
                        <span style="padding: 0.25rem 0.75rem; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; font-size: 0.85rem; color: ${statusColor};">
                            ${vehicle.status}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 1.5rem; font-weight: 700; color: var(--primary-violet);">$${vehicle.price}/day</span>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="editVehicle('${doc.id}')" style="padding: 0.5rem 1rem; background: var(--glass-bg); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; color: var(--text-primary); cursor: pointer;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteVehicle('${doc.id}')" style="padding: 0.5rem 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: var(--error); cursor: pointer;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            vehiclesGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading vehicles:', error);
        vehiclesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading vehicles</p></div>';
    }
}

// Vehicle management functions
function showAddVehicleModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'vehicleFormModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeVehicleFormModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeVehicleFormModal()">
                <i class="fas fa-times"></i>
            </button>
            <h2 style="margin-bottom: 1.5rem;">Add New Vehicle</h2>
            <form id="addVehicleForm">
                <div class="form-group">
                    <label>Vehicle Name</label>
                    <input type="text" class="form-input" id="vehicleName" required>
                </div>
                <div class="form-group">
                    <label>Type</label>
                    <select class="form-input" id="vehicleType" required>
                        <option value="">Select Type</option>
                        <option value="sedan">Sedan</option>
                        <option value="suv">SUV</option>
                        <option value="luxury">Luxury</option>
                        <option value="sports">Sports</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Price per Day ($)</label>
                    <input type="number" class="form-input" id="vehiclePrice" min="1" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select class="form-input" id="vehicleStatus" required>
                        <option value="Available">Available</option>
                        <option value="Rented">Rented</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>
                <button type="submit" class="btn-submit">
                    <span>Add Vehicle</span>
                    <i class="fas fa-plus"></i>
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('addVehicleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('vehicleName').value;
        const type = document.getElementById('vehicleType').value;
        const price = parseInt(document.getElementById('vehiclePrice').value);
        const status = document.getElementById('vehicleStatus').value;
        
        console.log('Adding vehicle with agentId:', currentAgent.uid);
        
        try {
            const docRef = await db.collection('vehicles').add({
                name: name,
                type: type,
                price: price,
                status: status,
                agentId: currentAgent.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Vehicle added with ID:', docRef.id);
            
            showToast('Vehicle added successfully!', 'success');
            closeVehicleFormModal();
            loadVehicles();
            loadDashboardStats();
        } catch (error) {
            console.error('Error adding vehicle:', error);
            showToast('Failed to add vehicle', 'error');
        }
    });
}

function closeVehicleFormModal() {
    const modal = document.getElementById('vehicleFormModal');
    if (modal) modal.remove();
}

async function editVehicle(vehicleId) {
    try {
        // Load vehicle data from Firestore
        const vehicleDoc = await db.collection('vehicles').doc(vehicleId).get();
        
        if (!vehicleDoc.exists) {
            showToast('Vehicle not found', 'error');
            return;
        }
        
        const vehicleData = vehicleDoc.data();
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'vehicleFormModal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="closeVehicleFormModal()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="closeVehicleFormModal()">
                    <i class="fas fa-times"></i>
                </button>
                <h2 style="margin-bottom: 1.5rem;">Edit Vehicle</h2>
                <form id="editVehicleForm">
                    <div class="form-group">
                        <label>Vehicle Name</label>
                        <input type="text" class="form-input" id="editVehicleName" value="${vehicleData.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select class="form-input" id="editVehicleType" required>
                            <option value="sedan" ${vehicleData.type === 'sedan' ? 'selected' : ''}>Sedan</option>
                            <option value="suv" ${vehicleData.type === 'suv' ? 'selected' : ''}>SUV</option>
                            <option value="luxury" ${vehicleData.type === 'luxury' ? 'selected' : ''}>Luxury</option>
                            <option value="sports" ${vehicleData.type === 'sports' ? 'selected' : ''}>Sports</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Price per Day ($)</label>
                        <input type="number" class="form-input" id="editVehiclePrice" value="${vehicleData.price}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select class="form-input" id="editVehicleStatus" required>
                            <option value="Available" ${vehicleData.status === 'Available' ? 'selected' : ''}>Available</option>
                            <option value="Rented" ${vehicleData.status === 'Rented' ? 'selected' : ''}>Rented</option>
                            <option value="Maintenance" ${vehicleData.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-submit">
                        <span>Update Vehicle</span>
                        <i class="fas fa-save"></i>
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('editVehicleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('editVehicleName').value;
            const type = document.getElementById('editVehicleType').value;
            const price = parseInt(document.getElementById('editVehiclePrice').value);
            const status = document.getElementById('editVehicleStatus').value;
            
            try {
                await db.collection('vehicles').doc(vehicleId).update({
                    name: name,
                    type: type,
                    price: price,
                    status: status,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showToast('Vehicle updated successfully!', 'success');
                closeVehicleFormModal();
                loadVehicles();
                loadDashboardStats();
            } catch (error) {
                console.error('Error updating vehicle:', error);
                showToast('Failed to update vehicle', 'error');
            }
        });
    } catch (error) {
        console.error('Error loading vehicle:', error);
        showToast('Failed to load vehicle data', 'error');
    }
}

async function deleteVehicle(vehicleId) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
        await db.collection('vehicles').doc(vehicleId).delete();
        showToast('Vehicle deleted successfully!', 'success');
        loadVehicles();
        loadDashboardStats();
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        showToast('Failed to delete vehicle', 'error');
    }
}

// Profile form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    
    if (!fullName) {
        showToast('Please enter your full name', 'error');
        return;
    }
    
    try {
        await db.collection('users').doc(currentAgent.uid).update({
            name: fullName,
            phoneNumber: phoneNumber,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Profile updated successfully!', 'success');
        
        document.querySelectorAll('#agentName, #profileName').forEach(el => {
            el.textContent = fullName;
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile', 'error');
    }
});

// Password change form
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
            currentAgent.email,
            currentPassword
        );
        await currentAgent.reauthenticateWithCredential(credential);
        await currentAgent.updatePassword(newPassword);
        
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

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showToast('Failed to logout', 'error');
    }
});

// Toast notification
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

// Initialize on auth state change
auth.onAuthStateChanged((user) => {
    if (user) {
        formatDate();
        initializeNavigation();
        loadAgentData();
    } else {
        window.location.href = 'index.html';
    }
});
