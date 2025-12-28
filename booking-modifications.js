class BookingModifications {
    constructor() {
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
    }
    
    async showModificationModal(bookingId) {
        try {
            const bookingDoc = await db.collection('bookings').doc(bookingId).get();
            if (!bookingDoc.exists) {
                showToast('Booking not found', 'error');
                return;
            }
            
            const booking = bookingDoc.data();
            
            const pickupDate = new Date(booking.pickupDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (pickupDate <= today) {
                showToast('Cannot modify bookings that have already started', 'error');
                return;
            }
            
            if (booking.status !== 'active' && booking.status !== 'pending') {
                showToast('Cannot modify cancelled or completed bookings', 'error');
                return;
            }
            
            this.renderModificationModal(bookingId, booking);
            
        } catch (error) {
            console.error('Error loading booking:', error);
            showToast('Failed to load booking details', 'error');
        }
    }
    
    renderModificationModal(bookingId, booking) {
        const modal = document.getElementById('modificationModal') || this.createModificationModal();
        
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <button class="modal-close" onclick="bookingModifications.closeModal()">
                <i class="fas fa-times"></i>
            </button>
            
            <h2>Modify Booking</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                Original booking for ${booking.vehicleName}
            </p>
            
            <form id="modificationForm">
                <div class="form-group">
                    <label>Pickup Date</label>
                    <input type="date" 
                           id="modPickupDate" 
                           class="form-input" 
                           value="${booking.pickupDate}" 
                           min="${today}" 
                           required>
                    <small>Original: ${new Date(booking.pickupDate).toLocaleDateString()}</small>
                </div>
                
                <div class="form-group">
                    <label>Return Date</label>
                    <input type="date" 
                           id="modReturnDate" 
                           class="form-input" 
                           value="${booking.returnDate}" 
                           min="${tomorrowStr}" 
                           required>
                    <small>Original: ${new Date(booking.returnDate).toLocaleDateString()}</small>
                </div>
                
                <div class="form-group">
                    <label>Pickup Location</label>
                    <select id="modLocation" class="form-input" required>
                        <option value="downtown" ${booking.location === 'downtown' ? 'selected' : ''}>Downtown</option>
                        <option value="airport" ${booking.location === 'airport' ? 'selected' : ''}>Airport</option>
                        <option value="north" ${booking.location === 'north' ? 'selected' : ''}>North District</option>
                        <option value="south" ${booking.location === 'south' ? 'selected' : ''}>South District</option>
                    </select>
                    <small>Original: ${booking.location}</small>
                </div>
                
                <div class="price-comparison" id="priceComparison">
                    <div class="comparison-row">
                        <span>Original Price:</span>
                        <span>$${booking.totalPrice}</span>
                    </div>
                    <div class="comparison-row new-price">
                        <span>New Price:</span>
                        <span id="newPrice">$${booking.totalPrice}</span>
                    </div>
                    <div class="comparison-row difference" id="priceDifference" style="display: none;">
                        <span>Difference:</span>
                        <span id="priceDiffAmount">$0</span>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="bookingModifications.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn-submit">
                        <span>Save Changes</span>
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </form>
        `;
        
        modal.classList.add('active');
        
        const form = document.getElementById('modificationForm');
        const pickupInput = document.getElementById('modPickupDate');
        const returnInput = document.getElementById('modReturnDate');
        
        pickupInput.addEventListener('change', () => {
            returnInput.min = pickupInput.value;
            this.updatePricePreview(booking);
        });
        
        returnInput.addEventListener('change', () => {
            this.updatePricePreview(booking);
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveModification(bookingId, booking);
        });
    }
    
    createModificationModal() {
        const modal = document.createElement('div');
        modal.id = 'modificationModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="bookingModifications.closeModal()"></div>
            <div class="modal-content large"></div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    updatePricePreview(originalBooking) {
        const newPickupDate = document.getElementById('modPickupDate').value;
        const newReturnDate = document.getElementById('modReturnDate').value;
        
        if (!newPickupDate || !newReturnDate) return;
        
        const start = new Date(newPickupDate);
        const end = new Date(newReturnDate);
        
        if (end <= start) return;
        
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const newTotal = days * originalBooking.pricePerDay;
        const difference = newTotal - originalBooking.totalPrice;
        
        document.getElementById('newPrice').textContent = `$${newTotal}`;
        
        const diffElement = document.getElementById('priceDifference');
        const diffAmountElement = document.getElementById('priceDiffAmount');
        
        if (difference !== 0) {
            diffElement.style.display = 'flex';
            diffAmountElement.textContent = (difference > 0 ? '+' : '') + `$${difference}`;
            diffAmountElement.style.color = difference > 0 ? 'var(--error)' : 'var(--success)';
        } else {
            diffElement.style.display = 'none';
        }
    }
    
    async saveModification(bookingId, originalBooking) {
        const newPickupDate = document.getElementById('modPickupDate').value;
        const newReturnDate = document.getElementById('modReturnDate').value;
        const newLocation = document.getElementById('modLocation').value;
        
        if (!newPickupDate || !newReturnDate) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (new Date(newReturnDate) <= new Date(newPickupDate)) {
            showToast('Return date must be after pickup date', 'error');
            return;
        }
        
        try {
            const days = Math.ceil((new Date(newReturnDate) - new Date(newPickupDate)) / (1000 * 60 * 60 * 24));
            const newTotal = days * originalBooking.pricePerDay;
            
            const modificationHistory = originalBooking.modificationHistory || [];
            modificationHistory.push({
                modifiedAt: new Date().toISOString(),
                oldPickupDate: originalBooking.pickupDate,
                oldReturnDate: originalBooking.returnDate,
                oldLocation: originalBooking.location,
                oldTotal: originalBooking.totalPrice
            });
            
            await db.collection('bookings').doc(bookingId).update({
                pickupDate: newPickupDate,
                returnDate: newReturnDate,
                location: newLocation,
                days: days,
                totalPrice: newTotal,
                modificationHistory: modificationHistory,
                originalPickupDate: originalBooking.originalPickupDate || originalBooking.pickupDate,
                originalReturnDate: originalBooking.originalReturnDate || originalBooking.returnDate,
                lastModified: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('Booking modified successfully', 'success');
            this.closeModal();
            
            if (typeof loadBookingsList === 'function') loadBookingsList();
            if (typeof loadActiveBookings === 'function') loadActiveBookings();
            
        } catch (error) {
            console.error('Error modifying booking:', error);
            showToast('Failed to modify booking', 'error');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('modificationModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

let bookingModifications;
window.addEventListener('DOMContentLoaded', () => {
    bookingModifications = new BookingModifications();
});
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingModifications;
}
