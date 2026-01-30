import requests
import sys
import json
from datetime import datetime, date

class AuthAPITester:
    def __init__(self, base_url="https://agent-timeplanner.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_token = "test_session_1769751886344"  # From created test user
        self.user_id = "test-user-1769751886344"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, use_auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth header if required
        if use_auth and self.session_token:
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

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint with valid session"""
        success, response = self.run_test(
            "Auth Me (Valid Session)",
            "GET",
            "auth/me",
            200,
            use_auth=True
        )
        
        if success:
            # Verify response contains user data
            if 'user_id' in response and 'email' in response:
                print(f"   User ID: {response.get('user_id')}")
                print(f"   Email: {response.get('email')}")
                return True
            else:
                print("❌ Response missing required user fields")
                return False
        return False

    def test_auth_me_no_token(self):
        """Test /auth/me endpoint without session token"""
        success, response = self.run_test(
            "Auth Me (No Token)",
            "GET",
            "auth/me",
            401,
            use_auth=False
        )
        return success

    def test_auth_me_invalid_token(self):
        """Test /auth/me endpoint with invalid session token"""
        # Temporarily use invalid token
        original_token = self.session_token
        self.session_token = "invalid_token_123"
        
        success, response = self.run_test(
            "Auth Me (Invalid Token)",
            "GET",
            "auth/me",
            401,
            use_auth=True
        )
        
        # Restore original token
        self.session_token = original_token
        return success

    def test_protected_endpoints_without_auth(self):
        """Test that protected endpoints require authentication"""
        endpoints_to_test = [
            ("clients", "GET"),
            ("appointments", "GET"),
            ("notes", "GET"),
            ("dashboard/stats", "GET"),
            ("priorities", "GET")
        ]
        
        all_passed = True
        for endpoint, method in endpoints_to_test:
            success, _ = self.run_test(
                f"Protected {endpoint} (No Auth)",
                method,
                endpoint,
                401,
                use_auth=False
            )
            if not success:
                all_passed = False
        
        return all_passed

    def test_protected_endpoints_with_auth(self):
        """Test that protected endpoints work with valid authentication"""
        endpoints_to_test = [
            ("clients", "GET"),
            ("appointments", "GET"),
            ("notes", "GET"),
            ("dashboard/stats", "GET"),
            ("priorities", "GET")
        ]
        
        all_passed = True
        for endpoint, method in endpoints_to_test:
            success, _ = self.run_test(
                f"Protected {endpoint} (With Auth)",
                method,
                endpoint,
                200,
                use_auth=True
            )
            if not success:
                all_passed = False
        
        return all_passed

    def test_user_data_isolation(self):
        """Test that user data is properly isolated"""
        # Create a client for this user
        client_data = {
            "name": "Test Client Auth",
            "phone": "+1-555-9999",
            "phone_type": "apple",
            "email": "test.auth@example.com",
            "current_address": "123 Auth Test St, Test City, CA"
        }
        
        success, response = self.run_test(
            "Create Client (Auth User)",
            "POST",
            "clients",
            200,
            data=client_data,
            use_auth=True
        )
        
        if not success:
            return False
        
        client_id = response.get('id')
        
        # Verify the client has the correct user_id
        success, response = self.run_test(
            "Get Client (Verify User ID)",
            "GET",
            f"clients/{client_id}",
            200,
            use_auth=True
        )
        
        if success:
            if response.get('user_id') == self.user_id:
                print(f"   ✅ Client correctly associated with user: {self.user_id}")
                
                # Clean up
                self.run_test(
                    "Delete Test Client",
                    "DELETE",
                    f"clients/{client_id}",
                    200,
                    use_auth=True
                )
                return True
            else:
                print(f"   ❌ Client has wrong user_id: {response.get('user_id')} (expected: {self.user_id})")
                return False
        
        return False

    def test_session_endpoint(self):
        """Test session creation endpoint (mock test)"""
        # Note: We can't fully test this without a real session_id from Emergent Auth
        # But we can test the endpoint exists and handles invalid session_id properly
        
        success, response = self.run_test(
            "Auth Session (Invalid Session ID)",
            "POST",
            "auth/session",
            401,  # Should fail with invalid session_id
            data={"session_id": "invalid_session_123"},
            use_auth=False
        )
        
        return success

    def test_logout_endpoint(self):
        """Test logout endpoint"""
        # Note: This will invalidate our session, so we test it last
        success, response = self.run_test(
            "Auth Logout",
            "POST",
            "auth/logout",
            200,
            use_auth=True
        )
        
        if success:
            # After logout, auth/me should fail
            success_after_logout, _ = self.run_test(
                "Auth Me (After Logout)",
                "GET",
                "auth/me",
                401,
                use_auth=True
            )
            return success_after_logout
        
        return False

def main():
    print("🔐 Real Estate Agent Scheduler Auth Testing")
    print("=" * 50)
    
    tester = AuthAPITester()
    
    # Test auth/me with valid session
    if not tester.test_auth_me_endpoint():
        print("❌ Auth me endpoint failed")
        return 1
    
    # Test auth/me without token
    if not tester.test_auth_me_no_token():
        print("❌ Auth me (no token) test failed")
        return 1
    
    # Test auth/me with invalid token
    if not tester.test_auth_me_invalid_token():
        print("❌ Auth me (invalid token) test failed")
        return 1
    
    # Test protected endpoints without auth
    if not tester.test_protected_endpoints_without_auth():
        print("❌ Protected endpoints (no auth) test failed")
        return 1
    
    # Test protected endpoints with auth
    if not tester.test_protected_endpoints_with_auth():
        print("❌ Protected endpoints (with auth) test failed")
        return 1
    
    # Test user data isolation
    if not tester.test_user_data_isolation():
        print("❌ User data isolation test failed")
        return 1
    
    # Test session endpoint
    if not tester.test_session_endpoint():
        print("❌ Session endpoint test failed")
        return 1
    
    # Test logout endpoint (this should be last as it invalidates the session)
    if not tester.test_logout_endpoint():
        print("❌ Logout endpoint test failed")
        return 1
    
    print(f"\n📊 Auth Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All auth tests passed!")
        return 0
    else:
        print("⚠️  Some auth tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())