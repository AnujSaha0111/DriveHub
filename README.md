# DriveHub Rentals - Complete Desktop Application

A comprehensive desktop car rental management system built with Electron and Firebase, featuring intelligent booking, multi-vehicle support, recurring rentals, and advanced customer/agent dashboards.

## 🎯 Overview

DriveHub Rentals is a full-featured car rental platform designed for both customers and rental agents. The system includes a sophisticated smart booking system with calendar-based availability, multi-vehicle cart, recurring rental subscriptions, flexible cancellation policies, waiting lists, and automated fee management.

## ✨ Complete Feature Set

### Customer Features

#### Authentication & Profile
- 🔐 Secure authentication (login, signup, password reset)
- � Comprehensive profile management
- 🏆 Loyalty points system with automatic rewards
- 📊 Personalized dashboard with activity tracking

#### Smart Booking System
- 📅 **Visual Calendar View**: Interactive calendar showing real-time vehicle availability
- 🛒 **Multi-Vehicle Booking**: Add multiple vehicles to cart and book in one transaction
- 🔄 **Recurring Rentals**: Set up weekly or monthly rental subscriptions with 10% discount
- ✏️ **Booking Modifications**: Edit pickup/return dates and locations before rental starts
- 💰 **Flexible Cancellation Policy**: Tiered refund system based on cancellation timing
  - More than 7 days before pickup: 90% refund
  - 3-7 days before pickup: 50% refund
  - Less than 3 days before pickup: 25% refund
  - After pickup: No refund
- ⏰ **Waiting List**: Join queue for unavailable vehicles with automatic notifications
- 🔙 **Early Return**: Return vehicle early with prorated refund calculation
- ⚠️ **Late Fee Management**: Automatic calculation at 1.5x daily rate for overdue returns

#### Vehicle Browsing
- � Advanced filtering (type, price, dates, location)
- 📸 Vehicle details with features and pricing
- 🔍 Real-time availability checking
- 💳 "Add to Cart" for quick multi-vehicle selection

#### Booking Management
- 📋 Active bookings overview
- 🔄 Recurring rental subscriptions dashboard
- ⏳ Waiting list status tracking
- 📜 Complete rental history
- ⭐ Write and manage reviews

### Agent Features

#### Analytics & Reporting
- 📈 Comprehensive analytics dashboard with revenue tracking
- 💵 Revenue reports (daily, weekly, monthly)
- 📊 Customer statistics and trends
- 🎯 Performance metrics

#### Vehicle Management
- 🚙 Complete vehicle inventory management
- ➕ Add, edit, remove vehicles
- 📸 Vehicle details and pricing configuration
- ✅ Availability status management

#### Rental Operations
- 📋 Rental request handling and approval
- 👥 Customer database management
- � Waiting list monitoring for agent vehicles
- � Booking modification tracking

## 🛠️ Technology Stack

- **Desktop Framework**: Electron (cross-platform desktop app)
- **Frontend**: HTML5, CSS3, Modern JavaScript (ES6+)
- **Backend**: Firebase Firestore (real-time database)
- **Authentication**: Firebase Authentication
- **Styling**: Custom CSS with glassmorphism and purple/violet theme
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Poppins (Google Fonts)

## 📦 Architecture

### Component Structure
- **Calendar System**: Real-time availability visualization
- **Booking Cart**: Multi-vehicle shopping cart with localStorage persistence
- **Recurring Rentals Manager**: Subscription-based rental automation
- **Cancellation Policy Engine**: Tiered refund calculation
- **Waiting List System**: Queue management with notifications
- **Fee Calculator**: Early return and late fee automation

## Installation

