import mongoose from "mongoose";
function connect() {
    mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
    })
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch(err => {
            console.error("MongoDB connection error:", err.message);
            console.error("Retrying connection...");
            // Retry after 5 seconds
            setTimeout(connect, 5000);
        })
}

export default connect;