async function loadVehicles() {
    const vehiclesGrid = document.getElementById('vehiclesGrid');
    if (!vehiclesGrid) return;
    
    vehiclesGrid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading vehicles...</p></div>';
    
    try {
        const vehiclesSnapshot = await db.collection('vehicles').get();
        
        vehiclesGrid.innerHTML = '';
        
        if (vehiclesSnapshot.empty) {
            vehiclesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-car"></i><p>No vehicles available at the moment</p></div>';
            return;
        }
        
        vehiclesSnapshot.forEach(doc => {
            const vehicleData = doc.data();
            const vehicle = {
                id: doc.id,
                name: vehicleData.name,
                type: vehicleData.type,
                price: vehicleData.price,
                image: 'https://www.pngall.com/wp-content/uploads/11/White-Sedan-PNG-Image.png',
                features: { fuel: 'Gasoline', transmission: 'Automatic', seats: 5 },
                available: vehicleData.status === 'Available'
            };
            
            const vehicleCard = createVehicleCard(vehicle);
            vehiclesGrid.appendChild(vehicleCard);
        });
    } catch (error) {
        console.error('Error loading vehicles:', error);
        vehiclesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading vehicles</p></div>';
    }
}

function createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.onclick = () => showVehicleDetails(vehicle);
    
    card.innerHTML = `
        <img src="${vehicle.image}" alt="${vehicle.name}" class="vehicle-image">
        <div class="vehicle-info">
            <h3 class="vehicle-name">${vehicle.name}</h3>
            <p class="vehicle-type">${vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}</p>
            <div class="vehicle-features">
                <span><i class="fas fa-gas-pump"></i> ${vehicle.features.fuel}</span>
                <span><i class="fas fa-cog"></i> ${vehicle.features.transmission}</span>
                <span><i class="fas fa-users"></i> ${vehicle.features.seats} Seats</span>
            </div>
            <div class="vehicle-price">
                <span class="price-amount">$${vehicle.price}</span>
                <button class="btn-book" ${!vehicle.available ? 'disabled' : ''}>
                    ${vehicle.available ? 'Book Now' : 'Unavailable'}
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function showVehicleDetails(vehicle) {
    const modal = document.getElementById('vehicleModal');
    const detailsContainer = document.getElementById('vehicleDetails');
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    detailsContainer.innerHTML = `
        <div class="vehicle-details-content">
            <img src="${vehicle.image}" alt="${vehicle.name}" style="width: 100%; border-radius: 12px; margin-bottom: 1.5rem;">
            <h2>${vehicle.name}</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">${vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}</p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="text-align: center; padding: 1rem; background: var(--glass-bg); border-radius: 8px;">
                    <i class="fas fa-gas-pump" style="font-size: 1.5rem; color: var(--primary-violet); margin-bottom: 0.5rem;"></i>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">${vehicle.features.fuel}</p>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--glass-bg); border-radius: 8px;">
                    <i class="fas fa-cog" style="font-size: 1.5rem; color: var(--primary-violet); margin-bottom: 0.5rem;"></i>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">${vehicle.features.transmission}</p>
                </div>
                <div style="text-align: center; padding: 1rem; background: var(--glass-bg); border-radius: 8px;">
                    <i class="fas fa-users" style="font-size: 1.5rem; color: var(--primary-violet); margin-bottom: 0.5rem;"></i>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">${vehicle.features.seats} Seats</p>
                </div>
            </div>
            
            <div style="background: var(--card-bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Rental Details</h3>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Daily Rate:</span>
                    <span style="font-weight: 600; font-size: 1.2rem; color: var(--primary-violet);">$${vehicle.price}/day</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted);">Status:</span>
                    <span style="color: ${vehicle.available ? 'var(--success)' : 'var(--error)'};">
                        ${vehicle.available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>
            
            ${vehicle.available ? `
                <div style="background: var(--glass-bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid rgba(139, 92, 246, 0.2);">
                    <h3 style="margin-bottom: 1rem;">Booking Information</h3>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem;">Pickup Date</label>
                        <input type="date" id="modalPickupDate" min="${today}" value="${today}" class="form-input" style="width: 100%; padding: 0.75rem; background: var(--glass-bg); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem;">Return Date</label>
                        <input type="date" id="modalReturnDate" min="${tomorrowStr}" value="${tomorrowStr}" class="form-input" style="width: 100%; padding: 0.75rem; background: var(--glass-bg); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; color: var(--text-primary);">
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="display: block; color: var(--text-secondary); margin-bottom: 0.5rem;">Pickup Location</label>
                        <select id="modalLocation" class="form-input" style="width: 100%; padding: 0.75rem; background: var(--glass-bg); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px; color: var(--text-primary);">
                            <option value="">Select Location</option>
                            <option value="downtown">Downtown</option>
                            <option value="airport">Airport</option>
                            <option value="north">North District</option>
                            <option value="south">South District</option>
                        </select>
                    </div>
                    <div id="priceEstimate" style="padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; margin-top: 1rem; display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-secondary);">Estimated Total:</span>
                            <span id="estimatedPrice" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-violet);">$0</span>
                        </div>
                    </div>
                </div>
                <button class="btn-submit" onclick="bookVehicleFromModal('${vehicle.id}', '${vehicle.name}', ${vehicle.price})">
                    <span>Confirm Booking</span>
                    <i class="fas fa-check"></i>
                </button>
            ` : `
                <button class="btn-submit" disabled style="opacity: 0.5; cursor: not-allowed;">
                    <span>Currently Unavailable</span>
                </button>
            `}
        </div>
    `;
    
    modal.classList.add('active');
    
    // Add event listeners for date changes to update price
    if (vehicle.available) {
        const pickupInput = document.getElementById('modalPickupDate');
        const returnInput = document.getElementById('modalReturnDate');
        
        pickupInput.addEventListener('change', () => {
            returnInput.min = pickupInput.value;
            updatePriceEstimate(vehicle.price);
        });
        
        returnInput.addEventListener('change', () => {
            updatePriceEstimate(vehicle.price);
        });
        
        updatePriceEstimate(vehicle.price);
    }
}

function updatePriceEstimate(pricePerDay) {
    const pickupDate = document.getElementById('modalPickupDate').value;
    const returnDate = document.getElementById('modalReturnDate').value;
    
    if (pickupDate && returnDate) {
        const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
        if (days > 0) {
            const total = days * pricePerDay;
            document.getElementById('estimatedPrice').textContent = '$' + total;
            document.getElementById('priceEstimate').style.display = 'block';
        }
    }
}

function closeVehicleModal() {
    const modal = document.getElementById('vehicleModal');
    modal.classList.remove('active');
}

async function bookVehicleFromModal(vehicleId, vehicleName, price) {
    const pickupDate = document.getElementById('modalPickupDate').value;
    const returnDate = document.getElementById('modalReturnDate').value;
    const location = document.getElementById('modalLocation').value;
    
    if (!pickupDate || !returnDate) {
        showToast('Please select pickup and return dates', 'error');
        return;
    }
    
    if (!location) {
        showToast('Please select a pickup location', 'error');
        return;
    }
    
    if (new Date(returnDate) <= new Date(pickupDate)) {
        showToast('Return date must be after pickup date', 'error');
        return;
    }
    
    const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
    const total = days * price;
    
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showToast('Please login to book a vehicle', 'error');
            return;
        }
        
        await db.collection('bookings').add({
            userId: currentUser.uid,
            vehicleId: vehicleId,
            vehicleName: vehicleName,
            pickupDate: pickupDate,
            returnDate: returnDate,
            location: location,
            days: days,
            pricePerDay: price,
            totalPrice: total,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.update({
            totalTrips: firebase.firestore.FieldValue.increment(1),
            loyaltyPoints: firebase.firestore.FieldValue.increment(Math.floor(total / 10))
        });
        
        showToast(`Successfully booked ${vehicleName} for ${days} days! Total: $${total}`, 'success');
        closeVehicleModal();
        
        if (typeof loadUserData === 'function') loadUserData();
        if (typeof loadActiveBookings === 'function') loadActiveBookings();
        if (typeof loadBookingsList === 'function') loadBookingsList();
        if (typeof loadHistory === 'function') loadHistory();
    } catch (error) {
        console.error('Error booking vehicle:', error);
        showToast('Failed to book vehicle. Please try again.', 'error');
    }
}

async function filterVehicles() {
    const typeFilter = document.getElementById('filterType').value;
    const maxPrice = parseInt(document.getElementById('priceRange').value);
    
    const vehiclesGrid = document.getElementById('vehiclesGrid');
    if (!vehiclesGrid) return;
    
    vehiclesGrid.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading vehicles...</p></div>';
    
    try {
        const vehiclesSnapshot = await db.collection('vehicles').get();
        
        const filteredVehicles = [];
        vehiclesSnapshot.forEach(doc => {
            const vehicleData = doc.data();
            const matchesType = !typeFilter || vehicleData.type === typeFilter;
            const matchesPrice = vehicleData.price <= maxPrice;
            
            if (matchesType && matchesPrice) {
                filteredVehicles.push({
                    id: doc.id,
                    name: vehicleData.name,
                    type: vehicleData.type,
                    price: vehicleData.price,
                    image: 'https://www.pngall.com/wp-content/uploads/11/White-Sedan-PNG-Image.png',
                    features: { fuel: 'Gasoline', transmission: 'Automatic', seats: 5 },
                    available: vehicleData.status === 'Available'
                });
            }
        });
        
        vehiclesGrid.innerHTML = '';
        
        if (filteredVehicles.length === 0) {
            vehiclesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-car"></i><p>No vehicles match your filters</p></div>';
            return;
        }
        
        filteredVehicles.forEach(vehicle => {
            const vehicleCard = createVehicleCard(vehicle);
            vehiclesGrid.appendChild(vehicleCard);
        });
    } catch (error) {
        console.error('Error filtering vehicles:', error);
        vehiclesGrid.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading vehicles</p></div>';
    }
}

function initializeFilters() {
    const typeFilter = document.getElementById('filterType');
    const priceRange = document.getElementById('priceRange');
    const resetBtn = document.getElementById('resetFilters');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', filterVehicles);
    }
    
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            document.getElementById('maxPrice').textContent = '$' + e.target.value;
            filterVehicles();
        });
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (typeFilter) typeFilter.value = '';
            if (priceRange) {
                priceRange.value = 200;
                document.getElementById('maxPrice').textContent = '$200';
            }
            loadVehicles();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    initializeFilters();
});
