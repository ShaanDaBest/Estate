import requests
import sys
import json
from datetime import datetime, date

class RealEstateAPITester:
    def __init__(self, base_url="https://agent-timeplanner.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_token = "settings_test_token_456"  # Test token from agent context
        self.created_ids = {
            'clients': [],
            'appointments': [],
            'notes': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authentication header if session token is available
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_me(self):
        """Test auth/me endpoint for profile info"""
        success, response = self.run_test(
            "Get Current User (Auth Me)",
            "GET",
            "auth/me",
            200
        )
        
        if success and response:
            print(f"   User: {response.get('name', 'Unknown')} ({response.get('email', 'No email')})")
            return True
        return success

    def test_user_settings_get(self):
        """Test GET user-settings endpoint"""
        success, response = self.run_test(
            "Get User Settings",
            "GET",
            "user-settings",
            200
        )
        
        if success and response:
            print(f"   Settings loaded: theme={response.get('theme', 'unknown')}, emailNotifications={response.get('emailNotifications', 'unknown')}")
            return True
        return success

    def test_user_settings_put(self):
        """Test PUT user-settings endpoint"""
        settings_data = {
            "emailNotifications": True,
            "appointmentReminders": True,
            "dailySummary": False,
            "reminderTime": "30",
            "workStartTime": "09:00",
            "workEndTime": "18:00",
            "workDays": ["mon", "tue", "wed", "thu", "fri"],
            "theme": "light"
        }
        
        success, response = self.run_test(
            "Update User Settings",
            "PUT",
            "user-settings",
            200,
            data=settings_data
        )
        
        if success and response:
            print(f"   Settings saved: theme={response.get('theme')}, workDays={len(response.get('workDays', []))}")
            return True
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        today = date.today().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200,
            params={"date": today}
        )
        return success

    def test_client_crud(self):
        """Test client CRUD operations"""
        # Create client
        client_data = {
            "name": "John Doe",
            "phone": "+1-555-0123",
            "phone_type": "apple",
            "email": "john.doe@example.com",
            "current_address": "123 Main St, Los Angeles, CA"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if not success:
            return False
            
        client_id = response.get('id')
        if client_id:
            self.created_ids['clients'].append(client_id)
        
        # Get all clients
        success, _ = self.run_test(
            "Get All Clients",
            "GET",
            "clients",
            200
        )
        
        if not success:
            return False
        
        # Get specific client
        if client_id:
            success, _ = self.run_test(
                "Get Client by ID",
                "GET",
                f"clients/{client_id}",
                200
            )
            
            if not success:
                return False
            
            # Update client
            updated_data = {**client_data, "name": "John Updated"}
            success, _ = self.run_test(
                "Update Client",
                "PUT",
                f"clients/{client_id}",
                200,
                data=updated_data
            )
            
            return success
        
        return True

    def test_appointment_crud(self):
        """Test appointment CRUD operations"""
        # Need a client first
        if not self.created_ids['clients']:
            print("⚠️  No clients available for appointment test")
            return False
            
        client_id = self.created_ids['clients'][0]
        today = date.today().strftime("%Y-%m-%d")
        
        appointment_data = {
            "client_id": client_id,
            "property_address": "456 Oak Ave, Beverly Hills, CA",
            "city": "Beverly Hills",
            "date": today,
            "start_time": "10:00",
            "end_time": "11:00",
            "time_at_house": 60,
            "is_open_house": False,
            "appointment_type": "private_viewing",
            "house_status": "available"
        }
        
        success, response = self.run_test(
            "Create Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data
        )
        
        if not success:
            return False
            
        appt_id = response.get('id')
        if appt_id:
            self.created_ids['appointments'].append(appt_id)
        
        # Get appointments
        success, _ = self.run_test(
            "Get Appointments",
            "GET",
            "appointments",
            200,
            params={"date": today}
        )
        
        if not success:
            return False
        
        # Update house status
        if appt_id:
            success, _ = self.run_test(
                "Update House Status",
                "PUT",
                f"appointments/{appt_id}/status",
                200,
                params={"status": "pending"}
            )
            
            return success
        
        return True

    def test_house_notes_crud(self):
        """Test house notes CRUD operations"""
        if not self.created_ids['appointments']:
            print("⚠️  No appointments available for notes test")
            return False
            
        appt_id = self.created_ids['appointments'][0]
        
        note_data = {
            "appointment_id": appt_id,
            "property_address": "456 Oak Ave, Beverly Hills, CA",
            "notes": "Beautiful property with great potential. Needs some minor repairs.",
            "follow_up_required": True
        }
        
        success, response = self.run_test(
            "Create House Note",
            "POST",
            "notes",
            200,
            data=note_data
        )
        
        if not success:
            return False
            
        note_id = response.get('id')
        if note_id:
            self.created_ids['notes'].append(note_id)
        
        # Get notes
        success, _ = self.run_test(
            "Get House Notes",
            "GET",
            "notes",
            200
        )
        
        if not success:
            return False
        
        # Update note
        if note_id:
            updated_note = {**note_data, "notes": "Updated notes with more details."}
            success, _ = self.run_test(
                "Update House Note",
                "PUT",
                f"notes/{note_id}",
                200,
                data=updated_note
            )
            
            return success
        
        return True

    def test_route_optimization(self):
        """Test route optimization"""
        today = date.today().strftime("%Y-%m-%d")
        
        success, _ = self.run_test(
            "Optimize Route",
            "POST",
            f"optimize-route?date={today}",
            200
        )
        
        return success

    def test_priority_settings(self):
        """Test priority settings"""
        # Get priorities
        success, response = self.run_test(
            "Get Priorities",
            "GET",
            "priorities",
            200
        )
        
        if not success:
            return False
        
        # Update priorities
        priority_data = {
            "priorities": [
                {"key": "open_house", "label": "Open House First", "weight": 5, "enabled": True},
                {"key": "appointment_time", "label": "Appointment Time", "weight": 4, "enabled": True},
                {"key": "distance", "label": "Shortest Distance", "weight": 3, "enabled": True},
                {"key": "time_at_house", "label": "Time at House", "weight": 2, "enabled": True},
                {"key": "city_cluster", "label": "Same City Cluster", "weight": 1, "enabled": True}
            ]
        }
        
        success, _ = self.run_test(
            "Update Priorities",
            "PUT",
            "priorities",
            200,
            data=priority_data
        )
        
        return success

    def cleanup(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete notes
        for note_id in self.created_ids['notes']:
            self.run_test(f"Delete Note {note_id}", "DELETE", f"notes/{note_id}", 200)
        
        # Delete appointments
        for appt_id in self.created_ids['appointments']:
            self.run_test(f"Delete Appointment {appt_id}", "DELETE", f"appointments/{appt_id}", 200)
        
        # Delete clients
        for client_id in self.created_ids['clients']:
            self.run_test(f"Delete Client {client_id}", "DELETE", f"clients/{client_id}", 200)

def main():
    print("🏠 Real Estate Agent Scheduler API Testing")
    print("=" * 50)
    
    tester = RealEstateAPITester()
    
    try:
        # Test API root
        success = tester.run_test("API Root", "GET", "", 200)[0]
        if not success:
            print("❌ API is not accessible")
            return 1
        
        # Test dashboard stats
        if not tester.test_dashboard_stats():
            print("❌ Dashboard stats failed")
            return 1
        
        # Test client CRUD
        if not tester.test_client_crud():
            print("❌ Client CRUD failed")
            return 1
        
        # Test appointment CRUD
        if not tester.test_appointment_crud():
            print("❌ Appointment CRUD failed")
            return 1
        
        # Test house notes CRUD
        if not tester.test_house_notes_crud():
            print("❌ House notes CRUD failed")
            return 1
        
        # Test route optimization
        if not tester.test_route_optimization():
            print("❌ Route optimization failed")
            return 1
        
        # Test priority settings
        if not tester.test_priority_settings():
            print("❌ Priority settings failed")
            return 1
        
        print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
        
        if tester.tests_passed == tester.tests_run:
            print("🎉 All backend tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1
            
    finally:
        tester.cleanup()

if __name__ == "__main__":
    sys.exit(main())