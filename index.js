const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('assignment');
        const collection = db.collection('users');
        const suppliesCollection = db.collection('supplies');
        const donationCollection = db.collection('donations');

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await collection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await collection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });


        // ==============================================================
        // WRITE YOUR CODE HERE
        //Create supplies
        app.post("/api/v1/create-supply", async (req, res) => {
            const newSupply = req.body;
            const result = await suppliesCollection.insertOne(newSupply);
            res.status(201).json({
                success: true,
                message: 'New Supply Added successfully!',
                data: result
            });
        });

        //get all supplies
        app.get("/api/v1/supplies", async (req, res) => {
            const result = await suppliesCollection.find().toArray();;
            res.status(201).json({
                success: true,
                message: 'Supplies are retrieved successfully!',
                data: result
            });
        });

        //get filter(only 6) supplies
        app.get("/api/v1/filter-supplies", async (req, res) => {
            const result = await suppliesCollection.find().limit(6).toArray();
            res.status(201).json({
                success: true,
                message: 'Supplies are retrieved successfully!',
                data: result
            });
          });

          //get a supply
          app.get("/api/v1/supply/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await suppliesCollection.findOne(query);
            res.status(201).json({
                success: true,
                message: 'Supplies is retrieved successfully!',
                data: result
            });
           });

           //update a supply
          app.put("/api/v1/supply/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const update = { $set: req.body };
            const result = await suppliesCollection.findOneAndUpdate(query, update, { returnOriginal: false });
            res.status(201).json({
                success: true,
                message: 'Supplies is updated successfully!',
                data: result
            });
           });

           //delete a supply
          app.delete("/api/v1/supply/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await suppliesCollection.deleteOne(query);
            res.status(201).json({
                success: true,
                message: 'Supplies is deleted successfully!',
                data: result
            });
           });

           //add a donation
           app.post("/api/v1/add-donation", async (req, res) => {
            const newDonation = req.body;
            const result = await donationCollection.insertOne(newDonation);
            res.status(201).json({
                success: true,
                message: 'Donation Added successfully!',
                data: result
            });
            });

            //get donation for a user by email
            app.get("/api/v1/donation/:email", async (req, res) => {
                const email = req.params.email 
                const query = { email: email };
                const result = await donationCollection.find(query).toArray();
                res.status(201).json({
                    success: true,
                    message: 'Donation is retrieved successfully!',
                    data: result
                });
            });
        // ==============================================================


        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});