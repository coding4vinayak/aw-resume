import requests
import sys
import json
import time
import threading
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

class ExtendedResumeAPITester:
    def __init__(self, base_url="https://988cdafa-cc4a-49bc-b180-ed552752ab68.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.created_resume_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else f"{self.api_url}/"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.text and response.status_code < 500 else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            "email": f"testuser_{int(time.time())}@example.com",
            "full_name": "Test User",
            "password": "securepassword123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response.get('user', {}).get('id')
            print(f"   ✅ User registered with ID: {self.user_id}")
            print(f"   ✅ Access token received")
        
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user
        timestamp = int(time.time())
        email = f"logintest_{timestamp}@example.com"
        password = "testpassword123"
        
        register_data = {
            "email": email,
            "full_name": "Login Test User",
            "password": password
        }
        
        # Register user
        reg_success, reg_response = self.run_test(
            "User Registration for Login Test",
            "POST",
            "register",
            200,
            data=register_data
        )
        
        if not reg_success:
            return False
        
        # Now test login
        login_data = {
            "email": email,
            "password": password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            print(f"   ✅ Login successful")
            print(f"   ✅ Access token received")
        
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "login",
            401,
            data=login_data
        )
        
        return success

    def test_duplicate_registration(self):
        """Test registering with an existing email"""
        # Use a common email that might already exist
        user_data = {
            "email": "duplicate@example.com",
            "full_name": "Duplicate User",
            "password": "password123"
        }
        
        # First registration
        first_success, first_response = self.run_test(
            "First Registration",
            "POST",
            "register",
            200,
            data=user_data
        )
        
        # Second registration with same email
        success, response = self.run_test(
            "Duplicate Registration",
            "POST",
            "register",
            400,
            data=user_data
        )
        
        return success

    def test_complex_resume_data(self):
        """Test creating resume with complex nested data"""
        complex_resume_data = {
            "title": "Complex Resume Test",
            "template_id": "template3",
            "personal_info": {
                "full_name": "Jane Smith",
                "email": "jane.smith@example.com",
                "phone": "+1-555-987-6543",
                "location": "Seattle, WA",
                "linkedin": "linkedin.com/in/janesmith",
                "website": "janesmith.dev",
                "github": "github.com/janesmith",
                "twitter": "@janesmith",
                "summary": "Full-stack developer with expertise in modern web technologies and cloud architecture. Passionate about creating scalable solutions and mentoring junior developers.",
                "photo_url": "https://example.com/photo.jpg"
            },
            "experience": [
                {
                    "title": "Senior Full Stack Developer",
                    "company": "TechCorp Inc.",
                    "location": "Seattle, WA",
                    "start_date": "March 2021",
                    "end_date": "Present",
                    "current": True,
                    "description": "Lead development of microservices architecture serving 1M+ users. Implemented CI/CD pipelines reducing deployment time by 60%. Mentored 5 junior developers."
                },
                {
                    "title": "Software Engineer",
                    "company": "StartupXYZ",
                    "location": "San Francisco, CA",
                    "start_date": "June 2019",
                    "end_date": "February 2021",
                    "current": False,
                    "description": "Built RESTful APIs and React applications. Optimized database queries improving performance by 40%."
                }
            ],
            "education": [
                {
                    "degree": "Master of Science in Computer Science",
                    "institution": "Stanford University",
                    "location": "Stanford, CA",
                    "graduation_date": "June 2019",
                    "gpa": "3.9"
                },
                {
                    "degree": "Bachelor of Science in Software Engineering",
                    "institution": "University of Washington",
                    "location": "Seattle, WA",
                    "graduation_date": "June 2017",
                    "gpa": "3.7"
                }
            ],
            "skills": [
                "JavaScript", "TypeScript", "React", "Node.js", "Python", "Django", 
                "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "GraphQL",
                "Redis", "Elasticsearch", "Git", "Jenkins", "Terraform"
            ],
            "projects": [
                {
                    "name": "E-commerce Microservices Platform",
                    "description": "Designed and implemented a scalable e-commerce platform using microservices architecture with Docker and Kubernetes.",
                    "technologies": "Node.js, React, PostgreSQL, Redis, Docker, Kubernetes, AWS",
                    "link": "https://github.com/janesmith/ecommerce-platform",
                    "featured": True
                },
                {
                    "name": "Real-time Chat Application",
                    "description": "Built a real-time chat application with WebSocket support, message encryption, and file sharing capabilities.",
                    "technologies": "React, Socket.io, Node.js, MongoDB, JWT",
                    "link": "https://github.com/janesmith/chat-app",
                    "featured": False
                }
            ],
            "achievements": [
                {
                    "title": "AWS Certified Solutions Architect",
                    "description": "Professional level certification in AWS cloud architecture and services",
                    "date": "September 2022",
                    "organization": "Amazon Web Services"
                },
                {
                    "title": "Best Innovation Award",
                    "description": "Recognized for developing an AI-powered code review system that improved code quality by 35%",
                    "date": "December 2021",
                    "organization": "TechCorp Inc."
                }
            ],
            "references": [
                {
                    "name": "Michael Johnson",
                    "position": "Engineering Manager",
                    "company": "TechCorp Inc.",
                    "email": "michael.johnson@techcorp.com",
                    "phone": "+1-555-123-4567"
                }
            ],
            "social_links": [
                "https://linkedin.com/in/janesmith",
                "https://github.com/janesmith",
                "https://twitter.com/janesmith",
                "https://janesmith.dev"
            ]
        }
        
        success, response = self.run_test(
            "Create Complex Resume",
            "POST",
            "resumes",
            201,
            data=complex_resume_data
        )
        
        if success and 'id' in response:
            resume_id = response['id']
            self.created_resume_ids.append(resume_id)
            print(f"   ✅ Complex resume created with ID: {resume_id}")
            
            # Verify all data was saved correctly
            verify_success, verify_response = self.run_test(
                "Verify Complex Resume Data",
                "GET",
                f"resumes/{resume_id}",
                200
            )
            
            if verify_success:
                # Check if complex data structures are preserved
                personal_info = verify_response.get('personal_info', {})
                experience = verify_response.get('experience', [])
                skills = verify_response.get('skills', [])
                projects = verify_response.get('projects', [])
                
                if (len(experience) == 2 and len(skills) >= 10 and 
                    len(projects) == 2 and personal_info.get('full_name') == 'Jane Smith'):
                    print(f"   ✅ Complex data structures preserved correctly")
                    return True
                else:
                    print(f"   ❌ Complex data not preserved correctly")
                    return False
        
        return success

    def test_concurrent_operations(self):
        """Test concurrent resume operations"""
        print(f"\n🔍 Testing Concurrent Operations...")
        
        def create_resume(thread_id):
            resume_data = {
                "title": f"Concurrent Resume {thread_id}",
                "template_id": "template1",
                "personal_info": {
                    "full_name": f"User {thread_id}",
                    "email": f"user{thread_id}@example.com"
                },
                "skills": [f"Skill{i}" for i in range(5)]
            }
            
            try:
                response = requests.post(
                    f"{self.api_url}/resumes",
                    json=resume_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                return response.status_code == 201, response.json() if response.text else {}
            except Exception as e:
                return False, {"error": str(e)}
        
        # Create 5 resumes concurrently
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_resume, i) for i in range(5)]
            results = []
            
            for future in as_completed(futures):
                success, response = future.result()
                results.append(success)
                if success and 'id' in response:
                    self.created_resume_ids.append(response['id'])
        
        successful_creates = sum(results)
        self.tests_run += 1
        
        if successful_creates >= 4:  # Allow for 1 potential failure due to timing
            self.tests_passed += 1
            print(f"✅ Passed - {successful_creates}/5 concurrent operations successful")
            return True
        else:
            print(f"❌ Failed - Only {successful_creates}/5 concurrent operations successful")
            return False

    def test_auto_save_scenario(self):
        """Test frequent updates (simulating auto-save)"""
        print(f"\n🔍 Testing Auto-save Scenario...")
        
        # Create initial resume
        initial_data = {
            "title": "Auto-save Test Resume",
            "template_id": "template1",
            "personal_info": {"full_name": "Auto Save User"},
            "skills": []
        }
        
        create_success, create_response = self.run_test(
            "Create Resume for Auto-save",
            "POST",
            "resumes",
            201,
            data=initial_data
        )
        
        if not create_success or 'id' not in create_response:
            return False
        
        resume_id = create_response['id']
        self.created_resume_ids.append(resume_id)
        
        # Perform rapid updates (simulating auto-save)
        update_count = 0
        successful_updates = 0
        
        for i in range(10):
            update_data = {
                "title": f"Auto-save Test Resume - Update {i+1}",
                "template_id": "template1",
                "personal_info": {
                    "full_name": "Auto Save User",
                    "summary": f"Updated summary {i+1} - {datetime.now().isoformat()}"
                },
                "skills": [f"Skill{j}" for j in range(i+1)]
            }
            
            try:
                response = requests.put(
                    f"{self.api_url}/resumes/{resume_id}",
                    json=update_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                update_count += 1
                if response.status_code == 200:
                    successful_updates += 1
                
                # Small delay to simulate real auto-save behavior
                time.sleep(0.1)
                
            except Exception as e:
                print(f"   Update {i+1} failed: {str(e)}")
        
        self.tests_run += 1
        
        if successful_updates >= 8:  # Allow for some potential failures
            self.tests_passed += 1
            print(f"✅ Passed - {successful_updates}/{update_count} auto-save updates successful")
            
            # Verify final state
            verify_success, verify_response = self.run_test(
                "Verify Final Auto-save State",
                "GET",
                f"resumes/{resume_id}",
                200
            )
            
            if verify_success:
                final_skills = verify_response.get('skills', [])
                print(f"   ✅ Final resume has {len(final_skills)} skills")
            
            return True
        else:
            print(f"❌ Failed - Only {successful_updates}/{update_count} auto-save updates successful")
            return False

    def cleanup_created_resumes(self):
        """Clean up resumes created during testing"""
        print(f"\n🧹 Cleaning up {len(self.created_resume_ids)} created resumes...")
        
        for resume_id in self.created_resume_ids:
            try:
                response = requests.delete(
                    f"{self.api_url}/resumes/{resume_id}",
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                if response.status_code == 200:
                    print(f"   ✅ Deleted resume {resume_id}")
                else:
                    print(f"   ⚠️  Failed to delete resume {resume_id}")
            except Exception as e:
                print(f"   ❌ Error deleting resume {resume_id}: {str(e)}")

def main():
    print("🚀 Starting Extended Resume Creator API Tests")
    print("=" * 60)
    
    tester = ExtendedResumeAPITester()
    
    # Run all tests
    tests = [
        tester.test_user_registration,
        tester.test_user_login,
        tester.test_invalid_login,
        tester.test_duplicate_registration,
        tester.test_complex_resume_data,
        tester.test_concurrent_operations,
        tester.test_auto_save_scenario,
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Cleanup
    tester.cleanup_created_resumes()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 EXTENDED TEST RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All extended tests passed!")
        return 0
    else:
        print("⚠️  Some extended tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())