// Test user token and role info
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@jobportal.com';
const TEST_PASSWORD = 'admin123';

async function testUserInfo() {
  console.log('🔍 Testing User Info...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('Token payload role:', loginData.user.role);
    console.log('User object:', JSON.stringify(loginData.user, null, 2));

    // Step 2: Test the /me endpoint to see what user data we get
    console.log('\n2️⃣ Testing /me endpoint...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
      },
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ /me endpoint successful');
      console.log('Me data:', JSON.stringify(meData, null, 2));
    } else {
      console.log('❌ /me endpoint failed:', meResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserInfo();
