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
            .then((mongooseInstance) => {
                console.log('MongoDB connected successfully');
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