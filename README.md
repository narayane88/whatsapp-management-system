# WhatsApp Multi-Tier Management System

A comprehensive WhatsApp business management platform with multi-tier user system, built with Next.js, PostgreSQL, and Chakra UI.

## 🚀 Features

### Multi-Tier User System
- **Owner**: Full system control and oversight
- **SubDealer**: Customer management and recharge operations  
- **Employee**: Limited operational access
- **Customer**: WhatsApp messaging services

### Admin Panel
- **Dashboard**: Real-time analytics and system overview
- **User Management**: Multi-tier user creation and management
- **Role & Permissions**: Granular role-based access control
- **Package Management**: Subscription plans with feature matrix
- **Voucher System**: Recharge vouchers with bulk creation
- **Transaction Management**: Payment tracking with Excel export
- **Payout Management**: SubDealer commission system
- **Multi-Language**: i18next with RTL support
- **Server Management**: WhatsApp server monitoring
- **API Documentation**: Complete REST API with logging

### Customer Panel
- **Profile Management**: Personal settings and preferences
- **WhatsApp Services**: Message queue, scheduling, groups
- **QR Code Interface**: WhatsApp instance authentication
- **Contact Management**: Advanced contact organization
- **API Access**: Personal API keys with documentation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Chakra UI
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with JWT
- **Internationalization**: i18next
- **Payment**: Multiple gateway support
- **Real-time**: WebSockets for live updates

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/whatsapp-management-system.git
   cd whatsapp-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Configure your environment variables
   ```

4. **Database Setup**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

The system includes comprehensive models for:
- **User Management**: Multi-tier relationships
- **Business Logic**: Packages, vouchers, transactions
- **Communication**: WhatsApp instances, messages, queues
- **System Management**: Servers, API keys, logging
- **Financial**: Payouts, commissions, billing

## 🔐 Authentication & Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API key authentication for external access
- Rate limiting and DDoS protection
- Data encryption at rest and in transit

## 📱 API Documentation

Complete REST API with:
- OpenAPI/Swagger documentation
- Authentication required for all endpoints
- Rate limiting per user role
- Comprehensive error handling
- Real-time logging and monitoring

## 🌐 Multi-Language Support

- English, Spanish, French, Arabic (RTL)
- Dynamic language switching
- Localized number and date formats
- Currency localization

## 💳 Payment Integration

Supports multiple payment methods:
- Cash transactions
- Bank transfers
- UPI payments
- Payment gateways (Stripe, PayPal, Razorpay)
- Digital wallets

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📈 Development Roadmap

### Phase 1: Foundation ✅ COMPLETED
- [x] Project setup and architecture
- [x] Database schema implementation  
- [x] Basic UI components
- [x] Authentication system with NextAuth.js
- [x] Multi-language setup with i18next

### Phase 2: Admin Panel ✅ COMPLETED
- [x] Admin dashboard with real-time metrics
- [x] User management system with RBAC
- [x] Package management with feature controls
- [x] Transaction tracking with role-based filtering
- [x] Comprehensive reporting and analytics

### Phase 3: Business Features ✅ COMPLETED
- [x] Voucher system with multiple types
- [x] Payout management for SubDealers
- [x] Payment gateway integration architecture
- [x] WhatsApp server management interface
- [x] Advanced reporting with export capabilities

### Phase 4: Customer Panel & API ✅ COMPLETED
- [x] Customer dashboard with usage metrics
- [x] WhatsApp integration and instance management
- [x] Message management with analytics
- [x] Complete API documentation with testing console
- [x] Production-ready deployment setup

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Chakra UI for the component library
- Prisma team for the excellent ORM
- WhatsApp Baileys library contributors

---

**Built with ❤️ for WhatsApp business automation**
