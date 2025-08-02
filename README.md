# CatETube Tracker 🐱💊🍽️

A comprehensive full-stack application to track feeding, medication, and daily progress for cats with feeding tubes. Built specifically to manage a 210mL daily feeding routine split across multiple meals, with automatic progress tracking and 24-hour resets.

## ✨ Features

### 📊 Daily Feeding Tracker
- **Smart progress tracking** - Automatically subtracts feeding amounts from daily 210mL target
- **Visual progress circle** - Real-time completion percentage with color-coded status
- **24-hour auto-reset** - Tracker automatically resets to target amount every day
- **Flexible targets** - Easily adjust daily feeding goals
- **Statistics** - Track completion rates and feeding patterns over time

### 🍽️ Feeding & Medication Logs
- **Combined logging** - Log both feeding and medication in one action
- **Automatic integration** - Feeding logs automatically update daily tracker
- **Flush tracking** - Record before/after tube flushing
- **Historical data** - Complete feeding and medication history

### 📋 Async Report Generation
- **Multiple formats** - CSV, JSON, and Excel exports
- **Real-time progress** - Watch report generation with progress bars
- **Date filtering** - Generate reports for specific time ranges
- **Combined reports** - Feeding and medication data together
- **Background processing** - Non-blocking report generation with asyncio

### 🔧 Smart Features
- **Real-time updates** - Auto-refresh tracker every 30 seconds
- **Progress alerts** - Visual feedback when daily targets are reached
- **Error handling** - Robust error handling with user-friendly messages
- **Responsive design** - Works on desktop and mobile devices

## 🛠️ Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Lightweight database
- **asyncio** - Asynchronous report generation
- **pandas + openpyxl** - Excel report generation

### Frontend
- **React** - Modern UI framework
- **Axios** - HTTP client for API calls
- **JavaScript ES6+** - Modern JavaScript features

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Setup database
export DATABASE_URL="sqlite:///catelog.db"
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('✅ Database ready')"

# Start server
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🧪 Testing

### Quick Test
```bash
# Test backend APIs
./test_api.sh

# Run comprehensive tests
cd backend && python test_features.py
```

### Manual Testing
1. Open http://localhost:5173
2. Use the **Daily Tracker** tab to view progress
3. Use the **Feeding Form** tab to log 70mL feedings
4. Use the **Reports** tab to generate and download data

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

## 📖 API Documentation

### Core Endpoints

#### Feeding Tracker
- `GET /api/tracker/today` - Get today's progress
- `POST /api/tracker/today` - Update daily target
- `POST /api/tracker/reset` - Reset tracker

#### Feeding Logs
- `POST /api/feeding/` - Log feeding (auto-updates tracker)
- `GET /api/feeding/` - Get feeding history

#### Medication Logs
- `POST /api/medication_log/` - Log medication
- `GET /api/medication_log/` - Get medication history

#### Reports
- `POST /api/report/feeding` - Generate feeding report
- `POST /api/report/medication` - Generate medication report
- `POST /api/report/combined` - Generate combined report
- `GET /api/report/status/{id}` - Check report progress
- `GET /api/report/download/{id}` - Download completed report

## 📁 Project Structure

```
CatETubeTracker/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app factory
│   │   ├── models.py             # Database models
│   │   ├── routes/
│   │   │   ├── feeding.py        # Feeding endpoints
│   │   │   ├── medication.py     # Medication endpoints
│   │   │   ├── tracker.py        # Daily tracker endpoints
│   │   │   └── report.py         # Report generation
│   │   └── utils/
│   │       ├── export.py         # Async report generator
│   │       └── schedule.py       # 24-hour scheduler
│   ├── requirements.txt
│   ├── run.py                    # Application entry point
│   └── test_features.py          # Comprehensive tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DailyTracker.jsx  # Progress tracking UI
│   │   │   ├── FeedingForm.jsx   # Feeding/medication form
│   │   │   ├── ReportDownload.jsx # Report generation UI
│   │   │   └── TestPage.jsx      # Testing interface
│   │   └── api/
│   │       ├── feeding.js        # Feeding API calls
│   │       ├── medication.js     # Medication API calls
│   │       ├── tracker.js        # Tracker API calls
│   │       └── report.js         # Report API calls
│   └── package.json
├── TESTING_GUIDE.md              # Comprehensive testing guide
├── TESTING_SCENARIOS.md          # Specific test scenarios
├── test_api.sh                   # Quick API testing script
└── README.md
```

## 🎯 Usage Example

### Daily Feeding Routine (210mL total)
1. **Morning feeding** - Log 70mL → Tracker shows 140mL remaining
2. **Afternoon feeding** - Log 70mL → Tracker shows 70mL remaining  
3. **Evening feeding** - Log 70mL → Tracker shows "🎉 Daily target reached!"

### With Medication
1. Check "Include Medication" in feeding form
2. Enter 5mL medication amount
3. Submit → Creates both feeding and medication logs
4. Only feeding amount counts toward daily tracker

### Generate Reports
1. Go to Reports tab
2. Select report type (Feeding/Medication/Combined)
3. Choose format (CSV/JSON/Excel)
4. Set date range (optional)
5. Click Generate → Watch progress → Download when complete

## 🔧 Configuration

### Environment Variables
```bash
DATABASE_URL=sqlite:///catelog.db  # Database connection
DEBUG=True                         # Development mode
```

### Daily Target Adjustment
- Use the ⚙️ Settings button in Daily Tracker
- Change default 210mL to any value
- Tracker immediately recalculates remaining amount

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with love for cats undergoing medical treatment
- Designed for caregivers managing complex feeding schedules
- Special thanks to the open-source community for the amazing tools

## 🆘 Support

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Testing**: See [TESTING_GUIDE.md](TESTING_GUIDE.md) for troubleshooting
- **API**: All endpoints documented above with example usage

---

**Made with ❤️ for better cat care management**
