import React from 'react';
import { ClipboardList } from 'lucide-react';

const TodayJobs = () => {
    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">
                    <ClipboardList size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    Today's Jobs
                </h1>
            </div>
            <div className="page-content-area">
                {/* Today's jobs content will go here */}
                <p style={{ color: 'var(--text-secondary)' }}>No jobs assigned for today.</p>
            </div>
        </div>
    );
};

export default TodayJobs;
