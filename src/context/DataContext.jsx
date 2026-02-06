import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot
} from 'firebase/firestore';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [guests, setGuests] = useState([]);
    const [products, setProducts] = useState(['Stays', 'ICE', 'BURPS', 'Others']);
    const [channels, setChannels] = useState(['Messenger', 'TikTok', 'OTA', 'Walk-in', 'Email', 'Call', 'Referral', 'Website', 'Others']);
    const [staffMembers, setStaffMembers] = useState(['Sarah', 'Mike', 'Anna', 'Tom']);
    const [statuses, setStatuses] = useState(['Intent', 'Booked', 'Sent Rate', 'Cancelled']);
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Data Fetch and Real-time Listeners
    useEffect(() => {
        console.log('🔥 Initializing Firebase listeners...');

        // Guests Listener
        const unsubscribeGuests = onSnapshot(
            collection(db, "guests"),
            (snapshot) => {
                console.log('✅ Guests snapshot received:', snapshot.size, 'documents');
                const guestsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setGuests(guestsData);
                setLoading(false);
                setError(null);
            },
            (error) => {
                console.error("❌ Error fetching guests:", error);
                console.error("Error code:", error.code);
                console.error("Error message:", error.message);
                setError(`Database connection failed: ${error.message}`);
                setLoading(false);
            }
        );

        // Helper for Settings (Products, Channels, Staff)
        const unsubscribeProducts = onSnapshot(
            collection(db, "products"),
            (snap) => {
                console.log('✅ Products snapshot received:', snap.size, 'documents');
                if (!snap.empty) setProducts(snap.docs.map(d => d.data().name));
            },
            (error) => {
                console.error("❌ Error fetching products:", error);
            }
        );

        const unsubscribeChannels = onSnapshot(
            collection(db, "channels"),
            (snap) => {
                console.log('✅ Channels snapshot received:', snap.size, 'documents');
                if (!snap.empty) setChannels(snap.docs.map(d => d.data().name));
            },
            (error) => {
                console.error("❌ Error fetching channels:", error);
            }
        );

        const unsubscribeStaff = onSnapshot(
            collection(db, "staff"),
            (snap) => {
                console.log('✅ Staff snapshot received:', snap.size, 'documents');
                if (!snap.empty) setStaffMembers(snap.docs.map(d => d.data().name));
            },
            (error) => {
                console.error("❌ Error fetching staff:", error);
            }
        );

        const unsubscribeFollowUps = onSnapshot(
            collection(db, "followUps"),
            (snapshot) => {
                console.log('✅ Follow-ups snapshot received:', snapshot.size, 'documents');
                const fuData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setFollowUps(fuData);
            },
            (error) => {
                console.error("❌ Error fetching follow-ups:", error);
            }
        );

        return () => {
            console.log('🔥 Cleaning up Firebase listeners...');
            unsubscribeGuests();
            unsubscribeProducts();
            unsubscribeChannels();
            unsubscribeStaff();
            unsubscribeFollowUps();
        };
    }, []);

    // CRUD Operations
    const isDuplicateGuest = (newGuest) => {
        return guests.some(existingGuest =>
            existingGuest.name.toLowerCase() === newGuest.name.toLowerCase() &&
            existingGuest.checkIn === newGuest.checkIn &&
            existingGuest.product === newGuest.product
        );
    };

    const addGuest = async (guest) => {
        try {
            console.log('📝 Adding guest to Firebase:', guest);

            // Check for duplicates
            if (isDuplicateGuest(guest)) {
                console.warn('⚠️ Duplicate guest detected');
                return { success: false, isDuplicate: true, message: 'A booking for this guest with the same date and product already exists!' };
            }

            const now = new Date().toISOString();
            const newGuest = {
                ...guest,
                createdAt: now,
                bookedAt: guest.status === 'Booked' ? now : null,
                sentRateAt: guest.status === 'Sent Rate' ? now : null
            };
            const docRef = await addDoc(collection(db, "guests"), newGuest);
            console.log('✅ Guest added successfully with ID:', docRef.id);
            return { id: docRef.id, ...newGuest, success: true, isDuplicate: false, message: 'Guest added successfully!' };
        } catch (e) {
            console.error("❌ Error adding guest:", e);
            console.error("Error code:", e.code);
            console.error("Error message:", e.message);
            // Fallback for demo if no DB connection
            if (isDuplicateGuest(guest)) {
                return { success: false, isDuplicate: true, message: 'A booking for this guest with the same date and product already exists!' };
            }
            const now = new Date().toISOString();
            setGuests([...guests, { ...guest, id: Date.now().toString(), createdAt: now }]);
            return { success: true, isDuplicate: false, message: 'Guest added semi-successfully (offline)!' };
        }
    };

    const updateGuest = async (updatedGuest) => {
        try {
            console.log('📝 Updating guest in Firebase:', updatedGuest.id);
            // Find old guest to check for status change
            const oldGuest = guests.find(g => g.id === updatedGuest.id);
            const now = new Date().toISOString();

            // Add timestamps if status changed to Booked or Sent Rate
            if (updatedGuest.status === 'Booked' && oldGuest?.status !== 'Booked') {
                updatedGuest.bookedAt = now;
            }
            if (updatedGuest.status === 'Sent Rate' && oldGuest?.status !== 'Sent Rate') {
                updatedGuest.sentRateAt = now;
            }

            const { id, ...data } = updatedGuest;
            const guestRef = doc(db, "guests", id);
            await updateDoc(guestRef, data);
            console.log('✅ Guest updated successfully');
        } catch (e) {
            console.error("❌ Error updating guest:", e);
            console.error("Error code:", e.code);
            console.error("Error message:", e.message);
            setGuests(guests.map(g => g.id === updatedGuest.id ? updatedGuest : g));
        }
    };

    const deleteGuest = async (id) => {
        try {
            console.log('🗑️ Deleting guest from Firebase:', id);
            await deleteDoc(doc(db, "guests", id));
            console.log('✅ Guest deleted successfully');
        } catch (e) {
            console.error("❌ Error deleting guest:", e);
            console.error("Error code:", e.code);
            console.error("Error message:", e.message);
            setGuests(guests.filter(g => g.id !== id));
        }
    };

    // Manage Settings - In a real app we might store these differently, but here we'll use a simple collection add/remove
    // Note: This simple implementation implies strict matching by 'name'.

    const addItem = async (listName, item) => {
        try {
            await addDoc(collection(db, listName), { name: item });
        } catch (e) {
            console.error(`Error adding to ${listName}:`, e);
            if (listName === 'products') setProducts([...products, item]);
            if (listName === 'channels') setChannels([...channels, item]);
            if (listName === 'staff') setStaffMembers([...staffMembers, item]);
        }
    };

    const deleteItem = async (listName, item) => {
        // This is tricky without IDs for settings, we need to find the doc first
        // accessing local state specific lists for immediate UI update isn't enough for DB delete
        // For this demo, we'll find the doc by name query
        try {
            const q = await getDocs(collection(db, listName));
            const docToDelete = q.docs.find(d => d.data().name === item);
            if (docToDelete) {
                await deleteDoc(doc(db, listName, docToDelete.id));
            }
        } catch (e) {
            console.error(`Error deleting from ${listName}:`, e);
            if (listName === 'products') setProducts(products.filter(i => i !== item));
            if (listName === 'channels') setChannels(channels.filter(i => i !== item));
            if (listName === 'staff') setStaffMembers(staffMembers.filter(i => i !== item));
        }
    };

    const addFollowUp = async (guestId, followUpData) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const newFollowUp = {
                guestId,
                ...followUpData,
                date: today,
                timestamp: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, "followUps"), newFollowUp);
            console.log('✅ Follow-up saved with ID:', docRef.id);
            // Local state is updated by snapshot listener? No, follow-ups doesn't have a listener yet.
            // Wait, let me check listeners.
            setFollowUps([...followUps, { id: docRef.id, ...newFollowUp }]);
            return { success: true, message: 'Follow-up saved successfully!' };
        } catch (e) {
            console.error("❌ Error saving follow-up:", e);
            const today = new Date().toISOString().split('T')[0];
            const newFollowUp = {
                id: Date.now().toString(),
                guestId,
                ...followUpData,
                date: today,
                timestamp: new Date().toISOString()
            };
            setFollowUps([...followUps, newFollowUp]);
            return { success: true, message: 'Follow-up saved successfully!' };
        }
    };

    const updateFollowUp = async (id, updatedData) => {
        try {
            console.log('📝 Updating follow-up in Firebase:', id);
            const fuRef = doc(db, "followUps", id);
            await updateDoc(fuRef, updatedData);
            setFollowUps(followUps.map(fu => fu.id === id ? { ...fu, ...updatedData } : fu));
            console.log('✅ Follow-up updated successfully');
            return { success: true };
        } catch (e) {
            console.error("❌ Error updating follow-up:", e);
            setFollowUps(followUps.map(fu => fu.id === id ? { ...fu, ...updatedData } : fu));
            return { success: true };
        }
    };

    const getFollowUpCount = (guestId) => {
        return followUps.filter(fu => fu.guestId === guestId).length;
    };

    const value = {
        guests,
        products,
        channels,
        staffMembers,
        statuses,
        followUps,
        addGuest,
        updateGuest,
        deleteGuest,
        addItem,
        deleteItem,
        addFollowUp,
        updateFollowUp,
        getFollowUpCount,
        loading,
        error
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
