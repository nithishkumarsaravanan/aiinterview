import React, { useState } from 'react';
import axios from 'axios';
import '../App.css'; // Reuse existing styles for now

const LandingPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [resume, setResume] = useState(null);
    const [status, setStatus] = useState('IDLE'); // IDLE, UPLOADING, SUCCESS, ERROR

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!resume) return alert("Please upload a resume");

        setStatus('UPLOADING');
        const data = new FormData();
        data.append('name', formData.name);
        data.append('email', formData.email);
        data.append('resume', resume);

        try {
            await axios.post('http://localhost:5000/api/candidates/apply', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setStatus('SUCCESS');
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
        }
    };

    if (status === 'SUCCESS') {
        return (
            <div className="container center-content">
                <div className="card">
                    <h2>Application Received!</h2>
                    <p>Thank you, {formData.name}.</p>
                    <p>We have sent a <strong>Slot Booking Link</strong> to <em>{formData.email}</em>.</p>
                    <p>Please check your email to schedule your AI Interview.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <header className="header">
                <h1>AI Interviewer</h1>
                <p>Apply for the position and get interviewed instantly by our AI.</p>
            </header>

            <div className="card">
                <h2>Candidate Application</h2>
                <form onSubmit={handleSubmit} className="apply-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            required 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="form-group">
                        <label>Resume (PDF)</label>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            required 
                            onChange={e => setResume(e.target.files[0])}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={status === 'UPLOADING'}>
                        {status === 'UPLOADING' ? 'Submitting...' : 'Submit Application'}
                    </button>

                    {status === 'ERROR' && <p className="error-text">Failed to submit. Please try again.</p>}
                </form>
            </div>
        </div>
    );
};

export default LandingPage;
