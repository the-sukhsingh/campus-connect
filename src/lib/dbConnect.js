import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

if(!MONGODB_URI){
    throw new Error("Please define MongoDB URI in env file.")
}

let cached = global.mongoose;

if(!cached){
    cached = global.mongoose = {conn: null, promise: null}
}

export default async function dbConnect(){
    if(cached.conn){
        return cached.conn;
    }

    if(!cached.promise){
        const opts = {
            bufferCommands: false, // Disable mongoose buffering
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            family: 4, // Use IPv4, skip trying IPv6
            maxPoolSize: 10, // Maintain up to 10 socket connections
        }
        
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
           return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        console.error("MongoDB connection error:", error);
        throw new Error(`Error while connecting to database: ${error.message}`);
    }

    return cached.conn;
}