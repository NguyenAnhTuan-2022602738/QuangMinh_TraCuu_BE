const mongoose = require('mongoose');

// Cache the database connection across function invocations (helpful for serverless)
let cached = global.__mongooseConnection;

if (!cached) {
    cached = global.__mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error('Missing MONGO_URI environment variable');
        }

        cached.promise = mongoose
            .connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .then(async (mongooseInstance) => {
                console.log('MongoDB connected successfully');

                // Attempt to drop legacy non-sparse email index to prevent false duplicate errors
                try {
                    const Customer = require('../models/Customer');
                    const indexes = await Customer.collection.indexes();
                    const legacyEmailIndex = indexes.find((idx) => idx.key && idx.key.email === 1 && !idx.sparse);
                    if (legacyEmailIndex) {
                        await Customer.collection.dropIndex(legacyEmailIndex.name);
                        console.log('Dropped legacy unique index on Customer.email to allow blank values.');
                    }
                } catch (indexErr) {
                    if (indexErr.codeName !== 'IndexNotFound') {
                        console.warn('Warning while checking Customer email index:', indexErr.message);
                    }
                }

                return mongooseInstance;
            })
            .catch((error) => {
                cached.promise = null;
                throw error;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
};

module.exports = connectDB;