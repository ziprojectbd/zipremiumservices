import swaggerJsdoc from 'swagger-jsdoc';
import env from '@config/env';

const swaggerDefinition: swaggerJsdoc.Options['definition'] = {
  openapi: '3.0.0',
  info: {
    title: 'ZI Premium Services API',
    version: '1.0.0',
    description: 'Enterprise-grade API for ZI Premium Services backend',
    contact: {
      name: 'ZI Premium Services',
      email: 'zipremiumservices@gmail.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}/api`,
      description: 'Development server',
    },
    {
      url: env.CLIENT_URL ? `${env.CLIENT_URL}/api` : '',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT Bearer token',
      },
    },
    schemas: {
      ApiSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object', description: 'Response payload' },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          error: { type: 'object' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'array', items: { type: 'object' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              pages: { type: 'integer' },
              hasNextPage: { type: 'boolean' },
              hasPrevPage: { type: 'boolean' },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number' },
          environment: { type: 'string' },
          version: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Basic health check',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        responses: {
          '200': {
            description: 'Server is alive',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness probe (checks DB, Redis, etc.)',
        responses: {
          '200': {
            description: 'Server is ready to accept traffic',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          '503': {
            description: 'Server is not ready',
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [],
});
