# CatETube Tracker Testing Guide

## Quick Start Testing

### 1. Backend Setup & Testing

#### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Step 2: Setup Database
```bash
# Create database file (SQLite)
touch catelog.db

# Set environment variable
export DATABASE_URL="sqlite:///catelog.db"
# OR create .env file with:
echo "DATABASE_URL=sqlite:///catelog.db" > .env
```

#### Step 3: Initialize Database Tables
```bash
# Start Python shell in backend directory
python3
```

```python
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print("✅ Database tables created!")
exit()
```

#### Step 4: Start Backend Server
```bash
python run.py
```

You should see:
```
✅ Creating Flask app...
Registered feeding blueprint
Registered medication blueprint  
Registered report blueprint
Registered tracker blueprint
✅ Tracker scheduler started
✅ Starting the app
```

#### Step 5: Run Backend Tests
```bash
# In a new terminal, while server is running
python test_features.py
```

### 2. Frontend Setup & Testing

#### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

#### Step 2: Start Frontend Server
```bash
npm run dev
```

#### Step 3: Test in Browser
1. Open `http://localhost:5173`
2. Test each component manually (see Frontend Testing section below)

---

## Detailed Testing Instructions

### Backend API Testing

#### Manual API Testing with curl

**Test Basic Connection:**
```bash
curl http://localhost:5000/
```

**Test Feeding Log:**
```bash
curl -X POST http://localhost:5000/api/feeding/ \
  -H "Content-Type: application/json" \
  -d '{"amount_ml": 70, "flushed_before": true, "flushed_after": true}'
```

**Test Medication Log:**
```bash
curl -X POST http://localhost:5000/api/medication_log/ \
  -H "Content-Type: application/json" \
  -d '{"amount_ml": 5, "flushed_before": true, "flushed_after": true}'
```

**Test Today's Tracker:**
```bash
curl http://localhost:5000/api/tracker/today
```

**Update Daily Target:**
```bash
curl -X POST http://localhost:5000/api/tracker/today \
  -H "Content-Type: application/json" \
  -d '{"daily_target_ml": 250}'
```

**Generate Report:**
```bash
curl -X POST http://localhost:5000/api/report/feeding \
  -H "Content-Type: application/json" \
  -d '{"format": "json"}'
```

### Frontend Testing

#### 1. Test FeedingForm Component
- Enter feeding amount (e.g., 70)
- Check "Include Medication" 
- Enter medication amount (e.g., 5)
- Submit form
- Verify success message shows tracker progress

#### 2. Test DailyTracker Component  
- View progress circle and stats
- Click Settings → Change daily target → Update
- Test Reset button
- Verify auto-refresh (wait 30 seconds)

#### 3. Test ReportDownload Component
- Select report type (Feeding/Medication/Combined)
- Choose format (CSV/JSON/Excel)
- Set date range (optional)
- Generate report
- Monitor progress
- Download when complete

### Complete Testing Scenarios

#### Scenario 1: Daily Feeding Routine
```bash
# Reset tracker for clean start
curl -X POST http://localhost:5000/api/tracker/reset \
  -H "Content-Type: application/json" \
  -d '{"daily_target_ml": 210}'

# First feeding - 70mL
curl -X POST http://localhost:5000/api/feeding/ \
  -H "Content-Type: application/json" \
  -d '{"amount_ml": 70, "flushed_before": true, "flushed_after": true}'

# Second feeding - 70mL  
curl -X POST http://localhost:5000/api/feeding/ \
  -H "Content-Type: application/json" \
  -d '{"amount_ml": 70, "flushed_before": true, "flushed_after": true}'

# Third feeding - 70mL (should complete daily target)
curl -X POST http://localhost:5000/api/feeding/ \
  -H "Content-Type: application/json" \
  -d '{"amount_ml": 70, "flushed_before": true, "flushed_after": true}'

# Check final status
curl http://localhost:5000/api/tracker/today
```

#### Scenario 2: Report Generation Testing
```bash
# Generate feeding report
REPORT_ID=$(curl -s -X POST http://localhost:5000/api/report/feeding \
  -H "Content-Type: application/json" \
  -d '{"format": "csv"}' | jq -r '.report_id')

echo "Report ID: $REPORT_ID"

# Check status (repeat until completed)
curl http://localhost:5000/api/report/status/$REPORT_ID

# Download when ready
curl -O http://localhost:5000/api/report/download/$REPORT_ID
```

#### Scenario 3: 24-Hour Reset Testing
```python
# Force date change simulation (Python shell)
from app.utils.schedule import get_scheduler
scheduler = get_scheduler()
scheduler.force_new_day_reset()
```

### Common Issues & Solutions

#### Backend Issues:

**Database Error:**
```
sqlite3.OperationalError: no such table
```
**Solution:** Run database initialization step

**Port Already in Use:**
```
Address already in use
```
**Solution:** Kill existing process or change port:
```bash
lsof -ti:5000 | xargs kill -9
# OR change port in run.py
```

**Import Errors:**
```
ModuleNotFoundError: No module named 'pandas'
```
**Solution:** Install missing dependencies:
```bash
pip install pandas openpyxl
```

#### Frontend Issues:

**CORS Errors:**
- Enable CORS proxy or modify API URLs
- Check if cors-anywhere.herokuapp.com is working

**Network Errors:**
- Verify backend is running on correct port
- Check firewall/network settings

### Testing Checklist

**Backend Features:**
- [ ] ✅ Flask app starts without errors
- [ ] ✅ Database tables created
- [ ] ✅ Feeding logs work
- [ ] ✅ Medication logs work  
- [ ] ✅ Tracker updates with feedings
- [ ] ✅ Daily target adjustment works
- [ ] ✅ Manual reset works
- [ ] ✅ Report generation works
- [ ] ✅ Scheduler starts automatically
- [ ] ✅ Statistics calculation works

**Frontend Features:**
- [ ] ✅ FeedingForm submits successfully
- [ ] ✅ Medication checkbox works
- [ ] ✅ Tracker displays current progress
- [ ] ✅ Progress circle updates
- [ ] ✅ Settings panel works
- [ ] ✅ Report generation UI works
- [ ] ✅ Progress tracking works
- [ ] ✅ File downloads work

**Integration Features:**
- [ ] ✅ Feeding updates tracker automatically
- [ ] ✅ Tracker shows in feeding response
- [ ] ✅ Daily reset at midnight (or manual test)
- [ ] ✅ Statistics reflect actual data
- [ ] ✅ Reports contain correct data

### Performance Testing

**Load Testing:**
```bash
# Test multiple concurrent feedings
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/feeding/ \
    -H "Content-Type: application/json" \
    -d '{"amount_ml": 10, "flushed_before": true, "flushed_after": true}' &
done
wait
```

**Large Dataset Testing:**
```python
# Generate test data (Python shell)
from app import create_app, db
from app.models import FeedingLog, DailyFeedingTracker
from datetime import datetime, timedelta
import random

app = create_app()
with app.app_context():
    # Create 100 random feeding logs over past 30 days
    for i in range(100):
        days_ago = random.randint(0, 30)
        feed_time = datetime.now() - timedelta(days=days_ago)
        amount = random.uniform(50, 90)
        
        log = FeedingLog(
            amount_ml=amount,
            flushed_before=True,
            flushed_after=True,
            time_given=feed_time
        )
        db.session.add(log)
    
    db.session.commit()
    print("✅ Test data created")
```

This guide covers comprehensive testing of all features. Start with the Quick Start section, then use specific scenarios to test individual features thoroughly.