1. **Clone or download the project**
   ```bash
   cd DriveHub-Rentals
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup** (Already configured)
   - Firebase project is already set up with your credentials
   - Authentication (Email/Password) is enabled
   - Firestore Database is configured

4. **Run the application**
   ```bash
   npm start
   ```

   For development mode with DevTools:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
DriveHub-Rentals/
├── main.js                          # Electron main process
├── package.json                     # Project dependencies and scripts
├── package-lock.json                # Dependency lock file
│
├── firebase-config.js               # Firebase initialization
│
├── index.html                       # Landing/authentication page
├── styles.css                       # Landing page styles
├── app.js                           # Authentication logic
│
├── customer-dashboard.html          # Customer interface
├── customer-dashboard.css           # Customer dashboard styles
├── customer-dashboard.js            # Customer dashboard logic
│
├── agent-dashboard.html             # Agent interface
├── agent-dashboard.js               # Agent dashboard logic
│
├── booking.js                       # Core booking functionality
├── booking-cart.js                  # Multi-vehicle cart system
├── booking-cart.css                 # Cart UI styles
├── booking-modifications.js         # Booking edit functionality
│
├── calendar-view.js                 # Interactive calendar component
├── calendar-view.css                # Calendar styles
│
├── recurring-rentals.js             # Subscription rental system
├── cancellation-policy.js           # Cancellation & refund logic
├── waiting-list.js                  # Queue management system
├── early-return.js                  # Early return processing
├── late-fees.js                     # Late fee calculation
│
├── smart-booking-styles.css         # Smart booking UI styles
│
├── node_modules/                    # Dependencies
└── README.md                        # Documentation
```

## 🚀 Usage Guide

### For Customers

#### Getting Started
1. **Sign Up**: Create a customer account from the landing page
2. **Login**: Access the customer dashboard with your credentials
3. **Complete Profile**: Add payment method, driver's license, and contact info

#### Smart Booking Workflow

**Option 1: Single Vehicle Booking**
1. Navigate to "Browse Vehicles"
2. View the **calendar** to see availability across dates
3. Use filters to narrow down vehicles (type, price, location)
4. Click on a vehicle to view details
5. Select rental type:
   - **One-Time Rental**: Standard single booking
   - **Weekly Recurring**: Auto-renewing weekly (10% discount)
   - **Monthly Recurring**: Auto-renewing monthly (10% discount)
6. Choose pickup/return dates and location
7. Review pricing estimate
8. Click "Confirm Booking"

**Option 2: Multi-Vehicle Booking**
1. Browse vehicles and use the **calendar** to check availability
2. Click **"Add to Cart"** (🛒) for each desired vehicle
3. Select dates for each vehicle in filters
4. Open cart from header icon (shows item count)
5. Review cart items and total
6. Click "Checkout" to book all vehicles at once

**Option 3: Waiting List (for unavailable vehicles)**
1. Find a vehicle that's currently unavailable
2. Click **"Join Waitlist"** button
3. Select desired dates
4. Get notified automatically when available
5. Book directly from notification

#### Managing Bookings

**Active Bookings**
- View all current rentals in "My Bookings"
- See recurring rental subscriptions
- Check waiting list status

**Modify a Booking** (before pickup)
- Click "Edit Booking" button
- Change dates or location
- See updated price calculation
- Save changes

**Cancel a Booking**
- Click "Cancel Booking" button
- View refund amount based on cancellation policy
- Provide optional reason
- Confirm cancellation

**Early Return**
- Click "Early Return" on active booking
- Select actual return date
- View prorated refund calculation
- Confirm return

**Late Returns**
- System automatically tracks overdue rentals
- Late fees calculated at 1.5x daily rate
- Warning displayed in dashboard
- Process return when ready

**Recurring Rentals**
- View all active subscriptions
- Pause/Resume recurring rentals
- Cancel entire series or individual bookings

### For Agents

1. **Login**: Access agent dashboard with agent credentials
2. **View Analytics**: Monitor rentals, revenue, and customer metrics
3. **Manage Vehicles**: Add, edit, remove vehicles from inventory
4. **Handle Bookings**: View all rental requests and active bookings
5. **Monitor Waiting Lists**: See customers waiting for your vehicles
6. **Track Revenue**: View reports by day, week, and month
7. **Customer Management**: Access customer database and statistics

## 🗄️ Firebase Collections

### users
Stores both customer and agent information
- **Fields**: name, email, userType, phoneNumber, address, driversLicense, paymentMethod, loyaltyPoints, totalTrips, createdAt, updatedAt

