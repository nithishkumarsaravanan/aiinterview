const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const Candidate = require('../models/Candidate');
const { sendConfirmationEmail } = require('../utils/emailService');

// Create Slots (Admin)
router.post('/', async (req, res) => {
    try {
        const { startTime, endTime } = req.body;
        const slot = new Slot({ startTime, endTime });
        await slot.save();
        res.json(slot);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create slot' });
    }
});

// Get Available Slots
router.get('/available', async (req, res) => {
    try {
        // Only future unbooked slots
        const slots = await Slot.find({ 
            isBooked: false, 
            startTime: { $gt: new Date() } 
        }).sort({ startTime: 1 });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

// Book Slot
router.post('/book', async (req, res) => {
    try {
        const { slotId, token } = req.body;

        const candidate = await Candidate.findOne({ interviewToken: token });
        if (!candidate) return res.status(404).json({ error: 'Invalid token' });

        const slot = await Slot.findById(slotId);
        if (!slot || slot.isBooked) return res.status(400).json({ error: 'Slot not available' });

        // Update Slot
        slot.isBooked = true;
        slot.candidate = candidate._id;
        await slot.save();

        // Update Candidate
        candidate.status = 'SCHEDULED';
        candidate.scheduledSlot = slot._id;
        await candidate.save();

        // Send Email
        const interviewLink = `http://localhost:5173/interview/${token}`;
        await sendConfirmationEmail(candidate, slot, interviewLink);

        res.json({ message: 'Slot booked successfully', interviewLink });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Booking failed' });
    }
});

module.exports = router;
