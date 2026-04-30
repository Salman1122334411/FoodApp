# Food Ordering App - Design Document

## 1. Architecture Overview
The application follows a **Client-Server** architecture, leveraging **React Native (Expo)** for the mobile frontend and **Supabase/PostgreSQL** for the backend and database.

### 1.1 High-Level Diagram
```mermaid
graph LR
    Client[Mobile App (React Native)] -->|API/Auth| Supabase[Supabase (Auth & DB)]
    Client -->|Maps| GoogleMaps[Google Maps API]
    Client -->|Payments| Stripe[Stripe API]
    Supabase -->|Data| DB[(PostgreSQL)]
```

## 2. Technology Stack

### 2.1 Frontend (Mobile)
- **Framework:** React Native with Expo (Managed Workflow).
- **Language:** TypeScript.
- **State Management:** Zustand.
- **Navigation:** React Navigation (Native Stack, Bottom Tabs).
- **UI Components:** Custom components, Lucide Icons, React Native SVG.
- **Maps:** `react-native-maps` for location and tracking.
- **Storage:** `@react-native-async-storage/async-storage` for local persistence.

### 2.2 Backend & Database
- **Database:** PostgreSQL (managed via Supabase).
- **ORM:** Prisma (for schema management and type safety).
- **Authentication:** Supabase Auth & Google Sign-In.
- **Storage:** Supabase Storage (for images/documents).

### 2.3 External Services
- **Payments:** Stripe.
- **Maps/Location:** Google Maps Platform (Geocoding, Places).

## 3. Data Design

### 3.1 Database Schema (Prisma)
The database schema is defined in `schema.prisma` and includes the following key models:

- **User:** Stores user profile, role (Customer, Driver, Vendor, Admin), and authentication details.
- **Address:** Stores delivery addresses linked to users.
- **VendorProfile:** Stores business details for vendors.
- **Restaurant:** Stores restaurant information, location, and cuisine.
- **MenuItem:** Stores food items linked to restaurants.
- **Order:** Stores order details, status, payment info, and references to User, Restaurant, and Driver.
- **OrderItem:** Stores individual items within an order.
- **Driver:** Stores driver status, vehicle info, and statistics.
- **DriverLocation:** Tracks driver's real-time location.

### 3.2 Data Flow
1.  **User Auth:** User signs in via Supabase/Google. Token is stored locally.
2.  **Browsing:** App fetches Restaurants and MenuItems from Supabase (via API/SDK).
3.  **Ordering:**
    - User adds items to global Cart state (Zustand).
    - Checkout creates an `Order` record in DB with status `PENDING`.
    - Payment is processed via Stripe.
4.  **Tracking:**
    - App subscribes to real-time updates on the `Order` record.
    - Driver updates `Order` status (Picked Up, Delivered).
    - Driver location updates are pushed to `DriverLocation` table.

## 4. UI/UX Design

### 4.1 Navigation Structure
- **Auth Stack:** Login, SignUp, Onboarding.
- **Main Tab Navigator:**
    - **Home:** Restaurant discovery.
    - **Search:** Find food/restaurants.
    - **Orders:** Order history and active tracking.
    - **Profile:** User settings and address management.
- **Restaurant Stack:** Restaurant Details, Menu.
- **Cart/Checkout Stack:** Cart, Checkout, Payment, Order Success.

### 4.2 Design System
- **Typography:** Modern sans-serif fonts (Inter/Roboto).
- **Colors:**
    - Primary: Brand Color (e.g., Orange/Red for food).
    - Secondary: Accent colors.
    - Background: Light/Dark mode support.
- **Components:** Reusable buttons, cards, inputs, and list items.

## 5. Security & Privacy
- **Authentication:** All API requests are authenticated via Supabase JWT.
- **Row Level Security (RLS):** Supabase RLS policies ensure users can only access their own data.
- **Data Privacy:** Sensitive user data (PII) is protected.
