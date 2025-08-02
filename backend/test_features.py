#!/usr/bin/env python3
"""
Comprehensive testing script for CatETube Tracker features
Run this to test all functionality without frontend
"""

import requests
import json
import time
from datetime import datetime, date

# Configuration
BASE_URL = "http://localhost:5000"
CORS_URL = "https://cors-anywhere.herokuapp.com"

def make_request(method, endpoint, data=None, use_cors=False):
    """Make HTTP request with optional CORS proxy"""
    url = f"{CORS_URL}/{BASE_URL}{endpoint}" if use_cors else f"{BASE_URL}{endpoint}"
    
    headers = {"Content-Type": "application/json"} if data else {}
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None

def test_basic_connection():
    """Test basic Flask app connection"""
    print("\n🔗 Testing Basic Connection...")
    response = make_request("GET", "/")
    if response and response.status_code == 200:
        print("✅ Flask app is running")
        return True
    else:
        print("❌ Flask app not responding")
        return False

def test_feeding_functionality():
    """Test feeding log functionality"""
    print("\n🍽️ Testing Feeding Functionality...")
    
    # Test feeding creation
    feeding_data = {
        "amount_ml": 70.0,
        "flushed_before": True,
        "flushed_after": True
    }
    
    response = make_request("POST", "/api/feeding/", feeding_data)
    if response and response.status_code == 201:
        print("✅ Feeding logged successfully")
        result = response.json()
        print(f"   Response: {result.get('message', 'No message')}")
        
        # Check if tracker info is included
        if 'tracker' in result:
            tracker = result['tracker']
            print(f"   Tracker: {tracker['total_fed_ml']}mL fed, {tracker['remaining_ml']}mL remaining")
        
        return True
    else:
        print(f"❌ Feeding log failed: {response.status_code if response else 'No response'}")
        return False

def test_medication_functionality():
    """Test medication log functionality"""
    print("\n💊 Testing Medication Functionality...")
    
    medication_data = {
        "amount_ml": 5.0,
        "flushed_before": True,
        "flushed_after": True
    }
    
    response = make_request("POST", "/api/medication_log/", medication_data)
    if response and response.status_code == 201:
        print("✅ Medication logged successfully")
        print(f"   Response: {response.json().get('message', 'No message')}")
        return True
    else:
        print(f"❌ Medication log failed: {response.status_code if response else 'No response'}")
        return False

def test_tracker_functionality():
    """Test daily tracker functionality"""
    print("\n📊 Testing Tracker Functionality...")
    
    # Test getting today's tracker
    response = make_request("GET", "/api/tracker/today")
    if response and response.status_code == 200:
        tracker = response.json()
        print("✅ Today's tracker retrieved")
        print(f"   Target: {tracker['daily_target_ml']}mL")
        print(f"   Fed: {tracker['total_fed_ml']}mL")
        print(f"   Remaining: {tracker['remaining_ml']}mL")
        print(f"   Progress: {tracker['progress_percentage']}%")
        print(f"   Feedings: {tracker['feeding_count']}")
        
        # Test updating daily target
        update_data = {"daily_target_ml": 250.0}
        response = make_request("POST", "/api/tracker/today", update_data)
        if response and response.status_code == 200:
            print("✅ Daily target updated successfully")
        else:
            print("❌ Failed to update daily target")
            
        return True
    else:
        print(f"❌ Tracker retrieval failed: {response.status_code if response else 'No response'}")
        return False

