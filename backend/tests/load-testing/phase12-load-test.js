/**
 * Load Testing Script for Phase 12 Features
 *
 * Tests system performance under load:
 * - Concurrent user simulations (API requests + Socket.io)
 * - File upload handling with multiple concurrent uploads
 * - Real-time notification delivery at scale
 * - API response time under stress
 * - Socket.io scalability and message delivery
 *
 * Usage:
 * node backend/tests/load-testing/phase12-load-test.js
 *
 * Configuration:
 * CONCURRENT_USERS: Number of simulated users (default: 50)
 * DURATION_MS: Test duration in milliseconds (default: 60000 = 1 min)
 * API_BASE_URL: Base URL for API (default: http://localhost:3000/api)
 * RESULTS_FILE: Output file for results (default: load-test-results.json)
 */

const axios = require('axios');
const WebSocket = require('ws');
const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  CONCURRENT_USERS: parseInt(process.env.CONCURRENT_USERS || '50'),
  DURATION_MS: parseInt(process.env.DURATION_MS || '60000'),
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3000',
  AUTH_TOKEN: process.env.AUTH_TOKEN || 'test-token-123',
  RESULTS_FILE: process.env.RESULTS_FILE || 'load-test-results.json',
};

// Test state
const results = {
  timestamp: new Date().toISOString(),
  config,
  metrics: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    minResponseTime: Infinity,
    maxResponseTime: 0,
    responseTimes: [],
    errorsByType: {},
    endpointMetrics: {},
  },
  socketMetrics: {
    connectionsEstablished: 0,
    connectionsFailed: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    averageMessageLatency: 0,
    messageLatencies: [],
  },
  fileUploadMetrics: {
    totalUploads: 0,
    successfulUploads: 0,
    failedUploads: 0,
    totalBytesUploaded: 0,
    averageUploadTime: 0,
    uploadTimes: [],
  },
};

/**
 * Simulate a single user making API requests
 */
async function simulateUser(userId) {
  const userResults = {
    userId,
    requests: [],
    errors: [],
  };

  try {
    // Test 1: Get pending assignments
    await makeAPIRequest(
      'GET',
      '/workers/pending-assignments-count',
      null,
      userResults,
      'GET_ASSIGNMENTS'
    );

    // Test 2: Get work data
    const orderId = `order-${Math.floor(Math.random() * 1000)}`;
    await makeAPIRequest('GET', `/workers/work/${orderId}`, null, userResults, 'GET_WORK_DATA');

    // Test 3: Start work
    await makeAPIRequest(
      'POST',
      `/workers/work/${orderId}/start`,
      { startedAt: new Date() },
      userResults,
      'START_WORK'
    );

    // Test 4: Save work progress (autosave)
    await makeAPIRequest(
      'POST',
      `/workers/work/${orderId}/save`,
      {
        formData: {
          field1: 'test value',
          field2: 'another value',
        },
        lastSavedAt: new Date(),
      },
      userResults,
      'SAVE_WORK'
    );

    // Test 5: Upload file
    await simulateFileUpload(orderId, userResults);

    // Test 6: Upload photos
    await simulatePhotoUpload(orderId, userResults);

    // Test 7: Get notifications
    await makeAPIRequest(
      'GET',
      '/notifications?limit=10&offset=0',
      null,
      userResults,
      'GET_NOTIFICATIONS'
    );

    // Test 8: Mark notification as read
    const notificationId = `notification-${Math.floor(Math.random() * 1000)}`;
    await makeAPIRequest(
      'PATCH',
      `/notifications/${notificationId}/read`,
      {},
      userResults,
      'MARK_NOTIFICATION_READ'
    );

    // Test 9: Complete work
    await makeAPIRequest(
      'POST',
      `/workers/work/${orderId}/complete`,
      {
        formData: {
          field1: 'final value',
        },
        completedAt: new Date(),
      },
      userResults,
      'COMPLETE_WORK'
    );

    return userResults;
  } catch (error) {
    userResults.errors.push({
      message: error.message,
      stack: error.stack,
    });
    return userResults;
  }
}

