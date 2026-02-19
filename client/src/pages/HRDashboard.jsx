import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const HRDashboard = () => {
    const [slots, setSlots] = useState([]);
    const [createTime, setCreateTime] = useState('');

    const createSlot = async () => {
        if (!createTime) return;
        const start = new Date(createTime);
        const end = new Date(start.getTime() + 30 * 60000); // 30 mins
        
        await axios.post('http://localhost:5000/api/slots', {
            startTime: start,
            endTime: end
        });
        alert("Slot Created");
        // refresh list
        loadSlots();
    };

    const loadSlots = async () => {
        const res = await axios.get('http://localhost:5000/api/slots/available');
        setSlots(res.data);
    };

    useEffect(() => { loadSlots(); }, []);

    return (
        <div className="container">
            <h1>HR Dashboard</h1>
            
            <div className="card">
                <h2>Create Available Slot</h2>
                <input 
                    type="datetime-local" 
                    value={createTime}
                    onChange={e => setCreateTime(e.target.value)}
                />
                <button onClick={createSlot} className="btn-primary">Add Slot</button>
            </div>

            <div className="card">
                <h2>Current Available Slots</h2>
                <ul>
                    {slots.map(s => <li key={s._id}>{new Date(s.startTime).toLocaleString()}</li>)}
                </ul>
            </div>
        </div>
    );
};

export default HRDashboard;
