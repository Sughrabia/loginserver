const express= require ('express');
const app= express();
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'] 
}));


dotenv.config();

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json()); 


const uri = process.env.MONGO_URI;
console.log('MongoDB URI:', uri); // Check if URI is loaded

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // Adjust as needed
})
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        if (err.stack) console.error(err.stack);
    });

app.get('/', (req, res) => {
    res.send('Group 1 - Members: Alice, Bob, Charlie - Project: Multi-Server Architecture');
});


const loginRouter= require ('./routers/login')

app.use('/login', loginRouter) 

app.listen(5000, () => {
    console.log('Server is running on port 5000');
  });