import React from 'react';
import { Alert } from 'react-bootstrap';
import { useData } from '../context/DataContext';

const DatabaseStatus = () => {
    const { error } = useData();

    if (!error) return null;

    return (
        <Alert variant="danger" className="mb-3">
            <Alert.Heading>Database Connection Error</Alert.Heading>
            <p className="mb-2">{error}</p>
            <hr />
            <p className="mb-0 small">
                <strong>Possible solutions:</strong>
                <ul className="mt-2 mb-0">
                    <li>Check your Firestore security rules in the Firebase Console</li>
                    <li>Verify your internet connection</li>
                    <li>Check the browser console (F12) for detailed error messages</li>
                    <li>See <code>FIREBASE_SETUP.md</code> for detailed setup instructions</li>
                </ul>
            </p>
        </Alert>
    );
};

export default DatabaseStatus;
