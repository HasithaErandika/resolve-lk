const CATEGORIES = ['Garbage', 'Road', 'Water', 'Lighting', 'Drainage', 'Sewerage', 'Public Safety', 'Other'];
const STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Verified', 'Reopened'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const REDIRECT_AUTHORITIES = ['NWSDB', 'RDA', 'PRDA', 'CEB', 'Police', 'Other'];

const IssueSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    citizen_id: { type: 'string', format: 'uuid' },
    council_id: { type: 'string', format: 'uuid' },
    category: { type: 'string', enum: CATEGORIES },
    ward: { type: 'string' },
    landmark: { type: 'string' },
    description: { type: 'string' },
    photo_url: { type: 'string', nullable: true },
    latitude: { type: 'number', format: 'double', nullable: true, minimum: -90, maximum: 90 },
    longitude: { type: 'number', format: 'double', nullable: true, minimum: -180, maximum: 180 },
    status: { type: 'string', enum: STATUSES },
    ai_priority: { type: 'string', enum: PRIORITIES },
    ai_jurisdiction: { type: 'string', enum: ['in_council', 'redirect'] },
    ai_redirect_authority: { type: 'string', enum: REDIRECT_AUTHORITIES, nullable: true },
    ai_department: { type: 'string', nullable: true },
    ai_reason: { type: 'string' },
    sla_ack_due_at: { type: 'string', format: 'date-time' },
    sla_resolve_due_at: { type: 'string', format: 'date-time' },
    escalated: { type: 'boolean' },
    reopened_count: { type: 'integer' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const PublicIssueSchema = {
  type: 'object',
  properties: Object.fromEntries(Object.entries(IssueSchema.properties).filter(([key]) => key !== 'citizen_id')),
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
  { name: 'category', in: 'query', schema: { type: 'string', enum: CATEGORIES } },
  { name: 'status', in: 'query', schema: { type: 'string', enum: STATUSES } },
  { name: 'council_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
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
    version: '2.0.0',
    description:
      'Civic-issue reporting and resolution API for real Sri Lankan Municipal Councils. Reporting and browsing are public; ' +
      '"My Reports" is NIC + one-time code (never a password); Municipal Officers and Provincial Officers have real, ' +
      'never self-registered accounts. See docs/srs/07-api-specification.md in the repo for the full write-up.',
  },
  servers: [{ url: '/api' }],
  components: {
    schemas: { Issue: IssueSchema, PublicIssue: PublicIssueSchema, Error: ErrorSchema },
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Supabase JWT' },
    },
  },
  paths: {
    '/issues': {
      post: {
        summary: 'Submit a civic issue report (public - doubles as citizen signup via NIC, no password set)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['nic', 'contact_email', 'category', 'council_id', 'ward', 'landmark', 'description'],
                properties: {
                  nic: { type: 'string', example: '200112345678' },
                  contact_email: { type: 'string', format: 'email' },
                  contact_phone: { type: 'string' },
                  full_name: { type: 'string' },
                  category: { type: 'string', enum: CATEGORIES },
                  council_id: { type: 'string', format: 'uuid' },
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
            description: 'Report created. `suggested_council` is a Haversine-based nearest-council hint (null if it matches the submitted council_id, or no GPS was given) - never a validation error.',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    IssueSchema,
                    {
                      type: 'object',
                      properties: {
                        suggested_council: {
                          type: 'object',
                          nullable: true,
                          properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' }, distanceKm: { type: 'number' } },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
      get: {
        summary: 'List issues, scoped by role (citizen: own only; Municipal Officer: own council; Provincial Officer: own province) - requires a session',
        security: [{ bearerAuth: [] }],
        parameters: PaginationParams,
        responses: {
          200: { description: 'Paginated issue list', content: { 'application/json': { schema: PaginatedResponse(IssueSchema) } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/issues/public': {
      get: {
        summary: 'Anonymous, paginated issue feed for the landing page',
        parameters: PaginationParams,
        responses: {
          200: { description: 'Paginated public issue list', content: { 'application/json': { schema: PaginatedResponse(PublicIssueSchema) } } },
        },
      },
    },
    '/issues/{id}': {
      get: {
        summary: 'Fetch one issue, scoped identically to GET /issues',
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
        summary:
          'Advance an issue through the status pipeline. Forward moves (Submitted→Acknowledged→In Progress→Resolved, ' +
          'Reopened→In Progress) require the owning council\'s Municipal Officer. Resolved→Verified/Reopened require the reporting citizen.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: STATUSES }, note: { type: 'string' } } },
            },
          },
        },
        responses: {
          200: { description: 'Updated issue', content: { 'application/json': { schema: IssueSchema } } },
          400: { description: 'Invalid transition', content: { 'application/json': { schema: ErrorSchema } } },
          403: { description: 'Forbidden - wrong role for this transition', content: { 'application/json': { schema: ErrorSchema } } },
          404: { description: 'Not found or outside caller scope', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/my-reports/otp/request': {
      post: {
        summary: 'Step 1 of citizen access to their own history - sends a one-time code to the email on file',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['nic'], properties: { nic: { type: 'string' } } } } },
        },
        responses: {
          200: { description: 'Same response whether or not the NIC is registered, to avoid leaking which NICs exist', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          400: { description: 'Invalid NIC format', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/my-reports/otp/verify': {
      post: {
        summary: 'Step 2 - exchanges NIC + one-time code for a session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['nic', 'code'], properties: { nic: { type: 'string' }, code: { type: 'string', example: '482913' } } },
            },
          },
        },
        responses: {
          200: {
            description: 'Session for the frontend to adopt with supabase.auth.setSession()',
            content: { 'application/json': { schema: { type: 'object', properties: { session: { type: 'object' } } } } },
          },
          400: { description: 'Invalid or expired code', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/councils': {
      get: {
        summary: 'Public list of councils (for the report form picker and officer-provisioning forms)',
        responses: { 200: { description: 'Councils', content: { 'application/json': { schema: { type: 'object', properties: { councils: { type: 'array' } } } } } } },
      },
    },
    '/councils/stats': {
      get: {
        summary: 'Public SLA-transparency stats - replaces the old citizen contribution-points system',
        parameters: [
          { name: 'council_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'category', in: 'query', schema: { type: 'string', enum: CATEGORIES } },
        ],
        responses: { 200: { description: 'Stats', content: { 'application/json': { schema: { type: 'object', properties: { stats: { type: 'array' } } } } } } },
      },
    },
    '/councils/nearest': {
      get: {
        summary: 'Haversine-based nearest-council suggestion for a GPS point (a suggestion, never a validation gate)',
        parameters: [
          { name: 'latitude', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'longitude', in: 'query', required: true, schema: { type: 'number' } },
        ],
        responses: { 200: { description: 'Nearest council', content: { 'application/json': { schema: { type: 'object', properties: { nearest: { type: 'object', nullable: true } } } } } } },
      },
    },
    '/provinces': {
      get: {
        summary: 'Public list of provinces',
        responses: { 200: { description: 'Provinces', content: { 'application/json': { schema: { type: 'object', properties: { provinces: { type: 'array' } } } } } } },
      },
    },
    '/provincial/escalations': {
      get: {
        summary: 'The Provincial Officer escalation queue (SLA-breached, unresolved issues across their own province)',
        security: [{ bearerAuth: [] }],
        parameters: PaginationParams,
        responses: {
          200: { description: 'Escalated issues', content: { 'application/json': { schema: PaginatedResponse(IssueSchema) } } },
          403: { description: 'Forbidden - Provincial Officer only', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/provincial/municipal-officers': {
      post: {
        summary: "Provincial Officer only - provisions a Municipal Officer account for a council in the caller's own province",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['council_id', 'email'], properties: { council_id: { type: 'string', format: 'uuid' }, email: { type: 'string', format: 'email' }, full_name: { type: 'string' } } },
            },
          },
        },
        responses: {
          201: { description: 'Created (includes a temporary password to relay out of band)', content: { 'application/json': { schema: { type: 'object' } } } },
          403: { description: 'Council is outside the caller\'s province', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
    '/admin/provincial-officers': {
      post: {
        summary: 'System Administrator only - provisions a Provincial Officer account for a province',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['province_id', 'email'], properties: { province_id: { type: 'string', format: 'uuid' }, email: { type: 'string', format: 'email' }, full_name: { type: 'string' } } },
            },
          },
        },
        responses: {
          201: { description: 'Created (includes a temporary password to relay out of band)', content: { 'application/json': { schema: { type: 'object' } } } },
          403: { description: 'System Administrator only', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
  },
};