### bookings
Stores rental bookings with comprehensive tracking
- **Core Fields**: userId, vehicleId, vehicleName, pickupDate, returnDate, location, days, pricePerDay, totalPrice, status, createdAt
- **Smart Booking Fields**: 
  - `isRecurring`, `recurringType`, `recurringParentId` (for recurring rentals)
  - `modificationHistory`, `originalPickupDate`, `originalReturnDate`, `lastModified` (for modifications)
  - `cancellationDate`, `refundAmount`, `cancellationReason`, `originalTotalPrice` (for cancellations)
  - `earlyReturnDate`, `earlyReturnRefund`, `daysUsed`, `actualReturnDate` (for early returns)
  - `lateFees`, `daysLate`, `totalWithLateFees`, `isLate` (for late returns)
  - `cartId` (for multi-vehicle bookings)

### recurringBookings
Manages subscription-based rentals
- **Fields**: userId, vehicleId, vehicleName, frequency (weekly/monthly), startDate, endDate, location, pricePerDay, status, bookingIds, createdAt

### waitingList
Manages queue for unavailable vehicles
- **Fields**: userId, vehicleId, vehicleName, desiredPickupDate, desiredReturnDate, status (active/notified/expired), createdAt, expiresAt, notifiedAt

### reviews
Customer reviews and ratings
- **Fields**: userId, rentalId, rating, text, createdAt

### vehicles
Vehicle inventory management
- **Fields**: name, type, price, features, status (Available/Unavailable), agentId, createdAt

## 🎨 Smart Booking System Highlights

### Calendar View
- **Interactive monthly calendar** with date range selection
- **Color-coded availability**: Green (available), Orange (limited), Red (booked)
- **Real-time updates** from Firestore bookings
- **Duration calculation** with visual feedback
- Multi-month navigation

### Multi-Vehicle Cart
- **Shopping cart sidebar** with smooth animations
- **localStorage persistence** - cart survives page refresh
- **Batch checkout** - create all bookings in one transaction
- **Tax calculation** (10% automatically applied)
- **Remove items** individually or clear entire cart

### Recurring Rentals
- **Automated booking generation** for weekly/monthly periods
- **10% discount** automatically applied to recurring rentals
- **Pause/Resume** functionality for subscriptions
- **Cancel series** or individual instances
- **Smart scheduling** - up to 1 year of bookings

### Cancellation Policy
- **Tiered refund system**:
  - 90% refund (>7 days before pickup)
  - 50% refund (3-7 days before)
  - 25% refund (<3 days before)
  - No refund (after pickup)
- **Instant calculation** based on current date
- **Cancellation history** tracking
- **Optional feedback** collection

### Waiting List
- **Automatic availability checking** via Firestore listeners
- **Priority queue** management (FIFO)
- **30-day expiration** for inactive entries
- **Notification system** when vehicle becomes available
- **One-click booking** from notification

### Fee Management
- **Early Return**: Prorated refund = (unused days × daily rate)
- **Late Fees**: 1.5x daily rate per overdue day
- **Automatic calculation** and real-time tracking
- **Visual warnings** for overdue rentals
- **Transparent pricing** breakdown

### Booking Modifications
- **Edit before pickup** - change dates, location
- **Price recalculation** with difference display
- **Modification history** tracking
- **Conflict prevention** - validates against existing bookings

## 🎨 Design Philosophy

- **Premium Aesthetics**: Purple/violet gradient theme with cyan accents
- **Glassmorphism**: Modern frosted glass effects throughout UI
- **Smooth Animations**: Micro-interactions for enhanced UX
- **Accessibility**: Clear information hierarchy and intuitive navigation
- **Responsive Design**: Adapts seamlessly to different window sizes
- **Professional Polish**: Enterprise-grade interface quality
- **Toast Notifications**: Non-intrusive feedback system

## Security

- Firebase Authentication for secure user management
- Password requirements (minimum 6 characters)
- User type verification (customer vs agent)
- Session management with automatic redirects

## 💻 Development

### File Organization
The codebase follows a modular structure with clear separation of concerns:

**Core Files**
- `main.js`: Electron process management
- `firebase-config.js`: Database connection
- `app.js`: Authentication flow

**Customer Features** (customer-dashboard.*)
- Main dashboard logic and navigation
- Profile management
- Reviews system

**Booking System** (booking*.js)
- `booking.js`: Core booking logic
- `booking-cart.js`: Multi-vehicle cart
- `booking-modifications.js`: Edit functionality

