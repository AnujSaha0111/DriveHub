class WaitingList {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkAndNotifyAvailability();
    }
    
    async joinWaitingList(vehicleId, vehicleName, pickupDate, returnDate) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showToast('Please login to join waiting list', 'error');
            return;
        }
        
        try {
            const existing = await db.collection('waitingList')
                .where('userId', '==', currentUser.uid)
                .where('vehicleId', '==', vehicleId)
                .where('desiredPickupDate', '==', pickupDate)
                .where('status', '==', 'active')
                .get();
            
            if (!existing.empty) {
                showToast('You are already on the waiting list for this vehicle and dates', 'warning');
                return;
            }
            
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // Expire after 30 days
            
            await db.collection('waitingList').add({
                userId: currentUser.uid,
                vehicleId: vehicleId,
                vehicleName: vehicleName,
                desiredPickupDate: pickupDate,
                desiredReturnDate: returnDate,
                status: 'active',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: expiresAt.toISOString()
            });
            
            showToast(`Added to waiting list for ${vehicleName}. We'll notify you when available!`, 'success');
            
            if (typeof loadWaitingList === 'function') loadWaitingList();
            
        } catch (error) {
            console.error('Error joining waiting list:', error);
            showToast('Failed to join waiting list', 'error');
        }
    }
    
    async removeFromWaitingList(waitlistId) {
        try {
            await db.collection('waitingList').doc(waitlistId).update({
                status: 'removed'
            });
            
            showToast('Removed from waiting list', 'success');
            
            if (typeof loadWaitingList === 'function') loadWaitingList();
            
        } catch (error) {
            console.error('Error removing from waiting list:', error);
            showToast('Failed to remove from waiting list', 'error');
        }
    }
    
    async loadUserWaitingList() {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const container = document.getElementById('waitingListContainer');
        if (!container) return;
        
        try {
            const snapshot = await db.collection('waitingList')
                .where('userId', '==', currentUser.uid)
                .where('status', '==', 'active')
                .orderBy('createdAt', 'desc')
                .get();
            
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clock"></i>
                        <p>No waiting list entries</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            
            snapshot.forEach(doc => {
                const data = doc.data();
                const card = this.createWaitingListCard(doc.id, data);
                container.appendChild(card);
            });
            
        } catch (error) {
            console.error('Error loading waiting list:', error);
        }
    }
    
    createWaitingListCard(id, data) {
        const card = document.createElement('div');
        card.className = 'waitlist-card';
        
        card.innerHTML = `
            <div class="waitlist-header">
                <h4>${data.vehicleName}</h4>
                <button class="btn-icon" onclick="waitingList.removeFromWaitingList('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="waitlist-info">
                <p><i class="fas fa-calendar"></i> ${new Date(data.desiredPickupDate).toLocaleDateString()} - ${new Date(data.desiredReturnDate).toLocaleDateString()}</p>
                <p><i class="fas fa-clock"></i> Added ${new Date(data.createdAt.toDate()).toLocaleDateString()}</p>
            </div>
            <div class="waitlist-status">
                <span class="status-badge warning">
                    <i class="fas fa-hourglass-half"></i> Waiting
                </span>
            </div>
        `;
        
        return card;
    }
    
    async checkAndNotifyAvailability() {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        try {
            const waitlistSnapshot = await db.collection('waitingList')
                .where('userId', '==', currentUser.uid)
                .where('status', '==', 'active')
                .get();
            
            for (const doc of waitlistSnapshot.docs) {
                const waitlistData = doc.data();
                
                const isAvailable = await this.checkVehicleAvailability(
                    waitlistData.vehicleId,
                    waitlistData.desiredPickupDate,
                    waitlistData.desiredReturnDate
                );
                
                if (isAvailable) {
                    this.notifyAvailability(doc.id, waitlistData);
                }
            }
        } catch (error) {
            console.error('Error checking availability:', error);
        }
    }
    
    async checkVehicleAvailability(vehicleId, pickupDate, returnDate) {
        try {
            const bookingsSnapshot = await db.collection('bookings')
                .where('vehicleId', '==', vehicleId)
                .where('status', 'in', ['active', 'pending'])
                .get();
            
            const pickup = new Date(pickupDate);
            const returnD = new Date(returnDate);
            
            for (const doc of bookingsSnapshot.docs) {
                const booking = doc.data();
                const bookingPickup = new Date(booking.pickupDate);
                const bookingReturn = new Date(booking.returnDate);
                
                if (pickup <= bookingReturn && returnD >= bookingPickup) {
                    return false; // Conflict found
                }
            }
            
            return true; 
            
        } catch (error) {
            console.error('Error checking availability:', error);
            return false;
        }
    }
    
    notifyAvailability(waitlistId, waitlistData) {
        db.collection('waitingList').doc(waitlistId).update({
            status: 'notified',
            notifiedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        this.showAvailabilityNotification(waitlistData);
    }
    
    showAvailabilityNotification(waitlistData) {
        const notification = document.createElement('div');
        notification.className = 'availability-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle" style="color: var(--success); font-size: 2rem;"></i>
                <div>
                    <h4>Vehicle Available!</h4>
                    <p>${waitlistData.vehicleName} is now available for your desired dates</p>
                    <button class="btn-primary" onclick="waitingList.bookFromWaitlist('${waitlistData.vehicleId}', '${waitlistData.desiredPickupDate}', '${waitlistData.desiredReturnDate}')">
                        Book Now
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('active');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('active');
            setTimeout(() => notification.remove(), 300);
        }, 30000);
    }
    
    async bookFromWaitlist(vehicleId, pickupDate, returnDate) {
        try {
            const vehicleDoc = await db.collection('vehicles').doc(vehicleId).get();
            if (vehicleDoc.exists) {
                const vehicleData = vehicleDoc.data();
                const vehicle = {
                    id: vehicleDoc.id,
                    name: vehicleData.name,
                    type: vehicleData.type,
                    price: vehicleData.price,
                    image: 'https://www.pngall.com/wp-content/uploads/11/White-Sedan-PNG-Image.png',
                    features: { fuel: 'Gasoline', transmission: 'Automatic', seats: 5 },
                    available: vehicleData.status === 'Available'
                };
                
                showVehicleDetails(vehicle);
                
                setTimeout(() => {
                    const pickupInput = document.getElementById('modalPickupDate');
                    const returnInput = document.getElementById('modalReturnDate');
                    if (pickupInput) pickupInput.value = pickupDate;
                    if (returnInput) returnInput.value = returnDate;
                    if (typeof updatePriceEstimate === 'function') {
                        updatePriceEstimate(vehicle.price);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error booking from waitlist:', error);
            showToast('Failed to load vehicle details', 'error');
        }
    }
}

let waitingList;
window.addEventListener('DOMContentLoaded', () => {
    waitingList = new WaitingList();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaitingList;
}
