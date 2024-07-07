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

//JWT Token verify
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    //bearer token
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
      req.decoded = decoded;
      next();
    });
  };

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('assignment');
        const collection = db.collection('users');
        const suppliesCollection = db.collection('supplies');
        const donationCollection = db.collection('donations');
        const communityGCommentCollection = db.collection('communities');
        const testimonialCollection = db.collection('testimonials');
        const volunteersCollection = db.collection('volunteers');



        //////////////////////////////
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
              expiresIn: "1h",
            });
            res.send({ token });
          });
      
          //verify Admin
          const verifyAdmin = async (req, res, next) => {
            email = req.decoded.email;
            const query = { email: email };
            const user = await collection.findOne(query);
            if (user?.role !== "admin") {
              return res
                .status(403)
                .send({ error: true, message: "forbidden message" });
            }
            next();
          };

          //make admin
           app.patch("/users/admin/:id", async (req, res) => {
           const id = req.params.id;
           const filter = { _id: new ObjectId(id) };
           const updateDoc = {
             $set: {
               role: "admin",
             },
           };
           const result = await collection.updateOne(filter, updateDoc);
           res.send(result);
         });
            
          //check user admin or not?
        app.get("/users/admin/:email", verifyJWT, async (req, res) => {
        const email = req.params.email;
        if (req.decoded.email !== email) {
          res.send({ admin: false });
        }
        const query = { email: email };
        const user = await collection.findOne(query);
        const result = { admin: user?.role === "admin" };
        res.send(result);
       });

          /////////////////////////////////////////////

        //assignment-7

        

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
        //ASSIGNMENT-6
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
            const result = await suppliesCollection.find().toArray();
            res.status(201).json({
                success: true,
                message: 'Supplies are retrieved successfully!',
                data: result
            });
        });

        //get filter(only 6) supplies
        app.get("/api/v1/filter-supplies", async (req, res) => {
            const result = await suppliesCollection.find().limit(8).toArray();
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

            //ASSIGNMENT-7
            //get all donations for leader board
            app.get("/api/v1/donations", async (req, res) => {
                const donations = await donationCollection.find().toArray();
                const emailQuantitiesMap = {};
                // Aggregate total quantity for each email
                donations.forEach(donation => {
                    const { name, email, category, quantity } = donation;
                    if (emailQuantitiesMap[email]) {
                        emailQuantitiesMap[email].totalQuantity += quantity;
                    } else {
                        emailQuantitiesMap[email] = {
                            name,
                            email,
                            category,
                            totalQuantity: quantity
                        };
                    }
                });
                // Convert map to array of objects
                const result = Object.values(emailQuantitiesMap);
                result.sort((a, b) => b.totalQuantity - a.totalQuantity);
                res.status(200).json({
                    success: true,
                    message: 'Donations are retrieved successfully!',
                    data: result
                });
            });

            //get total amount of donations
            app.get("/api/v1/donation-amount", async (req, res) => {
                const donations = await donationCollection.find().toArray();
                
                // Calculate total amount
                let totalAmount = 0;
                donations.forEach(donation => {
                    totalAmount += donation.amount;
                });
            
                res.status(200).json({
                    success: true,
                    message: 'Total donation amount are retrieved successfully!',
                    totalAmount: totalAmount
                });
            });

            //Create Comment
            app.post("/api/v1/create-comment", async (req, res) => {
                const newComment = req.body;
                const result = await communityGCommentCollection.insertOne(newComment);
                res.status(201).json({
                    success: true,
                    message: 'New Comments Added successfully!',
                    data: result
                });
            });

            //get all comments
            app.get("/api/v1/comments", async (req, res) => {
                const result = await communityGCommentCollection.find().toArray();
                res.status(201).json({
                    success: true,
                    message: 'Comments are retrieved successfully!',
                    data: result
                });
            });

            //get total number of comments by a user email
            app.get("/api/v1/comments/:email", async (req, res) => {
                const email = req.params.email 
                const query = { email: email };
                const result = await communityGCommentCollection.countDocuments(query);
                console.log(result);
                res.status(201).json({
                    success: true,
                    message: 'Comments are retrieved successfully!',
                    data: result
                });
            });

             //Create testimonial
             app.post("/api/v1/create-testimonial", async (req, res) => {
                const newTestimonial = req.body;
                const result = await testimonialCollection.insertOne(newTestimonial);
                res.status(201).json({
                    success: true,
                    message: 'New Testimonial Added successfully!',
                    data: result
                });
            });

            //get all testimonial
            app.get("/api/v1/testimonials", async (req, res) => {
                const result = await testimonialCollection.find().toArray();
                res.status(201).json({
                    success: true,
                    message: 'Testimonial are Retrieved successfully!',
                    data: result
                });
            });

            //Create Volunteer
            app.post("/api/v1/create-volunteer", async (req, res) => {
                const newVolunteer = req.body;
                const result = await volunteersCollection.insertOne(newVolunteer);
                res.status(201).json({
                    success: true,
                    message: 'New Volunteer Added successfully!',
                    data: result
                });
            });

            //get all volunteers
            app.get("/api/v1/volunteers", async (req, res) => {
                const result = await volunteersCollection.find().toArray();
                res.status(201).json({
                    success: true,
                    message: 'volunteers are retrieved successfully!',
                    data: result
                });
            });

            //get all volunteers
            app.get("/api/v1/volunteers", async (req, res) => {
                const result = await volunteersCollection.find().toArray();
                res.status(201).json({
                    success: true,
                    message: 'volunteers are retrieved successfully!',
                    data: result
                });
            });

            app.get("/api/v1/filter-volunteers", async (req, res) => {
                const result = await volunteersCollection.find().limit(4).toArray();
                res.status(201).json({
                    success: true,
                    message: 'volunteers are retrieved successfully!',
                    data: result
                });
              });
            
            //get all users
            app.get("/api/v1/users",   async (req, res) => {
                const result = await collection.find().toArray();
                res.status(201).json({
                    success: true,
                    message: 'Users are retrieved successfully!',
                    data: result
                });
            });

            //get a user
            app.get("/api/v1/user/:id", async (req, res) => {
              const id = req.params.id;
              const query = { _id: new ObjectId(id) };
              const result = await collection.findOne(query);
              res.status(201).json({
                  success: true,
                  message: 'User is retrieved successfully!',
                  data: result
              });
             });
            
             //update user
             app.put("/api/v1/user/:id", async (req, res) => {
                const id = req.params.id;
                const {
                    image,
                    designation,
                    company,
                    contact,
                    address,
                    city,
                    country,
                    date,
                    bio
                } = req.body;
            
                try {
                    const query = { _id: new ObjectId(id) };
                    const updateDoc = {
                        $set: {
                            image,
                            designation,
                            company,
                            contact,
                            address,
                            city,
                            country,
                            date,
                            bio
                        },
                    };
            
                    const result = await collection.updateOne(query, updateDoc, { returnOriginal: false });
            
                    if (result.matchedCount === 0) {
                        return res.status(404).json({ message: "User not found" });
                    }
            
                    res.status(200).json({ message: "User updated successfully" });
                } catch (error) {
                    console.error("Error updating user:", error);
                    res.status(500).json({ message: "Error updating user" });
                }
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