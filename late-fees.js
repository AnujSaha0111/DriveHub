class LateFees {
    constructor() {
        this.lateFeesMultiplier = 1.5; 
        this.init();
    }
    
    init() {
        this.checkForLateReturns();
    }
    
    async checkForLateReturns() {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const snapshot = await db.collection('bookings')
                .where('userId', '==', currentUser.uid)
                .where('status', '==', 'active')
                .get();
            
            const lateBookings = [];
            
            snapshot.forEach(doc => {
                const booking = doc.data();
                const returnDate = new Date(booking.returnDate);
                returnDate.setHours(0, 0, 0, 0);
                
                if (returnDate < today) {
                    const daysLate = Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24));
                    const lateFee = this.calculateLateFee(booking.pricePerDay, daysLate);
                    
                    lateBookings.push({
                        id: doc.id,
                        booking: booking,
                        daysLate: daysLate,
                        lateFee: lateFee
                    });
                }
            });
            
            if (lateBookings.length > 0) {
                this.displayLateReturnWarnings(lateBookings);
                this.updateLateFees(lateBookings);
            }
            
        } catch (error) {
            console.error('Error checking for late returns:', error);
        }
    }
    
    calculateLateFee(dailyRate, daysLate) {
        return dailyRate * this.lateFeesMultiplier * daysLate;
    }
    
    displayLateReturnWarnings(lateBookings) {
        const container = document.getElementById('lateReturnWarnings');
        if (!container) return;
        
        container.innerHTML = '';
        
        lateBookings.forEach(({ booking, daysLate, lateFee }) => {
            const warning = document.createElement('div');
            warning.className = 'late-return-warning';
            warning.innerHTML = `
                <div class="warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="warning-content">
                    <h4>Late Return: ${booking.vehicleName}</h4>
                    <p>Return was due ${new Date(booking.returnDate).toLocaleDateString()}</p>
                    <p class="warning-details">
                        <strong>${daysLate} day${daysLate !== 1 ? 's' : ''} overdue</strong> • 
                        Late fee: <strong>$${lateFee.toFixed(2)}</strong>
                    </p>
                </div>
                <button class="btn-danger" onclick="lateFees.processReturn('${booking.id}', ${lateFee})">
                    Return Now
                </button>
            `;
            container.appendChild(warning);
        });
    }
    
    async updateLateFees(lateBookings) {
        const batch = db.batch();
        
        lateBookings.forEach(({ id, booking, daysLate, lateFee }) => {
            const bookingRef = db.collection('bookings').doc(id);
            batch.update(bookingRef, {
                isLate: true,
                daysLate: daysLate,
                lateFees: lateFee,
                totalWithLateFees: booking.totalPrice + lateFee,
                lateFeeLastCalculated: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        try {
            await batch.commit();
        } catch (error) {
            console.error('Error updating late fees:', error);
        }
    }
    
    async processReturn(bookingId, lateFee) {
        try {
            const bookingDoc = await db.collection('bookings').doc(bookingId).get();
            const booking = bookingDoc.data();
            
            const today = new Date().toISOString().split('T')[0];
            const returnDate = new Date(booking.returnDate);
            const actualReturnDate = new Date(today);
            const daysLate = Math.ceil((actualReturnDate - returnDate) / (1000 * 60 * 60 * 24));
            const finalLateFee = this.calculateLateFee(booking.pricePerDay, daysLate);
            
            await db.collection('bookings').doc(bookingId).update({
                status: 'completed',
                actualReturnDate: today,
                lateFees: finalLateFee,
                daysLate: daysLate,
                totalWithLateFees: booking.totalPrice + finalLateFee,
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast(`Vehicle returned. Late fee of $${finalLateFee.toFixed(2)} has been applied.`, 'warning');
            
            if (typeof loadBookingsList === 'function') loadBookingsList();
            if (typeof loadActiveBookings === 'function') loadActiveBookings();
            if (typeof loadHistory === 'function') loadHistory();
            this.checkForLateReturns();
            
        } catch (error) {
            console.error('Error processing late return:', error);
            showToast('Failed to process return', 'error');
        }
    }
    
    showLateFeeDetails(booking) {
        if (!booking.isLate) return '';
        
        return `
            <div class="late-fee-details" style="background: rgba(239, 68, 68, 0.1); border: 1px solid var(--error); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-exclamation-triangle" style="color: var(--error);"></i>
                    <strong style="color: var(--error);">Late Return</strong>
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">
                    <p style="margin: 0.25rem 0;">Expected return: ${new Date(booking.returnDate).toLocaleDateString()}</p>
                    <p style="margin: 0.25rem 0;">Days overdue: ${booking.daysLate}</p>
                    <p style="margin: 0.25rem 0;">Late fee rate: ${this.lateFeesMultiplier}x daily rate</p>
                    <p style="margin: 0.5rem 0 0 0; font-weight: 600; color: var(--error);">
                        Late Fee: $${booking.lateFees?.toFixed(2) || '0.00'}
                    </p>
                </div>
            </div>
        `;
    }
    
    getTotalWithLateFees(booking) {
        if (booking.lateFees) {
            return booking.totalPrice + booking.lateFees;
        }
        return booking.totalPrice;
    }
}

let lateFees;
window.addEventListener('DOMContentLoaded', () => {
    lateFees = new LateFees();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = LateFees;
}