**Smart Features**
- `calendar-view.js`: Calendar component
- `recurring-rentals.js`: Subscription management
- `cancellation-policy.js`: Refund engine
- `waiting-list.js`: Queue system
- `early-return.js`: Early return processing
- `late-fees.js`: Fee calculation

**Styling** (*.css)
- Modular CSS files for each component
- `smart-booking-styles.css`: Shared smart booking UI

### Making Changes

1. **Adding Features**: Create new .js and .css files, import in HTML
2. **Styling Updates**: Edit relevant CSS files
3. **Firebase Schema**: Update collections via Firebase console
4. **Electron Config**: Modify `main.js` window settings

### Code Standards
- ES6+ JavaScript syntax
- Async/await for Firebase operations
- Modular component design
- Inline comments for complex logic

## 🔍 Key Features Breakdown

### 1. Calendar System (`calendar-view.js`)
- **Class-based architecture** with CalendarView component
- **Date range selection** with start/end highlighting
- **Firestore integration** for real-time availability
- **Customizable callbacks** for date selection events

### 2. Cart System (`booking-cart.js`)
- **BookingCart class** manages state
- **localStorage sync** for persistence
- **Badge counter** with animation
- **Batch operations** via Firestore batching

### 3. Recurring Rentals (`recurring-rentals.js`)
- **Instance generation** algorithm for date series
- **10% discount** application
- **Status management** (active/paused/cancelled)
- **Firestore batch writes** for efficiency

### 4. Cancellation Engine (`cancellation-policy.js`)
- **Tiered calculation** based on date difference
- **Configurable refund rates** (easily adjustable)
- **Modal-based UI** for confirmation
- **History tracking** in booking document

### 5. Waiting List (`waiting-list.js`)
- **FIFO queue** implementation
- **Availability checker** queries Firestore for conflicts
- **30-day expiration** automatic cleanup
- **Notification system** with auto-dismiss

### 6. Fee Calculators
- **Early Return** (`early-return.js`): Prorated calculation
- **Late Fees** (`late-fees.js`): Multiplier-based (1.5x)
- **Real-time monitoring** of booking dates
- **Visual warnings** in dashboard

## 🐛 Troubleshooting

### Common Issues

**Calendar not showing**
- Check that calendar-view.css is loaded
- Verify `calendarViewContainer` div exists in HTML
- Check browser console for JavaScript errors

**Cart not persisting**
- localStorage might be disabled in browser
- Check browser privacy settings
- Clear cache and try again

**Bookings not appearing**
- Verify Firebase Firestore rules allow read/write
- Check authentication state (must be logged in)
- Inspect network tab for failed requests

**Late fees not calculating**
- Ensure booking has `returnDate` in past
- Check `late-fees.js` is loaded
- Verify `lateReturnWarnings` div exists

**Recurring rentals not creating multiple bookings**
- Check date range is valid (start < end)
- Verify Firestore write permissions
- Check browser console for batch write errors

### Firebase Console Checks
1. **Authentication**: Users > Check if user exists
2. **Database**: Firestore > Verify collections exist
3. **Rules**: Check read/write permissions
4. **Usage**: Monitor quota limits

### Browser Console
- Open DevTools (F12)
- Check Console tab for errors
- Network tab shows Firebase requests
- Application tab shows localStorage

## 🔐 Security

- **Firebase Authentication** handles all user management
- **Firestore Security Rules** protect data access
- **Password requirements**: Minimum 6 characters
- **User type verification**: Customer vs Agent roles
- **Session management**: Auto-logout on token expiration

## 📝 License

MIT License - Feel free to use and modify for your projects

## 🤝 Contributing

This is a complete, production-ready system. To extend:
1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📞 Support

For issues or questions:
- **Firebase Issues**: Check Firebase Console for authentication/database errors
- **JavaScript Errors**: Review browser DevTools console
- **Dependencies**: Run `npm install` to ensure all packages are installed
- **Electron**: Check `main.js` logs for window configuration issues

---

## 🎉 Credits

**DriveHub Rentals** - Your Journey, Our Wheels 🚗

Built with ❤️ using Electron, Firebase, and modern web technologies.

**Version**: 2.0 (Smart Booking System Integrated)  
**Last Updated**: December 2025