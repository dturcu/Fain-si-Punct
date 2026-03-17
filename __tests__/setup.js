import mongoose from 'mongoose'

/**
 * Connect to test MongoDB database
 */
export async function connectTestDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-test'

  if (mongoose.connection.readyState === 1) {
    // Already connected
    return mongoose.connection
  }

  try {
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
    })
    console.log('Connected to test database')
    return mongoose.connection
  } catch (error) {
    console.error('Test database connection error:', error)
    throw error
  }
}

/**
 * Disconnect from test MongoDB database
 */
export async function disconnectTestDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect()
    console.log('Disconnected from test database')
  }
}

/**
 * Clean all collections in the database
 */
export async function cleanDatabase() {
  if (mongoose.connection.readyState !== 1) {
    return
  }

  const collections = mongoose.connection.collections

  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
  console.log('Database cleaned')
}

/**
 * Create test data in database
 * @param {string} modelName - Mongoose model name
 * @param {object|array} data - Data to insert
 */
export async function createTestData(modelName, data) {
  const model = mongoose.model(modelName)

  if (Array.isArray(data)) {
    return await model.insertMany(data)
  } else {
    return await model.create(data)
  }
}

/**
 * Find test data in database
 * @param {string} modelName - Mongoose model name
 * @param {object} query - Query object
 */
export async function findTestData(modelName, query) {
  const model = mongoose.model(modelName)
  return await model.find(query)
}

/**
 * Delete test data from database
 * @param {string} modelName - Mongoose model name
 * @param {object} query - Query object
 */
export async function deleteTestData(modelName, query) {
  const model = mongoose.model(modelName)
  return await model.deleteMany(query)
}

/**
 * Global test setup
 */
export async function setupGlobalTests() {
  await connectTestDB()
  await cleanDatabase()
}

/**
 * Global test teardown
 */
export async function teardownGlobalTests() {
  await cleanDatabase()
  await disconnectTestDB()
}
