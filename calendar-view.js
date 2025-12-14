class CalendarView {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedStartDate = null;
        this.selectedEndDate = null;
        this.availabilityData = {};
        this.onDateRangeSelected = options.onDateRangeSelected || null;
        this.vehicleId = options.vehicleId || null;
        
        this.init();
    }
    
    init() {
        this.render();
        if (this.vehicleId) {
            this.loadAvailability(this.vehicleId);
        }
    }
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        this.container.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <h3>Select Rental Dates</h3>
                    <div class="calendar-navigation">
                        <button class="calendar-nav-btn" id="prevMonth">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="calendar-month-year" id="monthYear"></span>
                        <button class="calendar-nav-btn" id="nextMonth">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <div class="calendar-weekdays">
                    <div class="calendar-weekday">Sun</div>
                    <div class="calendar-weekday">Mon</div>
                    <div class="calendar-weekday">Tue</div>
                    <div class="calendar-weekday">Wed</div>
                    <div class="calendar-weekday">Thu</div>
                    <div class="calendar-weekday">Fri</div>
                    <div class="calendar-weekday">Sat</div>
                </div>
                
                <div class="calendar-grid" id="calendarGrid"></div>
                
                <div class="calendar-legend">
                    <div class="legend-item">
                        <div class="legend-color available"></div>
                        <span>Available</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color partially"></div>
                        <span>Limited</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color booked"></div>
                        <span>Booked</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color selected"></div>
                        <span>Selected</span>
                    </div>
                </div>
                
                <div class="date-range-display" id="dateRangeDisplay">
                    <div class="date-range-info">
                        <div class="date-info">
                            <label>Pickup Date</label>
                            <div class="date-value" id="pickupDateDisplay">-</div>
                        </div>
                        <div class="duration-info">
                            <div class="duration-label">Duration</div>
                            <div class="duration-value" id="durationDisplay">0 days</div>
                        </div>
                        <div class="date-info">
                            <label>Return Date</label>
                            <div class="date-value" id="returnDateDisplay">-</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.renderCalendarDays();
        this.updateMonthYearDisplay();
        this.attachEventListeners();
    }
    
    renderCalendarDays() {
        const grid = document.getElementById('calendarGrid');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const startingDayOfWeek = firstDay.getDay();
        
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        grid.innerHTML = '';
        
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const cell = this.createDayCell(day, true);
            grid.appendChild(cell);
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const currentCellDate = new Date(year, month, day);
            currentCellDate.setHours(0, 0, 0, 0);
            
            const isToday = currentCellDate.getTime() === today.getTime();
            const isPast = currentCellDate < today;
            const isSelected = this.isDateSelected(currentCellDate);
            const isInRange = this.isDateInRange(currentCellDate);
            const availability = this.getAvailability(currentCellDate);
            
            const cell = this.createDayCell(day, false, {
                isToday,
                isPast,
                isSelected,
                isInRange,
                availability,
                date: currentCellDate
            });
            
            grid.appendChild(cell);
        }
        
        const remainingCells = 42 - grid.children.length; 
        for (let day = 1; day <= remainingCells; day++) {
            const cell = this.createDayCell(day, true);
            grid.appendChild(cell);
        }
    }
    
    createDayCell(day, isOtherMonth, options = {}) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.textContent = day;
        
        if (isOtherMonth) {
            cell.classList.add('other-month');
            return cell;
        }
        
        if (options.isPast) {
            cell.classList.add('disabled');
            return cell;
        }
        
        if (options.isToday) {
            cell.classList.add('today');
        }
        
        if (options.availability) {
            if (options.availability === 'available') {
                cell.classList.add('available');
            } else if (options.availability === 'partial') {
                cell.classList.add('partially-booked');
            } else if (options.availability === 'booked') {
                cell.classList.add('fully-booked');
                cell.classList.add('disabled');
                return cell;
            }
        }
        
        if (options.isSelected === 'start') {
            cell.classList.add('range-start');
        } else if (options.isSelected === 'end') {
            cell.classList.add('range-end');
        } else if (options.isSelected) {
            cell.classList.add('selected');
        }
        
        if (options.isInRange) {
            cell.classList.add('in-range');
        }
        
        cell.addEventListener('click', () => this.handleDateClick(options.date));
        
        return cell;
    }
    
    handleDateClick(date) {
        if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
            this.selectedStartDate = date;
            this.selectedEndDate = null;
        } else if (date > this.selectedStartDate) {
            this.selectedEndDate = date;
            this.updateDateRangeDisplay();
            
            if (this.onDateRangeSelected) {
                this.onDateRangeSelected({
                    startDate: this.selectedStartDate,
                    endDate: this.selectedEndDate,
                    duration: this.calculateDuration()
                });
            }
        } else {
            this.selectedStartDate = date;
            this.selectedEndDate = null;
        }
        
        this.renderCalendarDays();
    }
    
    isDateSelected(date) {
        if (!this.selectedStartDate) return false;
        
        const dateTime = date.getTime();
        const startTime = this.selectedStartDate.getTime();
        
        if (dateTime === startTime) {
            return this.selectedEndDate ? 'start' : true;
        }
        
        if (this.selectedEndDate && dateTime === this.selectedEndDate.getTime()) {
            return 'end';
        }
        
        return false;
    }
    
    isDateInRange(date) {
        if (!this.selectedStartDate || !this.selectedEndDate) return false;
        
        const dateTime = date.getTime();
        return dateTime > this.selectedStartDate.getTime() && 
               dateTime < this.selectedEndDate.getTime();
    }
    
    getAvailability(date) {
        const dateStr = this.formatDate(date);
        return this.availabilityData[dateStr] || 'available';
    }
    
    async loadAvailability(vehicleId) {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);
            
            const bookingsSnapshot = await db.collection('bookings')
                .where('vehicleId', '==', vehicleId)
                .where('status', 'in', ['active', 'pending'])
                .get();
            
            this.availabilityData = {};
            
            bookingsSnapshot.forEach(doc => {
                const booking = doc.data();
                const pickupDate = new Date(booking.pickupDate);
                const returnDate = new Date(booking.returnDate);
                
                let currentDate = new Date(pickupDate);
                while (currentDate <= returnDate) {
                    const dateStr = this.formatDate(currentDate);
                    this.availabilityData[dateStr] = 'booked';
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
            
            this.renderCalendarDays();
        } catch (error) {
            console.error('Error loading availability:', error);
        }
    }
    
    async loadAllVehiclesAvailability() {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            
            const bookingsSnapshot = await db.collection('bookings')
                .where('status', 'in', ['active', 'pending'])
                .get();
            
            const bookingCounts = {};
            
            bookingsSnapshot.forEach(doc => {
                const booking = doc.data();
                const pickupDate = new Date(booking.pickupDate);
                const returnDate = new Date(booking.returnDate);
                
                let currentDate = new Date(pickupDate);
                while (currentDate <= returnDate) {
                    const dateStr = this.formatDate(currentDate);
                    bookingCounts[dateStr] = (bookingCounts[dateStr] || 0) + 1;
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });
            
            const vehiclesSnapshot = await db.collection('vehicles')
                .where('status', '==', 'Available')
                .get();
            const totalVehicles = vehiclesSnapshot.size;
            
            this.availabilityData = {};
            Object.keys(bookingCounts).forEach(dateStr => {
                const count = bookingCounts[dateStr];
                const percentage = count / totalVehicles;
                
                if (percentage >= 1) {
                    this.availabilityData[dateStr] = 'booked';
                } else if (percentage >= 0.7) {
                    this.availabilityData[dateStr] = 'partial';
                } else {
                    this.availabilityData[dateStr] = 'available';
                }
            });
            
            this.renderCalendarDays();
        } catch (error) {
            console.error('Error loading availability:', error);
        }
    }
    
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    formatDisplayDate(date) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    calculateDuration() {
        if (!this.selectedStartDate || !this.selectedEndDate) return 0;
        const diffTime = this.selectedEndDate - this.selectedStartDate;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    updateDateRangeDisplay() {
        const display = document.getElementById('dateRangeDisplay');
        
        if (this.selectedStartDate && this.selectedEndDate) {
            display.classList.add('active');
            document.getElementById('pickupDateDisplay').textContent = 
                this.formatDisplayDate(this.selectedStartDate);
            document.getElementById('returnDateDisplay').textContent = 
                this.formatDisplayDate(this.selectedEndDate);
            
            const duration = this.calculateDuration();
            document.getElementById('durationDisplay').textContent = 
                `${duration} day${duration !== 1 ? 's' : ''}`;
        } else {
            display.classList.remove('active');
        }
    }
    
    updateMonthYearDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthYear = document.getElementById('monthYear');
        if (monthYear) {
            monthYear.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        }
    }
    
    attachEventListeners() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendarDays();
                this.updateMonthYearDisplay();
                
                if (this.vehicleId) {
                    this.loadAvailability(this.vehicleId);
                } else {
                    this.loadAllVehiclesAvailability();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendarDays();
                this.updateMonthYearDisplay();
                
                if (this.vehicleId) {
                    this.loadAvailability(this.vehicleId);
                } else {
                    this.loadAllVehiclesAvailability();
                }
            });
        }
    }
    
    getSelectedDates() {
        if (!this.selectedStartDate || !this.selectedEndDate) {
            return null;
        }
        
        return {
            pickupDate: this.formatDate(this.selectedStartDate),
            returnDate: this.formatDate(this.selectedEndDate),
            duration: this.calculateDuration()
        };
    }
    
    setVehicle(vehicleId) {
        this.vehicleId = vehicleId;
        this.loadAvailability(vehicleId);
    }
    
    reset() {
        this.selectedStartDate = null;
        this.selectedEndDate = null;
        this.currentDate = new Date();
        this.render();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarView;
}
