import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';
import { reportJobQueue } from '../src/jobs/reportQueue';

const app = createApp();

const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
const TEST_TOKEN = `test-token-${TEST_USER_ID}`;
const OTHER_USER_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_TOKEN = `test-token-${OTHER_USER_ID}`;

describe('DevTask AI — Complete System & Integration Test Suite', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await db.initSchema();
  });

  afterAll(async () => {
    await reportJobQueue.drain();
    await db.close();
  });

  // TEST 1: Health endpoint
  describe('1. Health Endpoint (GET /health)', () => {
    it('should return 200 OK and database connected status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'DevTask AI');
      expect(res.body).toHaveProperty('database', 'connected');
    });
  });

  // TEST 4: Missing Auth
  describe('2. Authentication & Authorization Middleware', () => {
    it('should return 401 Unauthorized when missing Authorization header', async () => {
      const res = await request(app).get('/projects');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Missing or invalid Authorization header/i);
    });

    it('should return 401 Unauthorized for invalid Bearer format', async () => {
      const res = await request(app)
        .get('/projects')
        .set('Authorization', 'Basic invalidcredentials');
      expect(res.status).toBe(401);
    });

    it('should register a new user via POST /auth/signup', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@devtask.ai', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.user).toHaveProperty('email', 'test@devtask.ai');
    });

    it('should log in a user via POST /auth/login', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@devtask.ai', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
    });
  });

  // TEST 2, 3, 5: Projects Management
  describe('3. Project Management Endpoints', () => {
    let createdProjectId: string;

    // TEST 3: Missing project title -> 400
    it('should return 400 Bad Request when creating project without title/name', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ description: 'No name given' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed|name is required/i);
    });

    // TEST 2: Project creation -> 201
    it('should create a project and return 201 Created', async () => {
      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'AI Code Planner Platform',
          description: 'Autonomous architectural planning microservice',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('AI Code Planner Platform');
      expect(res.body.data.user_id).toBe(TEST_USER_ID);
      createdProjectId = res.body.data.id;
    });

    it('should list projects for the authenticated user', async () => {
      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((p: any) => p.id === createdProjectId)).toBe(true);
    });

    it('should get project details by ID with task metrics', async () => {
      const res = await request(app)
        .get(`/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdProjectId);
      expect(res.body.data.name).toBe('AI Code Planner Platform');
    });

    // TEST 5: Invalid project ID -> 404
    it('should return 404 Not Found for non-existent project ID', async () => {
      const res = await request(app)
        .get('/projects/00000000-0000-0000-0000-000000000999')
        .set('Authorization', `Bearer ${TEST_TOKEN}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    it('should not allow other users to access the project (404 Isolation)', async () => {
      const res = await request(app)
        .get(`/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${OTHER_TOKEN}`);
      expect(res.status).toBe(404);
    });

    it('should update project details (PUT /projects/:id)', async () => {
      const res = await request(app)
        .put(`/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'AI Code Planner Platform v2',
          status: 'completed',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('AI Code Planner Platform v2');
      expect(res.body.data.status).toBe('completed');
    });
  });

  // TEST 6, 7, 8: Task Management
  describe('4. Task Management Endpoints', () => {
    let projectId: string;
    let taskId: string;

    beforeAll(async () => {
      const projRes = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'Task Testing Project' });
      projectId = projRes.body.data.id;
    });

    // TEST 6: Task creation
    it('should create a task in the project (POST /projects/:id/tasks) -> 201', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          title: 'Implement Database Connection Pool',
          description: 'Use pg.Pool with max connections and timeout handling',
          priority: 'high',
          status: 'pending',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Implement Database Connection Pool');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.status).toBe('pending');
      taskId = res.body.data.id;
    });

    it('should reject task creation with missing title -> 400', async () => {
      const res = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ description: 'No title' });
      expect(res.status).toBe(400);
    });

    it('should list all tasks for a project', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].id).toBe(taskId);
    });

    // TEST 7: Task update
    it('should update task status and priority (PUT /tasks/:id) -> 200', async () => {
      const res = await request(app)
        .put(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          status: 'completed',
          priority: 'critical',
          title: 'Implement Database Connection Pool (Done)',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.priority).toBe('critical');
      expect(res.body.data.title).toBe('Implement Database Connection Pool (Done)');
    });

    // TEST 8: Task deletion
    it('should delete a task (DELETE /tasks/:id) -> 204', async () => {
      const res = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);
      expect(res.status).toBe(204);

      // Verification: Should no longer exist
      const verifyRes = await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);
      expect(verifyRes.status).toBe(404);
    });
  });

  // TEST 9: AI Planner Validation
  describe('5. AI Planner & LLM Schema Validation', () => {
    it('should validate and reject empty AI planning task prompt -> 400', async () => {
      const res = await request(app)
        .post('/ai/plan')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ task: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation failed|Task description must be at least 3 characters/i);
    });

    it('should generate a structured development plan adhering to Zod schema -> 201', async () => {
      const res = await request(app)
        .post('/ai/plan')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          task: 'Build JWT authentication for Express REST API',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'AI Implementation Plan generated successfully');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('structured_plan');

      const plan = res.body.structured_plan;
      expect(typeof plan.goal).toBe('string');
      expect(Array.isArray(plan.prerequisites)).toBe(true);
      expect(Array.isArray(plan.steps)).toBe(true);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(Array.isArray(plan.files_or_areas_to_modify)).toBe(true);
      expect(Array.isArray(plan.testing_checklist)).toBe(true);
      expect(Array.isArray(plan.risks)).toBe(true);

      // Verify token tracking / logging metadata
      expect(res.body.data).toHaveProperty('model_name');
      expect(res.body.data).toHaveProperty('total_tokens');
    });
  });

  // TEST 10, 11: Background PDF Report Generation
  describe('6. Background Jobs & PDF Reporting', () => {
    let reportProjectId: string;
    let reportJobId: string;

    beforeAll(async () => {
      const proj = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          name: 'DevTask Reporting Target',
          description: 'Project to test PDF generation and background job state machine',
        });
      reportProjectId = proj.body.data.id;

      // Add a task
      await request(app)
        .post(`/projects/${reportProjectId}/tasks`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({
          title: 'Implement PDFKit Report Engine',
          status: 'completed',
        });
    });

    // TEST 10: Report job creation -> 202
    it('should enqueue report job and return 202 Accepted immediately', async () => {
      const res = await request(app)
        .post(`/projects/${reportProjectId}/reports`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('queued');
      reportJobId = res.body.data.id;
    });

    // TEST 11: Report status
    it('should poll report status and transition to completed with PDF file', async () => {
      // Drain background queue to finish PDF generation
      await reportJobQueue.drain();

      const res = await request(app)
        .get(`/reports/${reportJobId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(reportJobId);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.file_name).toMatch(/\.pdf$/);
      expect(res.body.data.file_path).toBeTruthy();
    });

    it('should allow downloading the generated PDF file', async () => {
      const res = await request(app)
        .get(`/reports/${reportJobId}/download`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  // TEST 12: Database Persistence
  describe('7. Database Persistence & Integrity', () => {
    it('should ensure records persist and maintain relational integrity', async () => {
      // Create project
      const proj = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ name: 'Persistence Verification Project' });
      const pId = proj.body.data.id;

      // Create task
      const task = await request(app)
        .post(`/projects/${pId}/tasks`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`)
        .send({ title: 'Persistent Task 1', status: 'completed' });
      const tId = task.body.data.id;

      // Query raw database directly to confirm row persistence
      const rawProject = await db.query('SELECT * FROM projects WHERE id = $1', [pId]);
      expect(rawProject.rows.length).toBe(1);
      expect(rawProject.rows[0].name).toBe('Persistence Verification Project');

      const rawTask = await db.query('SELECT * FROM tasks WHERE id = $1', [tId]);
      expect(rawTask.rows.length).toBe(1);
      expect(rawTask.rows[0].title).toBe('Persistent Task 1');

      // Verify cascade deletion
      await request(app)
        .delete(`/projects/${pId}`)
        .set('Authorization', `Bearer ${TEST_TOKEN}`);

      const checkTaskAfterCascade = await db.query('SELECT * FROM tasks WHERE id = $1', [tId]);
      expect(checkTaskAfterCascade.rows.length).toBe(0);
    });
  });

  // Swagger Docs Endpoint
  describe('8. OpenAPI Documentation (GET /docs/openapi.json)', () => {
    it('should serve the valid OpenAPI specification', async () => {
      const res = await request(app).get('/docs/openapi.json');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('openapi', '3.0.3');
      expect(res.body.info.title).toMatch(/DevTask AI/i);
      expect(res.body.paths).toHaveProperty('/projects');
      expect(res.body.paths).toHaveProperty('/ai/plan');
      expect(res.body.paths).toHaveProperty('/reports/{id}');
    });
  });
});
