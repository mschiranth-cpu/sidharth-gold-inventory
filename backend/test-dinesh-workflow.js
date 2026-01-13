const http = require('http');

const API_BASE = 'http://localhost:3000';

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('🔐 Testing Dinesh Login...');

  // Login as Dinesh
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    email: 'dinesh.nair@goldfactory.com',
    password: 'Password@123',
  });

  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.error);
    return;
  }

  console.log('Login Data keys:', Object.keys(loginResult.data));
  const token = loginResult.data.tokens?.accessToken || loginResult.data.accessToken;
  const user = loginResult.data.user;
  console.log('✅ Login Success:', user.name);
  console.log('   Department:', user.department);
  console.log('   Role:', user.role);
  console.log('   Token (first 50):', token?.substring(0, 50) + '...');

  // Test work details API directly with the known order ID
  const orderId = '1d31aff1-e4d1-423c-ae03-0be95ecd283c'; // Known PRINT order
  console.log('\n📝 Testing Work Details API...');
  console.log('   Order ID:', orderId);
  const workResult = await makeRequest('GET', `/api/workers/work/${orderId}`, null, token);

  if (!workResult.success) {
    console.log('❌ Failed to get work details:', workResult.error);
  } else {
    const data = workResult.data;
    console.log('✅ Work Details loaded!');
    console.log('   Response keys:', Object.keys(data));
    console.log('   Order Number:', data.orderNumber || data.order?.orderNumber);
    console.log('   Department Name:', data.departmentName);
    console.log('   Status:', data.status || data.tracking?.status);
    console.log('   Tracking ID:', data.departmentTrackingId || data.tracking?.id);
    console.log('   Work Data:', data.workData ? 'EXISTS' : 'NONE (new work)');
    console.log('\n✅ ALL TESTS PASSED! Dinesh can access the 3D Print work page!');
  }
}

test().catch(console.error);
