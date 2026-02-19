import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../App.css';

const BookingPage = () => {
    const { token } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booked, setBooked] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Validate Token / Get Candidate
                const candRes = await axios.get(`http://localhost:5000/api/candidates/${token}`);
                setCandidate(candRes.data);

                // 2. Get Slots
                const slotRes = await axios.get('http://localhost:5000/api/slots/available');
                setSlots(slotRes.data);
            } catch (err) {
                console.error(err);
                alert("Invalid or expired link");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleBook = async (slotId) => {
        try {
            await axios.post('http://localhost:5000/api/slots/book', { slotId, token });
            setBooked(true);
        } catch (err) {
            alert("Failed to book slot. It might be taken.");
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!candidate) return <div className="error">Invalid Link</div>;

    if (booked || candidate.status !== 'INVITED') {
        return (
            <div className="container center-content">
                <div className="card">
                    <h2>Interview Scheduled</h2>
                    <p>Your interview is confirmed.</p>
                    <p>Check your email for the meeting link.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header className="header">
                <h1>Schedule Interview</h1>
                <p>Welcome, {candidate.name}</p>
            </header>

            <div className="card">
                <h3>Available Time Slots</h3>
                <div className="slots-grid">
                    {slots.length === 0 ? <p>No slots available right now.</p> : slots.map(slot => (
                        <div key={slot._id} className="slot-card">
                            <p>{new Date(slot.startTime).toLocaleString()}</p>
                            <button onClick={() => handleBook(slot._id)} className="btn-secondary">
                                Book This Slot
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
