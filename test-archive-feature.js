const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@jobportal.com';
const TEST_PASSWORD = 'admin123';

async function testArchiveFeature() {
  console.log('🧪 Testing Archive Feature...\n');

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

    const { token } = await loginResponse.json();
    console.log('✅ Login successful\n');

    // Step 2: Get applications
    console.log('2️⃣ Fetching applications...');
    const appsResponse = await fetch(`${BASE_URL}/api/applications?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!appsResponse.ok) {
      throw new Error(`Failed to fetch applications: ${appsResponse.status}`);
    }

    const appsData = await appsResponse.json();
    console.log(`✅ Found ${appsData.applications.length} applications`);
    
    if (appsData.applications.length === 0) {
      console.log('❌ No applications found for testing');
      return;
    }

    const testApp = appsData.applications[0];
    console.log(`📋 Testing with application: ${testApp.candidateName} (${testApp.id})\n`);

    // Step 3: Archive the application
    console.log('3️⃣ Archiving application...');
    const archiveResponse = await fetch(`${BASE_URL}/api/applications/archive`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId: testApp.id,
        isArchived: true,
      }),
    });

    if (!archiveResponse.ok) {
      const error = await archiveResponse.json();
      throw new Error(`Archive failed: ${archiveResponse.status} - ${error.message}`);
    }

    const archiveResult = await archiveResponse.json();
    console.log('✅ Application archived successfully:', archiveResult.message);

    // Step 4: Check if application is no longer in active list
    console.log('4️⃣ Verifying application is no longer in active list...');
    const activeAppsResponse = await fetch(`${BASE_URL}/api/applications?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const activeAppsData = await activeAppsResponse.json();
    const isStillActive = activeAppsData.applications.some(app => app.id === testApp.id);
    
    if (isStillActive) {
      console.log('❌ Application is still in active list');
    } else {
      console.log('✅ Application successfully removed from active list');
    }

    // Step 5: Check if application appears in archive list
    console.log('5️⃣ Checking archived applications...');
    const archivedAppsResponse = await fetch(`${BASE_URL}/api/applications/archive?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!archivedAppsResponse.ok) {
      const error = await archivedAppsResponse.json();
      throw new Error(`Failed to fetch archived applications: ${archivedAppsResponse.status} - ${error.message}`);
    }

    const archivedAppsData = await archivedAppsResponse.json();
    const isInArchive = archivedAppsData.applications.some(app => app.id === testApp.id);
    
    if (isInArchive) {
      console.log('✅ Application found in archive list');
      console.log(`📊 Archive has ${archivedAppsData.applications.length} applications`);
    } else {
      console.log('❌ Application not found in archive list');
    }

    // Step 6: Unarchive the application
    console.log('6️⃣ Unarchiving application...');
    const unarchiveResponse = await fetch(`${BASE_URL}/api/applications/archive`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        applicationId: testApp.id,
        isArchived: false,
      }),
    });

    if (!unarchiveResponse.ok) {
      const error = await unarchiveResponse.json();
      throw new Error(`Unarchive failed: ${unarchiveResponse.status} - ${error.message}`);
    }

    const unarchiveResult = await unarchiveResponse.json();
    console.log('✅ Application unarchived successfully:', unarchiveResult.message);

    // Step 7: Verify application is back in active list
    console.log('7️⃣ Verifying application is back in active list...');
    const finalActiveAppsResponse = await fetch(`${BASE_URL}/api/applications?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const finalActiveAppsData = await finalActiveAppsResponse.json();
    const isBackActive = finalActiveAppsData.applications.some(app => app.id === testApp.id);
    
    if (isBackActive) {
      console.log('✅ Application successfully restored to active list');
    } else {
      console.log('❌ Application not found in active list after unarchiving');
    }

    console.log('\n🎉 Archive feature test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testArchiveFeature();
