// Database setup script for 0gSecura
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function setupDatabase() {
  console.log('🗄️  Setting up 0gSecura database...')
  console.log('==================================')

  // Load environment variables
  require('dotenv').config({ path: '.env.local' })

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local')
    console.log('Add: DATABASE_URL=postgresql://ogsecura:password@localhost:5432/ogsecura')
    process.exit(1)
  }

  console.log('📡 Connecting to database...')
  const client = new Client({
    connectionString: databaseUrl,
  })

  try {
    await client.connect()
    console.log('✅ Connected to PostgreSQL')

    // Read and execute SQL setup script
    const sqlPath = path.join(__dirname, 'setup-database.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📋 Creating tables and indexes...')
    await client.query(sqlContent)
    
    console.log('✅ Database schema created successfully')

    // Test the setup
    console.log('🧪 Testing database setup...')
    
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('📊 Tables created:')
    tableCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`)
    })

    // Check sample data
    const blacklistCount = await client.query('SELECT COUNT(*) FROM blacklist_entries')
    const alertsCount = await client.query('SELECT COUNT(*) FROM security_alerts')
    
    console.log(`📈 Sample data: ${blacklistCount.rows[0].count} blacklist entries, ${alertsCount.rows[0].count} alerts`)

    console.log('\n🎉 Database setup completed successfully!')
    console.log('==================================')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Ensure PostgreSQL is running')
    console.log('2. Check DATABASE_URL in .env.local')
    console.log('3. Verify database user has correct permissions')
    process.exit(1)
  } finally {
    await client.end()
  }
}

setupDatabase()
