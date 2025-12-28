class EarlyReturn {
    constructor() {
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
    }
    
    showEarlyReturnModal(bookingId) {
        const modal = document.getElementById('earlyReturnModal') || this.createEarlyReturnModal();
        
        db.collection('bookings').doc(bookingId).get()
            .then(doc => {
                if (!doc.exists) {
                    showToast('Booking not found', 'error');
                    return;
                }
                
                const booking = doc.data();
                
                if (booking.status !== 'active') {
                    showToast('Only active bookings can be returned early', 'error');
                    return;
                }
                
                const pickupDate = new Date(booking.pickupDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (pickupDate > today) {
                    showToast('Cannot process early return before pickup date', 'error');
                    return;
                }
                
                this.renderEarlyReturnModal(bookingId, booking);
                modal.classList.add('active');
            })
            .catch(error => {
                console.error('Error loading booking:', error);
                showToast('Failed to load booking details', 'error');
            });
    }
    
    createEarlyReturnModal() {
        const modal = document.createElement('div');
        modal.id = 'earlyReturnModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="earlyReturn.closeModal()"></div>
            <div class="modal-content"></div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    renderEarlyReturnModal(bookingId, booking) {
        const modalContent = document.querySelector('#earlyReturnModal .modal-content');
        
        const today = new Date().toISOString().split('T')[0];
        const returnDate = new Date(booking.returnDate);
        const maxDate = returnDate.toISOString().split('T')[0];
        
        modalContent.innerHTML = `
            <button class="modal-close" onclick="earlyReturn.closeModal()">
                <i class="fas fa-times"></i>
            </button>
            
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fas fa-undo" style="font-size: 3rem; color: var(--primary-violet); margin-bottom: 1rem;"></i>
                <h2>Early Return</h2>
                <p style="color: var(--text-muted);">Return ${booking.vehicleName} earlier than planned</p>
            </div>
            
            <div class="booking-summary" style="background: var(--glass-bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0;">Original Booking</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <p style="color: var(--text-muted); margin: 0;">Pickup Date</p>
                        <p style="margin: 0.25rem 0 0 0; font-weight: 600;">${new Date(booking.pickupDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-muted); margin: 0;">Original Return</p>
                        <p style="margin: 0.25rem 0 0 0; font-weight: 600;">${new Date(booking.returnDate).toLocaleDateString()}</p>
                    </div>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(139, 92, 246, 0.2);">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Total Paid:</span>
                        <span style="font-weight: 600;">$${booking.totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label>Actual Return Date</label>
                <input type="date" 
                       id="earlyReturnDate" 
                       class="form-input" 
                       min="${today}" 
                       max="${maxDate}"
                       value="${today}"
                       required>
                <small style="color: var(--text-muted);">Select the date you're returning the vehicle</small>
            </div>
            
            <div class="refund-calculation" id="refundCalculation" style="background: var(--card-bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0;">Refund Calculation</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Days Used:</span>
                    <span id="daysUsed">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Days Unused:</span>
                    <span id="daysUnused">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Cost of Days Used:</span>
                    <span id="costUsed">-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid rgba(139, 92, 246, 0.2); font-size: 1.25rem; font-weight: 700;">
                    <span>Refund Amount:</span>
                    <span style="color: var(--success);" id="refundAmount">$0.00</span>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="earlyReturn.closeModal()">
                    Cancel
                </button>
                <button type="button" class="btn-submit" onclick="earlyReturn.confirmEarlyReturn('${bookingId}')">
                    <span>Confirm Early Return</span>
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;
        
        const dateInput = document.getElementById('earlyReturnDate');
        dateInput.addEventListener('change', () => {
            this.calculateRefund(booking);
        });
        
        this.calculateRefund(booking);
    }
    
    calculateRefund(booking) {
        const earlyReturnDate = document.getElementById('earlyReturnDate').value;
        if (!earlyReturnDate) return;
        
        const pickupDate = new Date(booking.pickupDate);
        const originalReturnDate = new Date(booking.returnDate);
        const actualReturnDate = new Date(earlyReturnDate);
        
        const totalDays = booking.days;
        const daysUsed = Math.ceil((actualReturnDate - pickupDate) / (1000 * 60 * 60 * 24));
        const daysUnused = totalDays - daysUsed;
        
        const costUsed = daysUsed * booking.pricePerDay;
        const refund = booking.totalPrice - costUsed;
        
        document.getElementById('daysUsed').textContent = daysUsed;
        document.getElementById('daysUnused').textContent = daysUnused;
        document.getElementById('costUsed').textContent = `$${costUsed.toFixed(2)}`;
        document.getElementById('refundAmount').textContent = `$${Math.max(0, refund).toFixed(2)}`;
        
        return {
            daysUsed,
            daysUnused,
            costUsed,
            refundAmount: Math.max(0, refund),
            earlyReturnDate
        };
    }
    
    async confirmEarlyReturn(bookingId) {
        const bookingDoc = await db.collection('bookings').doc(bookingId).get();
        const booking = bookingDoc.data();
        
        const refundData = this.calculateRefund(booking);
        
        if (!refundData || !refundData.earlyReturnDate) {
            showToast('Please select a return date', 'error');
            return;
        }
        
        try {
            await db.collection('bookings').doc(bookingId).update({
                status: 'completed',
                actualReturnDate: refundData.earlyReturnDate,
                earlyReturnDate: refundData.earlyReturnDate,
                earlyReturnRefund: refundData.refundAmount,
                daysUsed: refundData.daysUsed,
                earlyReturnProcessed: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast(`Early return processed. Refund of $${refundData.refundAmount.toFixed(2)} will be issued.`, 'success');
            this.closeModal();
            
            if (typeof loadBookingsList === 'function') loadBookingsList();
            if (typeof loadActiveBookings === 'function') loadActiveBookings();
            if (typeof loadHistory === 'function') loadHistory();
            
        } catch (error) {
            console.error('Error processing early return:', error);
            showToast('Failed to process early return', 'error');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('earlyReturnModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

let earlyReturn;
window.addEventListener('DOMContentLoaded', () => {
    earlyReturn = new EarlyReturn();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarlyReturn;
}
