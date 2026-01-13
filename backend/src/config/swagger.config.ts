import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// =============================================================================
// Swagger/OpenAPI Configuration
// =============================================================================

// Load OpenAPI spec from YAML file
const openApiPath = path.join(__dirname, '../../openapi.yaml');
let swaggerSpec: any;

try {
  const openApiContent = fs.readFileSync(openApiPath, 'utf8');
  swaggerSpec = yaml.load(openApiContent);

  // Update server URL to match current environment
  const port = process.env.PORT || 3000;
  swaggerSpec.servers = [
    {
      url: `http://localhost:${port}/api`,
      description: 'Development server',
    },
    {
      url: 'https://staging-api.goldfactory.com/api',
      description: 'Staging server',
    },
    {
      url: 'https://api.goldfactory.com/api',
      description: 'Production server',
    },
  ];
} catch (error) {
  console.error('Failed to load OpenAPI spec from YAML file:', error);
  // Fallback to inline definition if YAML file fails to load
  swaggerSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Gold Factory Inventory API',
      version: '1.0.0',
      description: `
## Overview
RESTful API for the Gold Factory Inventory Tracking System. This API provides endpoints for managing orders, users, departments, inventory, and factory tracking.

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **File uploads**: 20 requests per hour

## Error Handling
All errors follow a consistent format:
\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`
    `,
      contact: {
        name: 'Gold Factory Support',
        email: 'support@goldfactory.com',
        url: 'https://goldfactory.com/support',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://staging-api.goldfactory.com/api',
        description: 'Staging server',
      },
      {
        url: 'https://api.goldfactory.com/api',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Orders',
        description: 'Order management and tracking',
      },
      {
        name: 'Departments',
        description: 'Department management',
      },
      {
        name: 'Factory',
        description: 'Factory tracking and inventory',
      },
      {
        name: 'Notifications',
        description: 'User notifications',
      },
      {
        name: 'Reports',
        description: 'Analytics and reporting',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'HTTP-only refresh token cookie',
        },
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'WORKER'], example: 'MANAGER' },
            departmentId: { type: 'string', format: 'uuid', nullable: true },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserCreate: {
          type: 'object',
          required: ['email', 'password', 'name', 'role'],
          properties: {
            email: { type: 'string', format: 'email', example: 'newuser@example.com' },
            password: { type: 'string', minLength: 8, example: 'SecurePass123!' },
            name: { type: 'string', example: 'Jane Smith' },
            role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'WORKER'], example: 'WORKER' },
            departmentId: { type: 'string', format: 'uuid', nullable: true },
          },
        },

        // Order schemas
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'string', example: 'ORD-2024-001' },
            customerName: { type: 'string', example: 'ABC Jewelers' },
            product: { type: 'string', example: 'Gold Necklace 22K' },
            quantity: { type: 'integer', example: 5 },
            goldWeight: { type: 'number', format: 'float', example: 45.5 },
            purity: { type: 'string', enum: ['24K', '22K', '18K', '14K'], example: '22K' },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'DELIVERED'],
              example: 'IN_PROGRESS',
            },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              example: 'HIGH',
            },
            dueDate: { type: 'string', format: 'date-time' },
            notes: { type: 'string', nullable: true },
            currentDepartmentId: { type: 'string', format: 'uuid' },
            createdById: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderCreate: {
          type: 'object',
          required: ['customerName', 'product', 'quantity', 'goldWeight', 'purity', 'dueDate'],
          properties: {
            customerName: { type: 'string', example: 'ABC Jewelers' },
            product: { type: 'string', example: 'Gold Necklace 22K' },
            quantity: { type: 'integer', minimum: 1, example: 5 },
            goldWeight: { type: 'number', format: 'float', minimum: 0.1, example: 45.5 },
            purity: { type: 'string', enum: ['24K', '22K', '18K', '14K'], example: '22K' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              default: 'MEDIUM',
            },
            dueDate: { type: 'string', format: 'date-time' },
            notes: { type: 'string', nullable: true },
            departmentId: { type: 'string', format: 'uuid' },
          },
        },
        OrderUpdate: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'DELIVERED'],
            },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            notes: { type: 'string' },
            currentDepartmentId: { type: 'string', format: 'uuid' },
          },
        },

        // Department schemas
        Department: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Melting' },
            description: { type: 'string', example: 'Gold melting and purification' },
            sequence: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },

        // Common schemas
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'An error occurred' },
            code: { type: 'string', example: 'ERROR_CODE' },
            details: { type: 'object' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
        PaginatedOrders: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Order' },
            },
            pagination: { $ref: '#/components/schemas/Pagination' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Invalid or expired token',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'You do not have permission to perform this action',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: {
                  email: 'Invalid email format',
                },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: { type: 'integer', default: 1, minimum: 1 },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field (prefix with - for descending)',
          schema: { type: 'string', example: '-createdAt' },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {}, // Paths will come from openapi.yaml
  };
}

export function setupSwagger(app: Express): void {
  // Serve Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #d4af37; }
      `,
      customSiteTitle: 'Gold Factory API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        tryItOutEnabled: true,
      },
    })
  );

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve OpenAPI spec as YAML
  app.get('/api-docs.yaml', (req, res) => {
    const yaml = require('js-yaml');
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yaml.dump(swaggerSpec));
  });
}

export { swaggerSpec };
