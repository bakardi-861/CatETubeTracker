# CatETube Tracker Testing Scenarios

## Quick Start (5 minutes)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL="sqlite:///catelog.db"

# Initialize database
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('✅ DB ready')"

# Start server
python run.py
```

### 2. Quick API Test
```bash
# Test connection
curl http://localhost:5000/

# Log feeding and see tracker update
curl -X POST http://localhost:5000/api/feeding/ \
  -H "Content-Type: application/json" \
  -d '{"amount_ml": 70, "flushed_before": true, "flushed_after": true}'
```

### 3. Frontend Test  
```bash
cd frontend
npm install && npm run dev
# Open http://localhost:5173
```

## Core Testing Scenarios

### Scenario A: Daily Feeding Routine ⭐
**Goal:** Test your cat's typical 210mL daily feeding split into 3 meals

1. **Reset tracker** (start fresh):
   ```bash
   curl -X POST http://localhost:5000/api/tracker/reset \
     -H "Content-Type: application/json" \
     -d '{"daily_target_ml": 210}'
   ```

2. **First feeding** (70mL):
   - Frontend: Enter 70 in feeding form, submit
   - Backend: Should show 140mL remaining

3. **Second feeding** (70mL):
   - Should show 70mL remaining, 66.7% complete

4. **Third feeding** (70mL):  
   - Should show 0mL remaining, 100% complete, "Daily target reached!"

**Expected Results:**
- Progress circle shows 100%
- Tracker shows "🎉 Daily target reached!"
- Alert shows completion message

### Scenario B: Medication Tracking ⭐
**Goal:** Test combined feeding + medication logging

1. **Log feeding with medication**:
   - Frontend: Enter 70mL feeding, check "Include Medication", enter 5mL
   - Should create both feeding and medication logs
   - Only feeding amount should count toward daily tracker

2. **Verify separate logs**:
   ```bash
   curl http://localhost:5000/api/feeding/         # Should show 70mL
   curl http://localhost:5000/api/medication_log/  # Should show 5mL
   ```

### Scenario C: Report Generation ⭐
**Goal:** Test async report downloads

1. **Generate test data** (create some feeding/medication logs first)

2. **Test CSV report**:
   - Frontend: Reports tab → Feeding → CSV → Generate
   - Watch progress bar
   - Download when complete

3. **Test with date filters**:
   - Set start/end dates
   - Generate combined report
   - Verify filtered data

### Scenario D: Settings & Configuration
**Goal:** Test daily target changes

1. **Change daily target**:
   - Frontend: Tracker → Settings → Change to 250mL → Update
   - Should recalculate remaining amount immediately

2. **Reset with new target**:
   - Reset button should clear progress but keep new target

### Scenario E: Edge Cases & Error Handling

1. **Invalid inputs**:
   - Try negative feeding amounts
   - Try non-numeric values
   - Submit empty forms

2. **Network issues**:
   - Stop backend server
   - Try frontend actions (should show error messages)

3. **Large amounts**:
   - Log 300mL feeding (over daily target)
   - Should show 0mL remaining, >100% progress

## Advanced Testing

### Load Testing
```bash
# Multiple concurrent feedings
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/feeding/ \
    -H "Content-Type: application/json" \
    -d '{"amount_ml": 20, "flushed_before": true, "flushed_after": true}' &
done
wait
```

### Date Simulation Testing
```python
# Python shell - simulate different dates
from app import create_app, db
from app.models import DailyFeedingTracker
from datetime import date, timedelta

app = create_app()
with app.app_context():
    # Create tracker for yesterday
    yesterday = date.today() - timedelta(days=1)
    old_tracker = DailyFeedingTracker(daily_target_ml=210, target_date=yesterday)
    old_tracker.total_fed_ml = 210  # Completed yesterday
    old_tracker.remaining_ml = 0
    db.session.add(old_tracker)
    db.session.commit()
    
    print("✅ Created historical data")
```

### Scheduler Testing
```python
# Force scheduler actions (Python shell)
from app.utils.schedule import get_scheduler
scheduler = get_scheduler()
scheduler.force_new_day_reset()  # Simulate midnight reset
```

## Browser Testing Checklist

### Visual Elements ✅
- [ ] Progress circle animates smoothly
- [ ] Colors change based on progress (red → orange → green)
- [ ] Statistics update in real-time
- [ ] Forms clear after submission
- [ ] Error messages display clearly

### Functionality ✅
- [ ] Auto-refresh works (wait 30 seconds)
- [ ] Settings panel opens/closes
- [ ] Buttons are responsive
- [ ] Downloads work in different browsers
- [ ] Mobile/responsive layout works

### Data Consistency ✅
- [ ] Feeding form updates tracker immediately
- [ ] Tracker shows correct percentages
- [ ] Reports contain expected data
- [ ] Stats match actual feeding logs

## Common Issues & Quick Fixes

### "Module not found" errors
```bash
pip install flask flask-sqlalchemy python-dotenv pandas openpyxl
```

### Database issues
```bash
rm catelog.db  # Delete old database
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

### CORS errors in browser
- Check if cors-anywhere.herokuapp.com is working
- Try testing APIs directly with curl first

### Frontend not updating
- Check browser console for errors
- Verify backend is responding
- Hard refresh (Ctrl+F5)

## Success Criteria

**✅ Backend Working:**
- Flask starts without errors
- All API endpoints respond correctly
- Database operations succeed
- Scheduler starts automatically

**✅ Frontend Working:**
- All components render properly
- Forms submit successfully
- Real-time updates work
- Downloads function correctly

**✅ Integration Working:**
- Feeding logs update tracker
- Progress calculations are accurate
- Reports contain correct data
- 24-hour reset works (or can be simulated)

## Time Estimates

- **Quick smoke test:** 5 minutes
- **Core functionality:** 15 minutes  
- **Full feature testing:** 30 minutes
- **Edge case testing:** 15 minutes
- **Performance testing:** 10 minutes

**Total comprehensive testing:** ~1 hour

Start with Scenario A (Daily Feeding Routine) to verify core functionality, then move to other scenarios based on what you want to test most.