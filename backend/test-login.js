const http = require('http');

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('Testing Dinesh Nair login...');
  const login = await makeRequest('POST', '/api/auth/login', {
    email: 'dinesh.nair@goldfactory.com',
    password: 'Password@123',
  });

  console.log('Login Success:', login.success);
  if (login.success) {
    console.log('User object:');
    console.log(JSON.stringify(login.data?.user, null, 2));
  } else {
    console.log('Error:', login.error);
  }
}
test().catch(console.error);
