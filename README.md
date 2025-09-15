# 🏥 MediChain - Digital Health Wallet

A modern, secure digital health records management system that puts patients in control of their medical data. Built with patient privacy and accessibility as core principles.

![MediChain Dashboard](https://via.placeholder.com/800x400/0891b2/ffffff?text=MediChain+Dashboard)

## ✨ Features

### 🔐 **Patient-Controlled Access**
- Secure JWT-based authentication
- Patient-owned health data
- Granular access controls

### 📋 **Comprehensive Health Records**
- Multiple record types: medications, allergies, conditions, lab results, vaccinations
- File attachments (images, PDFs, documents)
- Chronological organization
- Search and filter capabilities

### 📱 **QR Code Sharing**
- Generate secure, time-limited QR codes
- Share specific health information with healthcare providers
- Multiple access levels (emergency, full access)
- Track who accessed your data

### 🆘 **Emergency Access**
- Quick access to critical health information
- Emergency contact details
- Medical alerts and allergies
- Instant QR code generation for first responders

### 🎨 **Modern, Mobile-First Design**
- Responsive design optimized for mobile devices
- Clean, medical-professional interface
- Accessibility-compliant design
- Touch-friendly interactions

## 🚀 Technology Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 3** - Modern utility-first styling
- **React Query** - Data fetching and caching
- **Inter Font** - Clean, readable typography

### **Backend**
- **ASP.NET Core 8** - Cross-platform web API
- **Entity Framework Core** - Database ORM
- **SQLite** - Lightweight, embedded database
- **JWT Authentication** - Secure token-based auth
- **File Upload Support** - Image and document handling

## 🏗️ Project Structure

```
MediChain/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # Reusable UI components
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # ASP.NET Core API
│   ├── Controllers/         # API endpoints
│   ├── Models/             # Data models
│   ├── Data/               # Database context
│   └── Program.cs          # Application entry point
└── README.md
```

## ⚡ Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **.NET 8 SDK**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/MediChain.git
cd MediChain
```

### 2. Setup Backend
```bash
cd backend
dotnet restore
dotnet run
```
The API will be available at `http://localhost:5001`

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
The application will be available at `http://localhost:3000`

### 4. First Run Setup
1. Navigate to `http://localhost:3000`
2. Create your patient account
3. Start adding health records
4. Generate QR codes for sharing

## ⚙️ Configuration

### Frontend Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=MediChain
NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Manila
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

### Backend Configuration
Copy `appsettings.example.json` to `appsettings.Development.json` and configure:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=medichain.db"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key-minimum-32-characters",
    "ExpiryMinutes": 60
  }
}
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new patient
- `POST /api/auth/login` - Patient login

### Health Records
- `GET /api/healthrecords` - Get patient's health records
- `POST /api/healthrecords` - Create new health record
- `PUT /api/healthrecords/{id}` - Update health record
- `DELETE /api/healthrecords/{id}` - Delete health record

### QR Code Access
- `POST /api/qraccess/generate` - Generate QR access code
- `GET /api/qraccess/active` - Get active QR codes
- `GET /api/view/{accessLevel}/{token}` - View records via QR code

### Emergency Information
- `GET /api/emergencyinfo` - Get emergency profile
- `POST /api/emergencyinfo` - Create/update emergency profile

### File Management
- `POST /api/file/upload` - Upload file attachment
- `GET /api/file/download/{id}` - Download file

## 🎨 UI Components

### Design System
- **Colors**: Medical teal (#0891b2), health green (#10b981), accent orange (#f59e0b)
- **Typography**: Inter font family with responsive sizing
- **Components**: Modern card-based layout with consistent spacing
- **Animations**: Subtle transitions and micro-interactions

### Mobile Optimization
- Touch-friendly button sizes (44px minimum)
- Bottom navigation for easy thumb access
- Responsive grid layouts
- Optimized for iOS and Android browsers

## 🔒 Security Features

### Data Protection
- JWT token-based authentication
- Secure file upload validation
- SQL injection prevention
- XSS protection headers

### Privacy Controls
- Patient-controlled data access
- Time-limited QR code sharing
- Access logging and tracking
- GDPR-compliant data handling

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
dotnet test

# Frontend tests
cd frontend
npm test
```

### Code Quality
```bash
# Frontend linting
npm run lint

# Backend formatting
dotnet format
```

### Build for Production
```bash
# Frontend
npm run build

# Backend
dotnet publish -c Release
```

## 📱 Features in Detail

### Health Record Management
- **Multiple Categories**: Medications, allergies, conditions, lab results, surgeries, vaccinations
- **File Attachments**: Support for images, PDFs, and documents
- **Search & Filter**: Find records by category, date, or content
- **Chronological View**: Timeline of health events

### QR Code System
- **Access Levels**: Emergency (limited info) vs. Full access
- **Time Controls**: Set expiration times for shared codes
- **Usage Tracking**: See who accessed your data and when
- **Instant Generation**: Create QR codes in seconds

### Emergency Profile
- **Critical Information**: Allergies, conditions, emergency contacts
- **Quick Access**: Instant QR code for first responders
- **Medical Alerts**: Highlight critical information for emergency situations

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Backend (Azure/AWS)
1. Publish the application
2. Configure connection strings
3. Set up SSL certificates
4. Configure CORS for your domain

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the wiki for detailed guides
- **Issues**: Report bugs or request features via GitHub Issues
- **Security**: Report security vulnerabilities privately

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic health record management
- ✅ QR code sharing
- ✅ File attachments
- ✅ Modern responsive UI

### Phase 2 (Planned)
- [ ] Healthcare provider portal
- [ ] Appointment scheduling
- [ ] Medication reminders
- [ ] Health analytics dashboard

### Phase 3 (Future)
- [ ] Integration with wearable devices
- [ ] AI-powered health insights
- [ ] Telemedicine features
- [ ] Blockchain integration

## 👥 Team

Built with ❤️ for better healthcare accessibility.

---

**MediChain** - Empowering patients with secure, accessible digital health records.


export PATH="$PATH:/home/ervenderr/.dotnet"