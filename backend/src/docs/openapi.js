const IssueSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    citizen_id: { type: 'string', format: 'uuid' },
    category: { type: 'string', enum: ['Garbage', 'Road', 'Water', 'Lighting', 'Drainage', 'Sewerage', 'Public Safety', 'Other'] },
    ward: { type: 'string' },
    landmark: { type: 'string' },
    description: { type: 'string' },
    photo_url: { type: 'string', nullable: true },
    latitude: { type: 'number', format: 'double', nullable: true, minimum: -90, maximum: 90 },
    longitude: { type: 'number', format: 'double', nullable: true, minimum: -180, maximum: 180 },
    status: { type: 'string', enum: ['Pending', 'In Progress', 'Resolved'] },
    ai_priority: { type: 'string', enum: ['Low', 'Medium', 'Critical'] },
    ai_department: { type: 'string' },
    ai_reason: { type: 'string' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const PublicIssueSchema = {
  type: 'object',
  properties: Object.fromEntries(
    Object.entries(IssueSchema.properties).filter(([key]) => key !== 'citizen_id' && key !== 'updated_at'),
  ),
};

const ErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
    errors: { type: 'object', additionalProperties: { type: 'string' } },
  },
};

const PaginationParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
  { name: 'category', in: 'query', schema: { type: 'string', enum: ['Garbage', 'Road', 'Water', 'Lighting', 'Drainage', 'Sewerage', 'Public Safety', 'Other'] } },
  { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'In Progress', 'Resolved'] } },
  { name: 'search', in: 'query', schema: { type: 'string' } },
];

const PaginatedResponse = (itemSchema) => ({
  type: 'object',
  properties: {
    issues: { type: 'array', items: itemSchema },
    page: { type: 'integer' },
    pageSize: { type: 'integer' },
    total: { type: 'integer' },
  },
});

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Resolve LK API',
    version: '1.0.0',
    description:
      'Civic-issue reporting and resolution API. Reporting and browsing are public; only "My Reports" and the admin dashboard require a session. See docs/srs/06-api-specification.md in the repo for the full write-up.',
  },
  servers: [{ url: '/api' }],
  components: {
    schemas: {
      Issue: IssueSchema,
      PublicIssue: PublicIssueSchema,
      Error: ErrorSchema,
    },
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Supabase JWT' },
    },
  },
  paths: {
    '/issues': {
      post: {
        summary: 'Submit a civic issue report (public — doubles as citizen signup via NIC)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['nic', 'email', 'category', 'ward', 'landmark', 'description'],
                properties: {
                  nic: { type: 'string', example: '200112345678' },
                  email: { type: 'string', format: 'email' },
                  full_name: { type: 'string' },
                  category: { type: 'string', enum: ['Garbage', 'Road', 'Water', 'Lighting', 'Drainage', 'Sewerage', 'Public Safety', 'Other'] },
                  ward: { type: 'string' },
                  landmark: { type: 'string' },
                  description: { type: 'string', minLength: 20 },
                  photo: { type: 'string', format: 'binary' },
                  latitude: { type: 'number', format: 'double', minimum: -90, maximum: 90 },
                  longitude: { type: 'number', format: 'double', minimum: -180, maximum: 180 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Report created',
            content: { 'application/json': { schema: IssueSchema } },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
      get: {
        summary: "List issues (citizen: own only, admin: all) — requires a session",
        security: [{ bearerAuth: [] }],
        parameters: PaginationParams,
        responses: {
          200: {
            description: 'Paginated issue list',
            content: { 'application/json': { schema: PaginatedResponse(IssueSchema) } },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/issues/public': {
      get: {
        summary: 'Anonymous, paginated issue feed for the landing page',
        parameters: PaginationParams,
        responses: {
          200: {
            description: 'Paginated public issue list',
            content: { 'application/json': { schema: PaginatedResponse(PublicIssueSchema) } },
          },
        },
      },
    },
    '/issues/{id}': {
      get: {
        summary: 'Fetch one issue (citizen: own only, admin: any)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Issue', content: { 'application/json': { schema: IssueSchema } } },
          404: { description: 'Not found', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/issues/{id}/status': {
      patch: {
        summary: 'Update an issue status (admin only; Resolved awards the reporter a points bonus)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['Pending', 'In Progress', 'Resolved'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Updated issue', content: { 'application/json': { schema: IssueSchema } } },
          403: { description: 'Forbidden', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/my-reports/login': {
      post: {
        summary: "Sign in with NIC only — resolves to the account's real email server-side",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['nic'], properties: { nic: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: {
            description: 'Session for the frontend to adopt with supabase.auth.setSession()',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { session: { type: 'object' } } },
              },
            },
          },
          404: { description: 'No account for this NIC', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
  },
};
