import 'dotenv/config';
import connectDB from "./db/index.js";
import app from "./app.js";
import http from 'http';

// Import models once to ensure Mongoose registers them
import './models/user.model.js';
import './models/product.model.js';
import './models/order.model.js';

connectDB()
.then(() => {
    const server = http.createServer(app);

    server.listen(process.env.PORT || 8000, () => {
        console.log(`🚀 Saanvi Fashion API Server running on port ${process.env.PORT || 8000}`);
    });

    server.on("error", (err) => console.error("Server error:", err));
})
.catch((error) => console.error("Error starting server:", error));