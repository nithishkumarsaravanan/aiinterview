const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
const interviewRoutes = require('./interviewRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const slotRoutes = require('./routes/slotRoutes');

app.use('/api', interviewRoutes);
app.use('/api/candidates', candidateRoutes); // New
app.use('/api/slots', slotRoutes);           // New

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
