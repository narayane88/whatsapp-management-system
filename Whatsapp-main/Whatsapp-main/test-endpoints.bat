@echo off
echo Testing Permission API Endpoints
echo ====================================

echo.
echo 1. Testing GET /api/permissions (without auth - should return 401)
curl -s -w "\nStatus Code: %%{http_code}\n" "http://localhost:3000/api/permissions"

echo.
echo.
echo 2. Testing POST /api/permissions (without auth - should return 401)
curl -s -w "\nStatus Code: %%{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"id\":\"test.permission\",\"name\":\"Test Permission\",\"description\":\"A test permission\",\"category\":\"Test\"}" "http://localhost:3000/api/permissions"

echo.
echo.
echo 3. Testing basic application health
curl -s -w "\nStatus Code: %%{http_code}\n" -I "http://localhost:3000/"

echo.
echo API endpoint testing complete!
echo.
echo To test with authentication:
echo 1. Open http://localhost:3000
echo 2. Sign in with owner@demo.com
echo 3. Navigate to Admin -^> Users -^> Permissions tab
echo 4. Try creating a new permission