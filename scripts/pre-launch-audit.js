#!/usr/bin/env node

/**
 * Pre-Launch Audit Script
 * Run before production deployment to verify system readiness
 *
 * Usage: node scripts/pre-launch-audit.js [--fix] [--verbose]
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");
const http = require("http");

// Configuration
const CONFIG = {
  backendDir: path.join(__dirname, "..", "backend"),
  frontendDir: path.join(__dirname, "..", "frontend"),
  coverageThreshold: 70,
  apiUrl: process.env.API_URL || "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Parse arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes("--verbose") || args.includes("-v");
const FIX = args.includes("--fix");

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

// =============================================================================
// Utility Functions
// =============================================================================

function log(message, type = "info") {
  const icons = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    section: `${colors.cyan}►${colors.reset}`,
  };
  console.log(`${icons[type] || ""} ${message}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${"═".repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${"═".repeat(60)}${colors.reset}\n`);
}

function recordResult(name, passed, message, category) {
  results.checks.push({ name, passed, message, category });
  if (passed === true) {
    results.passed++;
    log(`${name}: ${message}`, "pass");
  } else if (passed === false) {
    results.failed++;
    log(`${name}: ${message}`, "fail");
  } else {
    results.warnings++;
    log(`${name}: ${message}`, "warn");
  }
}

function execCommand(command, cwd = process.cwd()) {
  try {
    return execSync(command, { cwd, encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readEnvFile(filePath) {
  if (!fileExists(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  });
  return env;
}

async function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode, data, headers: res.headers })
      );
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

// =============================================================================
// Check Functions
// =============================================================================

async function checkEnvironmentVariables() {
  section("Environment Variables");

  const requiredBackendVars = [
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "REDIS_URL",
    "NODE_ENV",
  ];

  const requiredFrontendVars = ["VITE_API_URL"];

  const sensitiveVars = ["JWT_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];

  // Check backend env
  const backendEnvPath = path.join(CONFIG.backendDir, ".env");
  const backendEnv = readEnvFile(backendEnvPath);

  for (const varName of requiredBackendVars) {
    const value = backendEnv[varName] || process.env[varName];
    if (value) {
      // Check if it's a placeholder value
      if (
        value.includes("your-") ||
        value.includes("changeme") ||
        value === "secret"
      ) {
        recordResult(
          `Backend ${varName}`,
          false,
          "Contains placeholder value",
          "env"
        );
      } else {
        recordResult(`Backend ${varName}`, true, "Set correctly", "env");
      }
    } else {
      recordResult(`Backend ${varName}`, false, "Not set", "env");
    }
  }

  // Check sensitive vars length
  for (const varName of sensitiveVars) {
    const value = backendEnv[varName] || process.env[varName];
    if (value && varName.includes("SECRET") && value.length < 32) {
      recordResult(
        `${varName} strength`,
        false,
        "Secret should be at least 32 characters",
        "env"
      );
    }
  }

  // Check NODE_ENV is production
  const nodeEnv = backendEnv["NODE_ENV"] || process.env.NODE_ENV;
  if (nodeEnv !== "production") {
    recordResult(
      "NODE_ENV",
      "warn",
      `Set to "${nodeEnv}" (should be "production" for launch)`,
      "env"
    );
  }

  // Check frontend env
  const frontendEnvPath = path.join(CONFIG.frontendDir, ".env");
  const frontendEnv = readEnvFile(frontendEnvPath);

  for (const varName of requiredFrontendVars) {
    const value = frontendEnv[varName];
    if (value) {
      if (value.includes("localhost")) {
        recordResult(
          `Frontend ${varName}`,
          "warn",
          "Points to localhost",
          "env"
        );
      } else {
        recordResult(`Frontend ${varName}`, true, "Set correctly", "env");
      }
    } else {
      recordResult(`Frontend ${varName}`, false, "Not set", "env");
    }
  }
}

async function checkDatabaseConnection() {
  section("Database Connection");

  const result = execCommand(
    'npx prisma db execute --stdin <<< "SELECT 1"',
    CONFIG.backendDir
  );
  if (result !== null) {
    recordResult(
      "Database connection",
      true,
      "Connected successfully",
      "database"
    );
  } else {
    // Try alternative method
    const result2 = execCommand("npx prisma migrate status", CONFIG.backendDir);
    if (result2 && !result2.includes("error")) {
      recordResult(
        "Database connection",
        true,
        "Connected successfully",
        "database"
      );
    } else {
      recordResult(
        "Database connection",
        false,
        "Cannot connect to database",
        "database"
      );
    }
  }
}

async function checkMigrations() {
  section("Database Migrations");

  const result = execCommand("npx prisma migrate status", CONFIG.backendDir);
  if (result) {
    if (result.includes("Database schema is up to date")) {
      recordResult("Migrations", true, "All migrations applied", "database");
    } else if (result.includes("pending migration")) {
      recordResult("Migrations", false, "Pending migrations exist", "database");
    } else {
      recordResult("Migrations", true, "Migration status OK", "database");
    }
  } else {
    recordResult(
      "Migrations",
      false,
      "Cannot check migration status",
      "database"
    );
  }
}

async function checkRedisConnection() {
  section("Redis Connection");

  // Check if Redis is explicitly disabled
  const backendEnv = readEnvFile(path.join(CONFIG.backendDir, ".env"));
  const redisUrl = backendEnv["REDIS_URL"] || process.env.REDIS_URL;

  if (redisUrl === "disabled" || redisUrl === "false" || redisUrl === "none") {
    recordResult(
      "Redis connection",
      "warn",
      "Redis disabled (optional)",
      "redis"
    );
    return;
  }

  const result = execCommand("redis-cli ping");
  if (result && result.trim() === "PONG") {
    recordResult("Redis connection", true, "Connected successfully", "redis");
  } else {
    // Try with URL
    if (redisUrl) {
      const result2 = execCommand(`redis-cli -u "${redisUrl}" ping`);
      if (result2 && result2.trim() === "PONG") {
        recordResult(
          "Redis connection",
          true,
          "Connected successfully",
          "redis"
        );
      } else {
        recordResult(
          "Redis connection",
          false,
          "Cannot connect to Redis",
          "redis"
        );
      }
    } else {
      recordResult(
        "Redis connection",
        "warn",
        "Redis URL not configured",
        "redis"
      );
    }
  }
}

async function checkFileUploadDirectory() {
  section("File System");

  const uploadDirs = [
    path.join(CONFIG.backendDir, "uploads"),
    path.join(CONFIG.backendDir, "tmp"),
  ];

  for (const dir of uploadDirs) {
    if (fileExists(dir)) {
      try {
        const testFile = path.join(dir, ".write-test");
        fs.writeFileSync(testFile, "test");
        fs.unlinkSync(testFile);
        recordResult(
          `Directory ${path.basename(dir)}`,
          true,
          "Writable",
          "filesystem"
        );
      } catch {
        recordResult(
          `Directory ${path.basename(dir)}`,
          false,
          "Not writable",
          "filesystem"
        );
      }
    } else {
      if (FIX) {
        fs.mkdirSync(dir, { recursive: true });
        recordResult(
          `Directory ${path.basename(dir)}`,
          true,
          "Created",
          "filesystem"
        );
      } else {
        recordResult(
          `Directory ${path.basename(dir)}`,
          false,
          "Does not exist",
          "filesystem"
        );
      }
    }
  }
}

async function checkSSLCertificates() {
  section("SSL Certificates");

  const frontendEnv = readEnvFile(path.join(CONFIG.frontendDir, ".env"));
  const apiUrl = frontendEnv["VITE_API_URL"] || CONFIG.apiUrl;

  if (apiUrl.startsWith("https://")) {
    try {
      const url = new URL(apiUrl);
      const response = await httpRequest(apiUrl + "/health", { method: "GET" });
      recordResult("SSL certificate", true, "Valid and working", "ssl");
    } catch (error) {
      if (error.code === "CERT_HAS_EXPIRED") {
        recordResult("SSL certificate", false, "Certificate expired", "ssl");
      } else if (error.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
        recordResult(
          "SSL certificate",
          "warn",
          "Self-signed certificate",
          "ssl"
        );
      } else {
        recordResult(
          "SSL certificate",
          "warn",
          `Cannot verify: ${error.message}`,
          "ssl"
        );
      }
    }
  } else {
    recordResult("SSL certificate", "warn", "API URL is not HTTPS", "ssl");
  }
}

async function checkAPIHealth() {
  section("API Health");

  try {
    const response = await httpRequest(`${CONFIG.apiUrl}/health`);
    if (response.status === 200) {
      recordResult("API health endpoint", true, "Responding correctly", "api");

      // Check response time
      const start = Date.now();
      await httpRequest(`${CONFIG.apiUrl}/health`);
      const responseTime = Date.now() - start;

      if (responseTime < 100) {
        recordResult("API response time", true, `${responseTime}ms`, "api");
      } else if (responseTime < 500) {
        recordResult(
          "API response time",
          "warn",
          `${responseTime}ms (consider optimizing)`,
          "api"
        );
      } else {
        recordResult(
          "API response time",
          false,
          `${responseTime}ms (too slow)`,
          "api"
        );
      }
    } else {
      recordResult(
        "API health endpoint",
        false,
        `Status ${response.status}`,
        "api"
      );
    }
  } catch (error) {
    recordResult(
      "API health endpoint",
      false,
      `Not reachable: ${error.message}`,
      "api"
    );
  }
}

async function checkSecurityHeaders() {
  section("Security Headers");

  try {
    const response = await httpRequest(`${CONFIG.apiUrl}/health`);
    const headers = response.headers;

    const securityHeaders = {
      "x-content-type-options": "nosniff",
      "x-frame-options": ["DENY", "SAMEORIGIN"],
      "x-xss-protection": "0",
      "strict-transport-security": null, // Just check existence
    };

    for (const [header, expectedValue] of Object.entries(securityHeaders)) {
      const value = headers[header];
      if (value) {
        if (
          expectedValue === null ||
          value === expectedValue ||
          (Array.isArray(expectedValue) && expectedValue.includes(value))
        ) {
          recordResult(`Header ${header}`, true, value, "security");
        } else {
          recordResult(
            `Header ${header}`,
            "warn",
            `${value} (expected: ${expectedValue})`,
            "security"
          );
        }
      } else {
        recordResult(`Header ${header}`, false, "Missing", "security");
      }
    }
  } catch (error) {
    recordResult(
      "Security headers",
      false,
      `Cannot check: ${error.message}`,
      "security"
    );
  }
}

async function checkRateLimiting() {
  section("Rate Limiting");

  try {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(httpRequest(`${CONFIG.apiUrl}/health`));
    }

    const responses = await Promise.all(requests);
    const allOk = responses.every((r) => r.status === 200);

    if (allOk) {
      recordResult(
        "Rate limiting",
        "warn",
        "Not triggered (may need more requests)",
        "security"
      );
    }

    // Check for rate limit headers
    const response = responses[0];
    if (response.headers["x-ratelimit-limit"]) {
      recordResult(
        "Rate limit headers",
        true,
        `Limit: ${response.headers["x-ratelimit-limit"]}`,
        "security"
      );
    } else {
      recordResult("Rate limit headers", "warn", "Not present", "security");
    }
  } catch (error) {
    if (error.message.includes("429")) {
      recordResult("Rate limiting", true, "Working correctly", "security");
    } else {
      recordResult(
        "Rate limiting",
        "warn",
        `Cannot verify: ${error.message}`,
        "security"
      );
    }
  }
}

async function checkCORSConfiguration() {
  section("CORS Configuration");

  try {
    const response = await httpRequest(`${CONFIG.apiUrl}/health`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://malicious-site.com",
        "Access-Control-Request-Method": "GET",
      },
    });

    const allowOrigin = response.headers["access-control-allow-origin"];

    if (allowOrigin === "*") {
      recordResult("CORS", false, "Allows all origins (insecure)", "security");
    } else if (allowOrigin === "https://malicious-site.com") {
      recordResult("CORS", false, "Allows unknown origins", "security");
    } else if (!allowOrigin) {
      recordResult("CORS", true, "Blocks unknown origins", "security");
    } else {
      recordResult("CORS", true, `Configured: ${allowOrigin}`, "security");
    }
  } catch (error) {
    recordResult("CORS", "warn", `Cannot verify: ${error.message}`, "security");
  }
}

async function checkFrontendBuild() {
  section("Frontend Build");

  // Check if dist exists
  const distPath = path.join(CONFIG.frontendDir, "dist");
  if (fileExists(distPath)) {
    recordResult("Frontend build", true, "dist/ directory exists", "build");

    // Check index.html
    const indexPath = path.join(distPath, "index.html");
    if (fileExists(indexPath)) {
      recordResult("index.html", true, "Exists", "build");
    } else {
      recordResult("index.html", false, "Missing", "build");
    }
  } else {
    recordResult(
      "Frontend build",
      false,
      "dist/ directory missing (run npm run build)",
      "build"
    );
  }

  // Try to build
  if (VERBOSE) {
    log("Running frontend build check...", "info");
    const result = execCommand("npm run build 2>&1", CONFIG.frontendDir);
    if (result && !result.includes("error")) {
      recordResult("Frontend build test", true, "Builds successfully", "build");
    } else {
      recordResult("Frontend build test", false, "Build failed", "build");
    }
  }
}

async function checkTests() {
  section("Tests");

  // Backend tests
  if (VERBOSE) {
    log("Running backend tests...", "info");
    const backendResult = execCommand(
      "npm test -- --passWithNoTests 2>&1",
      CONFIG.backendDir
    );
    if (backendResult && !backendResult.includes("FAIL")) {
      recordResult("Backend tests", true, "All passing", "tests");
    } else {
      recordResult("Backend tests", false, "Some tests failing", "tests");
    }
  } else {
    recordResult(
      "Backend tests",
      "warn",
      "Skipped (use --verbose to run)",
      "tests"
    );
  }

  // Frontend tests
  if (VERBOSE) {
    log("Running frontend tests...", "info");
    const frontendResult = execCommand(
      "npm test -- --run 2>&1",
      CONFIG.frontendDir
    );
    if (frontendResult && !frontendResult.includes("FAIL")) {
      recordResult("Frontend tests", true, "All passing", "tests");
    } else {
      recordResult("Frontend tests", false, "Some tests failing", "tests");
    }
  } else {
    recordResult(
      "Frontend tests",
      "warn",
      "Skipped (use --verbose to run)",
      "tests"
    );
  }
}

async function checkCodeCoverage() {
  section("Code Coverage");

  const coveragePath = path.join(
    CONFIG.backendDir,
    "coverage",
    "coverage-summary.json"
  );
  if (fileExists(coveragePath)) {
    try {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
      const totalCoverage = coverage.total?.lines?.pct || 0;

      if (totalCoverage >= CONFIG.coverageThreshold) {
        recordResult(
          "Code coverage",
          true,
          `${totalCoverage}% (threshold: ${CONFIG.coverageThreshold}%)`,
          "tests"
        );
      } else {
        recordResult(
          "Code coverage",
          false,
          `${totalCoverage}% (below ${CONFIG.coverageThreshold}% threshold)`,
          "tests"
        );
      }
    } catch {
      recordResult(
        "Code coverage",
        "warn",
        "Cannot parse coverage report",
        "tests"
      );
    }
  } else {
    recordResult("Code coverage", "warn", "No coverage report found", "tests");
  }
}

async function checkProductionCode() {
  section("Production Code Quality");

  const srcDirs = [
    path.join(CONFIG.backendDir, "src"),
    path.join(CONFIG.frontendDir, "src"),
  ];

  for (const srcDir of srcDirs) {
    const dirName = srcDir.includes("backend") ? "Backend" : "Frontend";

    // Check for console.log
    const consoleLogResult = execCommand(
      `grep -r "console\\.log" "${srcDir}" --include="*.ts" --include="*.tsx" | grep -v "// eslint" | wc -l`
    );
    const consoleCount = parseInt(consoleLogResult?.trim() || "0", 10);

    if (consoleCount === 0) {
      recordResult(`${dirName} console.log`, true, "None found", "code");
    } else {
      recordResult(
        `${dirName} console.log`,
        "warn",
        `${consoleCount} occurrences found`,
        "code"
      );
    }

    // Check for hardcoded credentials
    const credPatterns = [
      "password\\s*=\\s*[\"'][^\"']+[\"']",
      "secret\\s*=\\s*[\"'][^\"']+[\"']",
      "apikey\\s*=\\s*[\"'][^\"']+[\"']",
    ];

    let hasHardcodedCreds = false;
    for (const pattern of credPatterns) {
      const result = execCommand(
        `grep -rE "${pattern}" "${srcDir}" --include="*.ts" --include="*.tsx" | grep -v "process\\.env" | grep -v "example" | head -1`
      );
      if (result && result.trim()) {
        hasHardcodedCreds = true;
        break;
      }
    }

    if (!hasHardcodedCreds) {
      recordResult(
        `${dirName} hardcoded credentials`,
        true,
        "None found",
        "code"
      );
    } else {
      recordResult(
        `${dirName} hardcoded credentials`,
        false,
        "Potential credentials in code",
        "code"
      );
    }
  }

  // Check for TODO/FIXME
  const todoResult = execCommand(
    `grep -rE "(TODO|FIXME|XXX)" "${CONFIG.backendDir}/src" "${CONFIG.frontendDir}/src" --include="*.ts" --include="*.tsx" | wc -l`
  );
  const todoCount = parseInt(todoResult?.trim() || "0", 10);

  if (todoCount === 0) {
    recordResult("TODO/FIXME comments", true, "None found", "code");
  } else {
    recordResult(
      "TODO/FIXME comments",
      "warn",
      `${todoCount} found (review before launch)`,
      "code"
    );
  }
}

// =============================================================================
// Main Execution
// =============================================================================

async function runAudit() {
  console.log(
    `\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`
  );
  console.log(
    `${colors.cyan}║           PRE-LAUNCH AUDIT - Gold Factory Inventory        ║${colors.reset}`
  );
  console.log(
    `${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`
  );
  console.log(`\nStarted: ${new Date().toISOString()}`);
  console.log(
    `Mode: ${VERBOSE ? "Verbose" : "Quick"} ${FIX ? "(with auto-fix)" : ""}\n`
  );

  // Run all checks
  await checkEnvironmentVariables();
  await checkDatabaseConnection();
  await checkMigrations();
  await checkRedisConnection();
  await checkFileUploadDirectory();
  await checkSSLCertificates();
  await checkAPIHealth();
  await checkSecurityHeaders();
  await checkRateLimiting();
  await checkCORSConfiguration();
  await checkFrontendBuild();
  await checkTests();
  await checkCodeCoverage();
  await checkProductionCode();

  // Summary
  section("AUDIT SUMMARY");

  console.log(`${colors.green}Passed:   ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:   ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${"─".repeat(30)}`);
  console.log(
    `Total:    ${results.passed + results.failed + results.warnings}`
  );

  // Exit code
  if (results.failed > 0) {
    console.log(
      `\n${colors.red}❌ AUDIT FAILED - Fix ${results.failed} issue(s) before launch${colors.reset}\n`
    );
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log(
      `\n${colors.yellow}⚠️  AUDIT PASSED WITH WARNINGS - Review ${results.warnings} warning(s)${colors.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(
      `\n${colors.green}✅ AUDIT PASSED - Ready for launch!${colors.reset}\n`
    );
    process.exit(0);
  }
}

// Run the audit
runAudit().catch((error) => {
  console.error(
    `${colors.red}Audit failed with error: ${error.message}${colors.reset}`
  );
  process.exit(2);
});
