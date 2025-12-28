class CancellationPolicy {
    constructor() {
        this.refundTiers = {
            earlyBird: { days: 7, refundPercent: 0.90 },  // >7 days: 90% refund
            moderate: { days: 3, refundPercent: 0.50 },    // 3-7 days: 50% refund
            late: { days: 0, refundPercent: 0.25 },        // <3 days: 25% refund
            afterPickup: { refundPercent: 0.00 }           // After pickup: no refund
        };
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
    }
    
    calculateRefund(booking) {
        const pickupDate = new Date(booking.pickupDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const daysUntilPickup = Math.ceil((pickupDate - today) / (1000 * 60 * 60 * 24));
        
        let refundPercent = 0;
        let tier = 'afterPickup';
        
        if (daysUntilPickup < 0) {
            refundPercent = this.refundTiers.afterPickup.refundPercent;
            tier = 'afterPickup';
        } else if (daysUntilPickup >= this.refundTiers.earlyBird.days) {
            refundPercent = this.refundTiers.earlyBird.refundPercent;
            tier = 'earlyBird';
        } else if (daysUntilPickup >= this.refundTiers.moderate.days) {
            refundPercent = this.refundTiers.moderate.refundPercent;
            tier = 'moderate';
        } else {
            refundPercent = this.refundTiers.late.refundPercent;
            tier = 'late';
        }
        
        const refundAmount = booking.totalPrice * refundPercent;
        
        return {
            refundAmount: refundAmount,
            refundPercent: refundPercent * 100,
            tier: tier,
            daysUntilPickup: daysUntilPickup
        };
    }
    
    showCancellationModal(bookingId) {
        const modal = document.getElementById('cancellationModal') || this.createCancellationModal();
        
        db.collection('bookings').doc(bookingId).get()
            .then(doc => {
                if (!doc.exists) {
                    showToast('Booking not found', 'error');
                    return;
                }
                
                const booking = doc.data();
                
                if (booking.status === 'cancelled') {
                    showToast('Booking already cancelled', 'warning');
                    return;
                }
                
                const refundInfo = this.calculateRefund(booking);
                this.renderCancellationModal(bookingId, booking, refundInfo);
                modal.classList.add('active');
            })
            .catch(error => {
                console.error('Error loading booking:', error);
                showToast('Failed to load booking details', 'error');
            });
    }
    
    createCancellationModal() {
        const modal = document.createElement('div');
        modal.id = 'cancellationModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="cancellationPolicy.closeModal()"></div>
            <div class="modal-content"></div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
    
    renderCancellationModal(bookingId, booking, refundInfo) {
        const modalContent = document.querySelector('#cancellationModal .modal-content');
        
        let policyMessage = '';
        let warningClass = '';
        
        if (refundInfo.tier === 'earlyBird') {
            policyMessage = `Cancelling more than 7 days before pickup: ${refundInfo.refundPercent}% refund`;
            warningClass = 'success';
        } else if (refundInfo.tier === 'moderate') {
            policyMessage = `Cancelling 3-7 days before pickup: ${refundInfo.refundPercent}% refund`;
            warningClass = 'warning';
        } else if (refundInfo.tier === 'late') {
            policyMessage = `Cancelling less than 3 days before pickup: ${refundInfo.refundPercent}% refund`;
            warningClass = 'error';
        } else {
            policyMessage = `Rental already started: No refund available`;
            warningClass = 'error';
        }
        
        modalContent.innerHTML = `
            <button class="modal-close" onclick="cancellationPolicy.closeModal()">
                <i class="fas fa-times"></i>
            </button>
            
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--warning); margin-bottom: 1rem;"></i>
                <h2>Cancel Booking</h2>
                <p style="color: var(--text-muted);">Are you sure you want to cancel this booking?</p>
            </div>
            
            <div class="booking-summary" style="background: var(--glass-bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0;">${booking.vehicleName}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <p style="color: var(--text-muted); margin: 0;">Pickup Date</p>
                        <p style="margin: 0.25rem 0 0 0; font-weight: 600;">${new Date(booking.pickupDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-muted); margin: 0;">Return Date</p>
                        <p style="margin: 0.25rem 0 0 0; font-weight: 600;">${new Date(booking.returnDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            
            <div class="policy-alert ${warningClass}" style="background: rgba(251, 146, 60, 0.1); border: 1px solid var(--warning); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem;">
                <i class="fas fa-info-circle"></i>
                <span>${policyMessage}</span>
            </div>
            
            <div class="refund-breakdown" style="background: var(--card-bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 1rem 0;">Refund Breakdown</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Original Amount:</span>
                    <span>$${booking.totalPrice.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-muted);">Cancellation Fee:</span>
                    <span>-$${(booking.totalPrice - refundInfo.refundAmount).toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid rgba(139, 92, 246, 0.2); font-size: 1.25rem; font-weight: 700;">
                    <span>Refund Amount:</span>
                    <span style="color: var(--primary-violet);">$${refundInfo.refundAmount.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label>Reason for Cancellation (Optional)</label>
                <textarea id="cancellationReason" class="form-textarea" rows="3" placeholder="Let us know why you're cancelling..."></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="cancellationPolicy.closeModal()">
                    Keep Booking
                </button>
                <button type="button" class="btn-danger" onclick="cancellationPolicy.confirmCancellation('${bookingId}', ${refundInfo.refundAmount})">
                    <span>Confirm Cancellation</span>
                    <i class="fas fa-times-circle"></i>
                </button>
            </div>
        `;
    }
    
    async confirmCancellation(bookingId, refundAmount) {
        const reason = document.getElementById('cancellationReason')?.value || '';
        
        try {
            const bookingDoc = await db.collection('bookings').doc(bookingId).get();
            const booking = bookingDoc.data();
            
            await db.collection('bookings').doc(bookingId).update({
                status: 'cancelled',
                cancellationDate: firebase.firestore.FieldValue.serverTimestamp(),
                cancellationReason: reason,
                refundAmount: refundAmount,
                originalTotalPrice: booking.totalPrice
            });
            
            const currentUser = auth.currentUser;
            if (currentUser) {
                await db.collection('users').doc(currentUser.uid).update({
                    totalTrips: firebase.firestore.FieldValue.increment(-1)
                });
            }
            
            showToast(`Booking cancelled. Refund of $${refundAmount.toFixed(2)} will be processed.`, 'success');
            this.closeModal();
            
            if (typeof loadBookingsList === 'function') loadBookingsList();
            if (typeof loadActiveBookings === 'function') loadActiveBookings();
            if (typeof loadHistory === 'function') loadHistory();
            
        } catch (error) {
            console.error('Error cancelling booking:', error);
            showToast('Failed to cancel booking', 'error');
        }
    }
    
    closeModal() {
        const modal = document.getElementById('cancellationModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    displayPolicyInfo() {
        return `
            <div class="policy-info">
                <h4>Cancellation Policy</h4>
                <ul>
                    <li><strong>More than 7 days before pickup:</strong> ${this.refundTiers.earlyBird.refundPercent * 100}% refund</li>
                    <li><strong>3-7 days before pickup:</strong> ${this.refundTiers.moderate.refundPercent * 100}% refund</li>
                    <li><strong>Less than 3 days before pickup:</strong> ${this.refundTiers.late.refundPercent * 100}% refund</li>
                    <li><strong>After pickup:</strong> No refund</li>
                </ul>
            </div>
        `;
    }
}

let cancellationPolicy;
window.addEventListener('DOMContentLoaded', () => {
    cancellationPolicy = new CancellationPolicy();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CancellationPolicy;
}