/**
 * Make an HTTP request and record metrics
 */
async function makeAPIRequest(method, endpoint, data, userResults, endpointName) {
  const startTime = Date.now();

  try {
    const config = {
      method,
      url: `${results.config.API_BASE_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${results.config.AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    // Record metrics
    results.metrics.totalRequests++;
    results.metrics.successfulRequests++;
    results.metrics.responseTimes.push(responseTime);
    results.metrics.minResponseTime = Math.min(results.metrics.minResponseTime, responseTime);
    results.metrics.maxResponseTime = Math.max(results.metrics.maxResponseTime, responseTime);

    // Record endpoint-specific metrics
    if (!results.metrics.endpointMetrics[endpointName]) {
      results.metrics.endpointMetrics[endpointName] = {
        count: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: [],
      };
    }

    results.metrics.endpointMetrics[endpointName].count++;
    results.metrics.endpointMetrics[endpointName].successful++;
    results.metrics.endpointMetrics[endpointName].responseTimes.push(responseTime);

    userResults.requests.push({
      endpoint: endpointName,
      method,
      status: response.status,
      responseTime,
      timestamp: new Date(),
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    results.metrics.totalRequests++;
    results.metrics.failedRequests++;
    results.metrics.responseTimes.push(responseTime);

    const errorType = error.response?.status || error.code || 'UNKNOWN';
    results.metrics.errorsByType[errorType] = (results.metrics.errorsByType[errorType] || 0) + 1;

    // Record endpoint failure
    if (!results.metrics.endpointMetrics[endpointName]) {
      results.metrics.endpointMetrics[endpointName] = {
        count: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        responseTimes: [],
      };
    }

    results.metrics.endpointMetrics[endpointName].count++;
    results.metrics.endpointMetrics[endpointName].failed++;
    results.metrics.endpointMetrics[endpointName].responseTimes.push(responseTime);

    userResults.errors.push({
      endpoint: endpointName,
      error: error.message,
      status: error.response?.status,
    });
  }
}

/**
 * Simulate file upload
 */
async function simulateFileUpload(orderId, userResults) {
  const startTime = Date.now();

  try {
    // Create fake file data (10 KB)
    const fileData = Buffer.alloc(10 * 1024);

    // Simulate FormData file upload
    const response = await axios.post(
      `${results.config.API_BASE_URL}/workers/work/${orderId}/upload-file`,
      {
        file: fileData,
        filename: `test-file-${Date.now()}.pdf`,
      },
      {
        headers: {
          Authorization: `Bearer ${results.config.AUTH_TOKEN}`,
        },
      }
    );

    const uploadTime = Date.now() - startTime;

    results.fileUploadMetrics.totalUploads++;
    results.fileUploadMetrics.successfulUploads++;
    results.fileUploadMetrics.totalBytesUploaded += fileData.length;
    results.fileUploadMetrics.uploadTimes.push(uploadTime);

    userResults.requests.push({
      endpoint: 'UPLOAD_FILE',
      method: 'POST',
      status: response.status,
      responseTime: uploadTime,
      bytesUploaded: fileData.length,
    });
  } catch (error) {
    const uploadTime = Date.now() - startTime;

    results.fileUploadMetrics.totalUploads++;
    results.fileUploadMetrics.failedUploads++;
    results.fileUploadMetrics.uploadTimes.push(uploadTime);

    userResults.errors.push({
      endpoint: 'UPLOAD_FILE',
      error: error.message,
    });
  }
}

/**
 * Simulate photo upload
 */
async function simulatePhotoUpload(orderId, userResults) {
  const startTime = Date.now();

  try {
    // Create fake image data (50 KB)
    const imageData = Buffer.alloc(50 * 1024);

    const response = await axios.post(
      `${results.config.API_BASE_URL}/workers/work/${orderId}/upload-photos`,
      {
        files: [imageData],
        category: 'before-work',
      },
      {
        headers: {
          Authorization: `Bearer ${results.config.AUTH_TOKEN}`,
        },
      }
    );

    const uploadTime = Date.now() - startTime;

    results.fileUploadMetrics.totalUploads++;
    results.fileUploadMetrics.successfulUploads++;
    results.fileUploadMetrics.totalBytesUploaded += imageData.length;
    results.fileUploadMetrics.uploadTimes.push(uploadTime);

    userResults.requests.push({
      endpoint: 'UPLOAD_PHOTOS',
      method: 'POST',
      status: response.status,
      responseTime: uploadTime,
      bytesUploaded: imageData.length,
    });
  } catch (error) {
    const uploadTime = Date.now() - startTime;

    results.fileUploadMetrics.totalUploads++;
    results.fileUploadMetrics.failedUploads++;
    results.fileUploadMetrics.uploadTimes.push(uploadTime);

    userResults.errors.push({
      endpoint: 'UPLOAD_PHOTOS',
      error: error.message,
    });
  }
}

/**
 * Simulate Socket.io connection and message delivery
 */
async function simulateSocketConnection(userId) {
  return new Promise((resolve) => {
    const socket = io(results.config.SOCKET_URL, {
      auth: {
        token: results.config.AUTH_TOKEN,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    const socketResults = {
      userId,
      connected: false,
      messagesReceived: 0,
      latencies: [],
    };

    socket.on('connect', () => {
      results.socketMetrics.connectionsEstablished++;
      socketResults.connected = true;

      // Send heartbeat messages
      const sendHeartbeat = () => {
        const timestamp = Date.now();

        socket.emit('ping', { timestamp, userId }, (response) => {
          const latency = Date.now() - timestamp;
          results.socketMetrics.messageLatencies.push(latency);
          socketResults.latencies.push(latency);
          results.socketMetrics.messagesDelivered++;
        });
      };

      // Send heartbeats every second for 10 seconds
      let count = 0;
      const heartbeatInterval = setInterval(() => {
        if (count >= 10) {
          clearInterval(heartbeatInterval);
          socket.disconnect();
          resolve(socketResults);
        } else {
          sendHeartbeat();
          count++;
        }
      }, 1000);
    });

    socket.on('NEW_NOTIFICATION', (notification) => {
      socketResults.messagesReceived++;
      results.socketMetrics.messagesDelivered++;
    });

    socket.on('connect_error', (error) => {
      results.socketMetrics.connectionsFailed++;
      socketResults.errors = socketResults.errors || [];
      socketResults.errors.push(error.message);
      resolve(socketResults);
    });

    socket.on('disconnect', () => {
      if (!socketResults.connected) {
        resolve(socketResults);
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      socket.disconnect();
      resolve(socketResults);
    }, 30000);
  });
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log(`\n🚀 Starting Phase 12 Load Test`);
  console.log(`   Concurrent Users: ${config.CONCURRENT_USERS}`);
  console.log(`   Duration: ${config.DURATION_MS / 1000}s`);
  console.log(`   API Base URL: ${config.API_BASE_URL}`);
  console.log(`\n`);

  const startTime = Date.now();
  const userPromises = [];

  // Spawn user simulations
  for (let i = 0; i < config.CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
    userPromises.push(simulateSocketConnection(i));

    // Stagger user creation slightly
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Wait for all users to complete or timeout
  const racingPromise = Promise.race([
    Promise.all(userPromises),
    new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), config.DURATION_MS)),
  ]);

  console.log(`⏳ Running simulations...`);
  const result = await racingPromise;

  const totalDuration = Date.now() - startTime;

  console.log(`✅ Completed in ${totalDuration}ms\n`);

  // Calculate averages
  if (results.metrics.responseTimes.length > 0) {
    results.metrics.averageResponseTime =
      results.metrics.responseTimes.reduce((a, b) => a + b, 0) /
      results.metrics.responseTimes.length;
  }

  if (results.socketMetrics.messageLatencies.length > 0) {
    results.socketMetrics.averageMessageLatency =
      results.socketMetrics.messageLatencies.reduce((a, b) => a + b, 0) /
      results.socketMetrics.messageLatencies.length;
  }

  if (results.fileUploadMetrics.uploadTimes.length > 0) {
    results.fileUploadMetrics.averageUploadTime =
      results.fileUploadMetrics.uploadTimes.reduce((a, b) => a + b, 0) /
      results.fileUploadMetrics.uploadTimes.length;
  }

  // Calculate endpoint averages
  Object.keys(results.metrics.endpointMetrics).forEach((endpoint) => {
    const metric = results.metrics.endpointMetrics[endpoint];
    if (metric.responseTimes.length > 0) {
      metric.avgResponseTime =
        metric.responseTimes.reduce((a, b) => a + b, 0) / metric.responseTimes.length;
    }
  });

  // Save results
  fs.writeFileSync(config.RESULTS_FILE, JSON.stringify(results, null, 2));

  console.log('📊 Load Test Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📈 HTTP API Metrics:`);
  console.log(`   Total Requests: ${results.metrics.totalRequests}`);
  console.log(
    `   Successful: ${results.metrics.successfulRequests} (${(
      (results.metrics.successfulRequests / results.metrics.totalRequests) *
      100
    ).toFixed(1)}%)`
  );
  console.log(
    `   Failed: ${results.metrics.failedRequests} (${(
      (results.metrics.failedRequests / results.metrics.totalRequests) *
      100
    ).toFixed(1)}%)`
  );
  console.log(`   Avg Response Time: ${results.metrics.averageResponseTime.toFixed(2)}ms`);
  console.log(`   Min Response Time: ${results.metrics.minResponseTime}ms`);
  console.log(`   Max Response Time: ${results.metrics.maxResponseTime}ms`);

  console.log(`\n🔌 Socket.io Metrics:`);
  console.log(`   Connections Established: ${results.socketMetrics.connectionsEstablished}`);
  console.log(`   Connection Failures: ${results.socketMetrics.connectionsFailed}`);
  console.log(`   Messages Delivered: ${results.socketMetrics.messagesDelivered}`);
  console.log(
    `   Avg Message Latency: ${results.socketMetrics.averageMessageLatency.toFixed(2)}ms`
  );

  console.log(`\n📁 File Upload Metrics:`);
  console.log(`   Total Uploads: ${results.fileUploadMetrics.totalUploads}`);
  console.log(`   Successful: ${results.fileUploadMetrics.successfulUploads}`);
  console.log(`   Failed: ${results.fileUploadMetrics.failedUploads}`);
  console.log(
    `   Total Data: ${(results.fileUploadMetrics.totalBytesUploaded / 1024 / 1024).toFixed(2)}MB`
  );
  console.log(`   Avg Upload Time: ${results.fileUploadMetrics.averageUploadTime.toFixed(2)}ms`);

  console.log(`\n❌ Errors by Type:`);
  Object.entries(results.metrics.errorsByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log(`\n📊 Endpoint Performance:`);
  Object.entries(results.metrics.endpointMetrics).forEach(([endpoint, metric]) => {
    const successRate = ((metric.successful / metric.count) * 100).toFixed(1);
    console.log(
      `   ${endpoint}: ${
        metric.count
      } requests, ${successRate}% success, ${metric.avgResponseTime.toFixed(2)}ms avg`
    );
  });

  console.log(`\n💾 Results saved to: ${config.RESULTS_FILE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Exit with appropriate code
  const successRate = (results.metrics.successfulRequests / results.metrics.totalRequests) * 100;
  if (successRate >= 95) {
    console.log('✅ LOAD TEST PASSED: Success rate >= 95%\n');
    process.exit(0);
  } else {
    console.log('⚠️ LOAD TEST WARNING: Success rate < 95%\n');
    process.exit(1);
  }
}

// Run the test
runLoadTest().catch((error) => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