def test_report_functionality():
    """Test report generation functionality"""
    print("\n📋 Testing Report Functionality...")
    
    # Test feeding report generation
    report_data = {
        "format": "json",
        "start_date": "2024-01-01T00:00:00Z",
        "end_date": "2024-12-31T23:59:59Z"
    }
    
    response = make_request("POST", "/api/report/feeding", report_data)
    if response and response.status_code == 202:
        result = response.json()
        report_id = result['report_id']
        print(f"✅ Report generation started: {report_id}")
        
        # Wait and check status
        print("   Waiting for report completion...")
        for i in range(10):  # Wait up to 10 seconds
            time.sleep(1)
            status_response = make_request("GET", f"/api/report/status/{report_id}")
            if status_response and status_response.status_code == 200:
                status = status_response.json()
                print(f"   Status: {status.get('status', 'unknown')}")
                
                if status.get('status') == 'completed':
                    print("✅ Report completed successfully")
                    return True
                elif status.get('status') == 'error':
                    print(f"❌ Report failed: {status.get('error', 'Unknown error')}")
                    return False
                    
        print("⏱️ Report taking longer than expected")
        return False
    else:
        print(f"❌ Report generation failed: {response.status_code if response else 'No response'}")
        return False

def test_multiple_feedings():
    """Test multiple feedings to see tracker behavior"""
    print("\n🔄 Testing Multiple Feedings...")
    
    feeding_amounts = [70, 70, 70]  # Three 70mL feedings = 210mL total
    
    for i, amount in enumerate(feeding_amounts, 1):
        print(f"   Feeding {i}: {amount}mL")
        
        feeding_data = {
            "amount_ml": float(amount),
            "flushed_before": True,
            "flushed_after": True
        }
        
        response = make_request("POST", "/api/feeding/", feeding_data)
        if response and response.status_code == 201:
            result = response.json()
            if 'tracker' in result:
                tracker = result['tracker']
                print(f"      → Total: {tracker['total_fed_ml']}mL, Remaining: {tracker['remaining_ml']}mL")
                
                if tracker['is_completed']:
                    print("      🎉 Daily target reached!")
        else:
            print(f"      ❌ Feeding {i} failed")
            
        time.sleep(0.5)  # Small delay between requests
    
    return True

def test_tracker_stats():
    """Test tracker statistics"""
    print("\n📈 Testing Tracker Statistics...")
    
    response = make_request("GET", "/api/tracker/stats")
    if response and response.status_code == 200:
        stats = response.json()
        print("✅ Tracker stats retrieved")
        print(f"   Completion rate: {stats['completion_rate']}%")
        print(f"   Average daily intake: {stats['average_daily_intake']}mL")
        print(f"   Average feedings per day: {stats['average_feedings_per_day']}")
        return True
    else:
        print(f"❌ Stats retrieval failed: {response.status_code if response else 'No response'}")
        return False

def test_manual_tracker_reset():
    """Test manual tracker reset"""
    print("\n🔄 Testing Manual Tracker Reset...")
    
    reset_data = {"daily_target_ml": 210.0}
    response = make_request("POST", "/api/tracker/reset", reset_data)
    
    if response and response.status_code == 200:
        result = response.json()
        print("✅ Tracker reset successfully")
        tracker = result['tracker']
        print(f"   Reset to: {tracker['daily_target_ml']}mL target")
        print(f"   Remaining: {tracker['remaining_ml']}mL")
        return True
    else:
        print(f"❌ Tracker reset failed: {response.status_code if response else 'No response'}")
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("🧪 Starting Comprehensive Feature Testing")
    print("=" * 50)
    
    tests = [
        test_basic_connection,
        test_tracker_functionality,
        test_feeding_functionality,
        test_medication_functionality,
        test_multiple_feedings,
        test_tracker_stats,
        test_manual_tracker_reset,
        test_report_functionality,
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        except Exception as e:
            print(f"❌ Test {test_func.__name__} crashed: {e}")
    
    print("\n" + "=" * 50)
    print(f"🏁 Testing Complete: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ All features working correctly!")
    else:
        print("⚠️ Some features need attention")
    
    return passed == total

if __name__ == "__main__":
    # Check if server is running
    print("🚀 CatETube Tracker Feature Testing")
    print("Make sure the Flask backend is running on http://localhost:5000")
    
    input("\nPress Enter to start testing...")
    
    success = run_all_tests()
    
    if success:
        print("\n🎉 Ready for frontend testing!")
    else:
        print("\n🔧 Fix backend issues before frontend testing")