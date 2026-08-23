import { db, pool } from './index';

export const seedDatabase = async (): Promise<void> => {
  console.log('Seeding demo database data...');

  try {
    await db.initSchema();

    const demoUserId = '00000000-0000-0000-0000-000000000001';
    const demoEmail = 'demo@devtask.ai';

    // 1. Insert Demo User Metadata
    await db.query(
      `INSERT INTO users_metadata (id, supabase_user_id, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (supabase_user_id) DO NOTHING;`,
      [demoUserId, demoUserId, demoEmail]
    );

    // 2. Insert Demo Projects
    const project1Res = await db.query(
      `INSERT INTO projects (user_id, name, description, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id;`,
      [
        demoUserId,
        'DevTask Backend API',
        'Core REST API engine with authentication, task management, and AI planning services.',
      ]
    );
    const project1Id = project1Res.rows[0].id;

    const project2Res = await db.query(
      `INSERT INTO projects (user_id, name, description, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id;`,
      [
        demoUserId,
        'DevTask Cloud Infrastructure',
        'Docker containerization, PostgreSQL pooling, and automated background job runner.',
      ]
    );
    const project2Id = project2Res.rows[0].id;

    // 3. Insert Demo Tasks for Project 1
    await db.query(
      `INSERT INTO tasks (project_id, title, description, status, priority)
       VALUES 
       ($1, 'Implement Supabase Auth Middleware', 'Validate JWT tokens from Supabase on protected API routes', 'completed', 'high'),
       ($1, 'Build AI Task Planner Service', 'Integrate Google Gemini to generate structured execution checklists', 'completed', 'critical'),
       ($1, 'Add PDF Report Generation', 'Generate summary PDFs with project statistics and AI plans using PDFKit', 'in_progress', 'high'),
       ($1, 'Write Unit & Integration Tests', 'Ensure 100% test pass rate for all CRUD and AI endpoints', 'pending', 'medium');`,
      [project1Id]
    );

    // 4. Insert Demo Tasks for Project 2
    await db.query(
      `INSERT INTO tasks (project_id, title, description, status, priority)
       VALUES 
       ($1, 'Configure Docker Compose Multi-Container Stack', 'Set up PostgreSQL 16 and Node.js app containers with healthcheck', 'completed', 'high'),
       ($1, 'Setup Automated In-Process Job Queue', 'Implement background queue with queued/processing/completed states', 'pending', 'critical');`,
      [project2Id]
    );

    console.log('Database seeded successfully with demo projects and tasks!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
