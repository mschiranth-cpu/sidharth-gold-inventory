const axios = require('axios');

async function testAPIData() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'ativa.web.it@gmail.com',
      password: 'Password@123',
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.data.tokens.accessToken;

    if (!token) {
      console.error('No token found in response');
      return;
    }

    console.log('Login successful! Token:', token.substring(0, 40) + '...');

    // Fetch orders
    const ordersResponse = await axios.get(
      'http://localhost:3000/api/orders?status=IN_FACTORY&limit=5',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const order = ordersResponse.data.data[0];

    console.log('=== Order Data ===');
    console.log('Order Number:', order.orderNumber);
    console.log('Status:', order.status);
    console.log('Current Department:', order.currentDepartment);
    console.log('\n=== Department Tracking ===');

    if (order.departmentTracking) {
      order.departmentTracking.forEach((dt) => {
        console.log(`\nDepartment: ${dt.departmentName}`);
        console.log(`Status: ${dt.status}`);
        console.log(`Assigned To:`, dt.assignedTo?.name || 'Unassigned');
        console.log(`Completion Progress: ${dt.completionPercentage ?? 'N/A'}%`);
        console.log(`Work Data:`, dt.workData ? 'Present' : 'Not present');
        if (dt.workData) {
          console.log(`  - isComplete: ${dt.workData.isComplete}`);
          console.log(`  - formData: ${dt.workData.formData ? 'Present' : 'Empty'}`);
          console.log(`  - uploadedFiles: ${dt.workData.uploadedFiles?.length || 0}`);
          console.log(`  - uploadedPhotos: ${dt.workData.uploadedPhotos?.length || 0}`);
        }
      });
    } else {
      console.log('No department tracking data');
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPIData();
