class RecurringRentals {
    constructor() {
        this.init();
    }
    
    init() {
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        const recurringForm = document.getElementById('recurringRentalForm');
        if (recurringForm) {
            recurringForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createRecurringRental();
            });
        }
    }
    
    async createRecurringRental(vehicleId, vehicleName, price, frequency, startDate, endDate, location) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showToast('Please login to create recurring rental', 'error');
            return;
        }
        
        try {
            const instances = this.calculateInstances(frequency, startDate, endDate);
            
            if (instances.length === 0) {
                showToast('Invalid recurring rental configuration', 'error');
                return;
            }
            
            const recurringRef = await db.collection('recurringBookings').add({
                userId: currentUser.uid,
                vehicleId: vehicleId,
                vehicleName: vehicleName,
                frequency: frequency,
                startDate: startDate,
                endDate: endDate,
                location: location,
                pricePerDay: price,
                status: 'active',
                bookingIds: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            const bookingIds = [];
            const batch = db.batch();
            
            for (const instance of instances) {
                const bookingRef = db.collection('bookings').doc();
                const duration = this.calculateDuration(instance.pickupDate, instance.returnDate);
                const total = duration * price * 0.9; // 10% discount for recurring
                
                batch.set(bookingRef, {
                    userId: currentUser.uid,
                    vehicleId: vehicleId,
                    vehicleName: vehicleName,
                    pickupDate: instance.pickupDate,
                    returnDate: instance.returnDate,
                    location: location,
                    days: duration,
                    pricePerDay: price,
                    totalPrice: total,
                    status: 'active',
                    isRecurring: true,
                    recurringParentId: recurringRef.id,
                    recurringType: frequency,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                bookingIds.push(bookingRef.id);
            }
            
            await batch.commit();
            
            await recurringRef.update({
                bookingIds: bookingIds
            });
            
            const totalAmount = instances.reduce((sum, instance) => {
                const duration = this.calculateDuration(instance.pickupDate, instance.returnDate);
                return sum + (duration * price * 0.9);
            }, 0);
            
            await db.collection('users').doc(currentUser.uid).update({
                totalTrips: firebase.firestore.FieldValue.increment(instances.length),
                loyaltyPoints: firebase.firestore.FieldValue.increment(Math.floor(totalAmount / 10))
            });
            
            showToast(`Recurring rental created with ${instances.length} bookings (10% discount applied)!`, 'success');
            
            if (typeof loadUserData === 'function') loadUserData();
            if (typeof loadRecurringRentals === 'function') loadRecurringRentals();
            
            return recurringRef.id;
            
        } catch (error) {
            console.error('Error creating recurring rental:', error);
            showToast('Failed to create recurring rental', 'error');
            return null;
        }
    }
    
    calculateInstances(frequency, startDate, endDate) {
        const instances = [];
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date(start.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year default
        
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            const pickupDate = new Date(currentDate);
            let returnDate;
            
            if (frequency === 'weekly') {
                returnDate = new Date(pickupDate);
                returnDate.setDate(returnDate.getDate() + 7);
            } else if (frequency === 'monthly') {
                returnDate = new Date(pickupDate);
                returnDate.setMonth(returnDate.getMonth() + 1);
            }
            
            instances.push({
                pickupDate: this.formatDate(pickupDate),
                returnDate: this.formatDate(returnDate)
            });
            
            if (frequency === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (frequency === 'monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            
            if (instances.length >= 52) break; // Max 1 year weekly or 52 months
        }
        
        return instances;
    }
    
    async pauseRecurringRental(recurringId) {
        try {
            await db.collection('recurringBookings').doc(recurringId).update({
                status: 'paused'
            });
            
            showToast('Recurring rental paused', 'success');
            if (typeof loadRecurringRentals === 'function') loadRecurringRentals();
            
        } catch (error) {
            console.error('Error pausing recurring rental:', error);
            showToast('Failed to pause recurring rental', 'error');
        }
    }
    
    async resumeRecurringRental(recurringId) {
        try {
            await db.collection('recurringBookings').doc(recurringId).update({
                status: 'active'
            });
            
            showToast('Recurring rental resumed', 'success');
            if (typeof loadRecurringRentals === 'function') loadRecurringRentals();
            
        } catch (error) {
            console.error('Error resuming recurring rental:', error);
            showToast('Failed to resume recurring rental', 'error');
        }
    }
    
    async cancelRecurringRental(recurringId) {
        try {
            const recurringDoc = await db.collection('recurringBookings').doc(recurringId).get();
            const recurringData = recurringDoc.data();
            
            const batch = db.batch();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            for (const bookingId of recurringData.bookingIds) {
                const bookingDoc = await db.collection('bookings').doc(bookingId).get();
                const bookingData = bookingDoc.data();
                const pickupDate = new Date(bookingData.pickupDate);
                
                if (pickupDate > today) {
                    batch.update(db.collection('bookings').doc(bookingId), {
                        status: 'cancelled',
                        cancellationDate: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            
            batch.update(db.collection('recurringBookings').doc(recurringId), {
                status: 'cancelled'
            });
            
            await batch.commit();
            
            showToast('Recurring rental cancelled', 'success');
            if (typeof loadRecurringRentals === 'function') loadRecurringRentals();
            
        } catch (error) {
            console.error('Error cancelling recurring rental:', error);
            showToast('Failed to cancel recurring rental', 'error');
        }
    }
    
    async loadRecurringRentals() {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const container = document.getElementById('recurringRentalsList');
        if (!container) return;
        
        try {
            const snapshot = await db.collection('recurringBookings')
                .where('userId', '==', currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-repeat"></i>
                        <p>No recurring rentals</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const card = this.createRecurringRentalCard(doc.id, data);
                container.appendChild(card);
            });
            
        } catch (error) {
            console.error('Error loading recurring rentals:', error);
        }
    }
    
    createRecurringRentalCard(id, data) {
        const card = document.createElement('div');
        card.className = 'recurring-rental-card';
        
        const statusClass = data.status === 'active' ? 'success' : 
                           data.status === 'paused' ? 'warning' : 'error';
        
        card.innerHTML = `
            <div class="recurring-header">
                <h4>${data.vehicleName}</h4>
                <span class="status-badge ${statusClass}">${data.status}</span>
            </div>
            <div class="recurring-info">
                <p><i class="fas fa-sync"></i> ${data.frequency.charAt(0).toUpperCase() + data.frequency.slice(1)} Rental</p>
                <p><i class="fas fa-calendar"></i> Started: ${new Date(data.startDate).toLocaleDateString()}</p>
                <p><i class="fas fa-list"></i> ${data.bookingIds.length} bookings</p>
            </div>
            <div class="recurring-actions">
                ${data.status === 'active' ? 
                    `<button class="btn-action" onclick="recurringRentals.pauseRecurringRental('${id}')">
                        <i class="fas fa-pause"></i> Pause
                    </button>` :
                    data.status === 'paused' ?
                    `<button class="btn-action" onclick="recurringRentals.resumeRecurringRental('${id}')">
                        <i class="fas fa-play"></i> Resume
                    </button>` : ''
                }
                <button class="btn-action danger" onclick="recurringRentals.cancelRecurringRental('${id}')">
                    <i class="fas fa-times"></i> Cancel
                </button>
            </div>
        `;
        
        return card;
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    calculateDuration(pickupDate, returnDate) {
        const start = new Date(pickupDate);
        const end = new Date(returnDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}

let recurringRentals;
window.addEventListener('DOMContentLoaded', () => {
    recurringRentals = new RecurringRentals();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecurringRentals;
}
