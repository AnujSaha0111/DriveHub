class BookingCart {
    constructor() {
        this.items = this.loadCart();
        this.init();
    }
    
    init() {
        this.updateCartBadge();
        this.attachEventListeners();
    }
    
    loadCart() {
        const savedCart = localStorage.getItem('bookingCart');
        return savedCart ? JSON.parse(savedCart) : [];
    }
    
    saveCart() {
        localStorage.setItem('bookingCart', JSON.stringify(this.items));
    }
    
    addItem(vehicle, dates, location) {
        const existingIndex = this.items.findIndex(item => 
            item.vehicleId === vehicle.id && 
            item.pickupDate === dates.pickupDate && 
            item.returnDate === dates.returnDate
        );
        
        if (existingIndex !== -1) {
            showToast('This vehicle with these dates is already in your cart', 'warning');
            return false;
        }
        
        const duration = this.calculateDuration(dates.pickupDate, dates.returnDate);
        const total = duration * vehicle.price;
        
        const item = {
            id: Date.now().toString(),
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            vehicleType: vehicle.type,
            price: vehicle.price,
            pickupDate: dates.pickupDate,
            returnDate: dates.returnDate,
            location: location,
            duration: duration,
            total: total
        };
        
        this.items.push(item);
        this.saveCart();
        this.updateCartBadge();
        this.renderCart();
        
        showToast(`${vehicle.name} added to cart`, 'success');
        return true;
    }
    
    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartBadge();
        this.renderCart();
        
        showToast('Item removed from cart', 'success');
    }
    
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartBadge();
        this.renderCart();
    }
    
    calculateDuration(pickupDate, returnDate) {
        const start = new Date(pickupDate);
        const end = new Date(returnDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    getTotal() {
        return this.items.reduce((sum, item) => sum + item.total, 0);
    }
    
    getItemCount() {
        return this.items.length;
    }
    
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        const count = this.getItemCount();
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
                badge.classList.add('updated');
                setTimeout(() => badge.classList.remove('updated'), 300);
            } else {
                badge.style.display = 'none';
            }
        }
    }
    
    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartFooter = document.getElementById('cartFooter');
        
        if (!cartItems) return;
        
        if (this.items.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
            if (cartFooter) {
                cartFooter.style.display = 'none';
            }
            return;
        }
        
        cartItems.innerHTML = this.items.map(item => this.createCartItemHTML(item)).join('');
        
        if (cartFooter) {
            cartFooter.style.display = 'block';
            this.updateCartSummary();
        }
        
        this.items.forEach(item => {
            const removeBtn = document.getElementById(`remove-${item.id}`);
            if (removeBtn) {
                removeBtn.addEventListener('click', () => this.removeItem(item.id));
            }
        });
    }
    
    createCartItemHTML(item) {
        return `
            <div class="cart-item">
                <div class="cart-item-header">
                    <div class="cart-item-info">
                        <h4>${item.vehicleName}</h4>
                        <span class="vehicle-type">${item.vehicleType.charAt(0).toUpperCase() + item.vehicleType.slice(1)}</span>
                    </div>
                    <button class="cart-item-remove" id="remove-${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                
                <div class="cart-item-dates">
                    <div class="cart-date-info">
                        <label>Pickup</label>
                        <div class="date-value">${this.formatDate(item.pickupDate)}</div>
                    </div>
                    <div class="cart-date-info">
                        <label>Return</label>
                        <div class="date-value">${this.formatDate(item.returnDate)}</div>
                    </div>
                </div>
                
                <div class="cart-item-pricing">
                    <span class="cart-item-duration">${item.duration} day${item.duration !== 1 ? 's' : ''} × $${item.price}</span>
                    <span class="cart-item-price">$${item.total}</span>
                </div>
            </div>
        `;
    }
    
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    updateCartSummary() {
        const subtotal = this.getTotal();
        const tax = subtotal * 0.1; 
        const total = subtotal + tax;
        
        document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('cartTax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
    }
    
    openCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            this.renderCart();
        }
    }
    
    closeCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
    
    attachEventListeners() {
        const cartIcon = document.getElementById('cartIcon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => this.openCart());
        }
        
        const closeBtn = document.getElementById('closeCart');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCart());
        }
        
        const overlay = document.getElementById('cartOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.closeCart());
        }
        
        const continueBtn = document.getElementById('continueShopping');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.closeCart());
        }
        
        const checkoutBtn = document.getElementById('checkoutCart');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }
    }
    
    async checkout() {
        if (this.items.length === 0) {
            showToast('Your cart is empty', 'error');
            return;
        }
        
        const currentUser = auth.currentUser;
        if (!currentUser) {
            showToast('Please login to complete checkout', 'error');
            return;
        }
        
        const checkoutBtn = document.getElementById('checkoutCart');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        }
        
        try {
            const batch = db.batch();
            const cartId = Date.now().toString();
            
            for (const item of this.items) {
                const bookingRef = db.collection('bookings').doc();
                batch.set(bookingRef, {
                    userId: currentUser.uid,
                    vehicleId: item.vehicleId,
                    vehicleName: item.vehicleName,
                    pickupDate: item.pickupDate,
                    returnDate: item.returnDate,
                    location: item.location,
                    days: item.duration,
                    pricePerDay: item.price,
                    totalPrice: item.total,
                    status: 'active',
                    cartId: cartId,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            const totalAmount = this.getTotal();
            const userRef = db.collection('users').doc(currentUser.uid);
            batch.update(userRef, {
                totalTrips: firebase.firestore.FieldValue.increment(this.items.length),
                loyaltyPoints: firebase.firestore.FieldValue.increment(Math.floor(totalAmount / 10))
            });
            
            await batch.commit();
            
            showToast(`Successfully booked ${this.items.length} vehicle${this.items.length !== 1 ? 's' : ''}!`, 'success');
            
            this.clearCart();
            this.closeCart();
            
            if (typeof loadUserData === 'function') loadUserData();
            if (typeof loadActiveBookings === 'function') loadActiveBookings();
            if (typeof loadBookingsList === 'function') loadBookingsList();
            
        } catch (error) {
            console.error('Error during checkout:', error);
            showToast('Failed to complete checkout. Please try again.', 'error');
        } finally {
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = '<span>Checkout</span><i class="fas fa-arrow-right"></i>';
            }
        }
    }
}

let bookingCart;
window.addEventListener('DOMContentLoaded', () => {
    bookingCart = new BookingCart();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookingCart;
}
