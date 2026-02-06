import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Modal, Form, Toast } from 'react-bootstrap';
import { FiBell, FiPhone, FiMail, FiCheckSquare, FiClipboard, FiCalendar } from 'react-icons/fi';
import { useData } from '../context/DataContext';

const Reminders = () => {
    const { guests, staffMembers, addFollowUp, updateFollowUp, getFollowUpCount, followUps, updateGuest, deleteGuest } = useData();
    const [toastData, setToastData] = useState({ show: false, guest: null });
    const [followUpModal, setFollowUpModal] = useState({ show: false, guest: null, editingId: null });
    const [followUpData, setFollowUpData] = useState({ staff: '', method: '', status: '', bookedValue: '' });
    const [saveMessage, setSaveMessage] = useState({ show: false, message: '', type: 'success' });

    // Automatic Cancellation Logic
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];

        const autoCancelExpiredLeads = async () => {
            const expiredLeads = (guests || []).filter(g =>
                g &&
                g.status !== 'Booked' &&
                g.status !== 'Cancelled' &&
                g.checkIn &&
                g.checkIn < today
            );

            for (const guest of expiredLeads) {
                console.log(`🕒 Auto-cancelling expired lead: ${guest.name} (Check-in: ${guest.checkIn})`);
                await updateGuest({
                    ...guest,
                    status: 'Cancelled'
                });
            }
        };

        if (guests && guests.length > 0) {
            autoCancelExpiredLeads();
        }
    }, [guests, updateGuest]);

    const isDateReached = (dateString) => {
        const today = new Date().toISOString().split('T')[0];
        return dateString < today;
    };

    const getFollowUpsByGuest = (guestId) => {
        if (!guestId) return [];
        return (followUps || []).filter(fu => fu.guestId === guestId);
    };

    const handleMarkComplete = (g) => {
        setFollowUpModal({ show: true, guest: g });
    };

    const handleFollowUpClick = () => {
        setToastData({ show: false, guest: null });
        setFollowUpModal({ show: true, guest: toastData.guest, editingId: null });
    };

    const handleEditLastFollowUp = () => {
        const history = getFollowUpsByGuest(toastData.guest.id || toastData.guest.email || '');
        if (history.length > 0) {
            const lastFU = history[history.length - 1];
            setFollowUpData({
                staff: lastFU.staff,
                method: lastFU.method,
                status: lastFU.status,
                bookedValue: toastData.guest.bookedValue || ''
            });
            setFollowUpModal({
                show: true,
                guest: toastData.guest,
                editingId: lastFU.id
            });
            setToastData({ show: false, guest: null });
        }
    };

    const handleSaveFollowUp = async () => {
        if (!followUpData.staff || !followUpData.method || !followUpData.status) {
            setSaveMessage({ show: true, message: 'Please fill in all fields!', type: 'danger' });
            return;
        }

        let result;
        if (followUpModal.editingId) {
            result = await updateFollowUp(followUpModal.editingId, {
                staff: followUpData.staff,
                method: followUpData.method,
                status: followUpData.status
            });
        } else {
            result = await addFollowUp(followUpModal.guest.id || followUpModal.guest.email || '', {
                staff: followUpData.staff,
                method: followUpData.method,
                status: followUpData.status
            });
        }

        if (result && result.success) {
            // Map follow-up status to guest status
            const statusMap = {
                'Done': followUpModal.guest.status, // Keep current status
                'Booked': 'Booked', // Move to booked
                'Cancelled': 'Cancelled', // Move to cancelled (removes from reminders)
                'Sent Rate': 'Sent Rate' // Move to sent rate
            };

            const newGuestStatus = statusMap[followUpData.status] || followUpModal.guest.status;

            // Update guest with new status and potential booked value
            const needsValue = followUpData.status === 'Booked';
            updateGuest({
                ...followUpModal.guest,
                status: newGuestStatus,
                bookedValue: needsValue ? followUpData.bookedValue : followUpModal.guest.bookedValue,
                creditedStaff: followUpData.status === 'Booked' ? followUpData.staff : (followUpModal.guest.creditedStaff || null)
            });

            setSaveMessage({ show: true, message: followUpModal.editingId ? 'Follow-up updated!' : 'Follow-up saved!', type: 'success' });
            setFollowUpModal({ show: false, guest: null, editingId: null });
            setFollowUpData({ staff: '', method: '', status: '', bookedValue: '' });
            setTimeout(() => setSaveMessage({ show: false, message: '', type: 'success' }), 3000);
        }
    };

    // 'Booked' and 'Cancelled' guests are removed from reminders
    const pendingReminders = (guests || []).filter(g => g && g.status !== 'Booked' && g.status !== 'Cancelled');

    return (
        <div>
            <div className="d-flex align-items-center mb-4 gap-3">
                <div className="p-2 rounded bg-warning bg-opacity-10 text-warning">
                    <FiBell size={24} />
                </div>
                <div>
                    <h1 className="fw-bold mb-1">Follow-up Reminders</h1>
                    <p className="text-secondary mb-0">Pending follow-ups and quick actions.</p>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                {pendingReminders.length === 0 && (
                    <Card className="glass-card p-4">
                        <div className="text-secondary">No reminders available.</div>
                    </Card>
                )}

                {pendingReminders.map((g, index) => (
                    <Card
                        key={g.id || g.email || g.name}
                        className={`p-3 glass-card d-flex align-items-center justify-content-between animate-slide-up delay-${Math.min((index + 1) * 100, 500)}`}
                    >
                        <Row className="w-100 align-items-center">
                            <Col md={9}>
                                <h5 className="mb-1 fw-bold">{g.name}</h5>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="text-secondary small">Follow-up • {g.createdAt || 'N/A'}</span>
                                    {getFollowUpsByGuest(g.id || g.email || '').length > 0 && (
                                        <Badge bg="success" className="text-white fw-bold px-3 py-1 border-0" style={{ borderRadius: '20px' }}>
                                            #{getFollowUpsByGuest(g.id || g.email || '').length} DONE
                                        </Badge>
                                    )}
                                    <Badge
                                        bg={g.status === 'Sent Rate' ? 'info' : 'warning'}
                                        className="text-white fw-bold px-3 py-1 border-0"
                                        style={{ borderRadius: '20px', fontSize: '0.7rem' }}
                                    >
                                        {g.status || 'Follow up'}
                                    </Badge>
                                </div>
                                <div className="d-flex gap-2 flex-wrap mt-2">
                                    {g.status === 'Sent Rate' ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <Badge bg="info" className="text-white rounded-pill py-2 px-3 border-0 shadow-sm" style={{ fontWeight: '600' }}>
                                                <span>🏷️</span> ₱{Number(g.bookedValue || 0).toLocaleString()}
                                            </Badge>
                                            <span className="text-secondary small opacity-75">Active Rate</span>
                                        </div>
                                    ) : (
                                        <>
                                            {g.phone && <Badge bg="light" className="text-dark rounded-pill py-2 px-3"><FiPhone className="me-2" />{g.phone}</Badge>}
                                            {g.email && <Badge bg="light" className="text-dark rounded-pill py-2 px-3"><FiMail className="me-2" />{g.email}</Badge>}
                                        </>
                                    )}
                                </div>
                            </Col>
                            <Col md={3} className="d-flex flex-column align-items-end gap-2">
                                <Button
                                    variant="warning"
                                    className="d-flex align-items-center gap-2"
                                    onClick={() => handleMarkComplete(g)}
                                >
                                    <FiCheckSquare />
                                    Follow-up #{getFollowUpCount(g.id || g.email || '') + 1}
                                </Button>
                                <Button variant="secondary" className="d-flex align-items-center gap-2" onClick={() => setToastData({ show: true, guest: g })}>
                                    <FiClipboard />
                                    View History
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                ))}

                <Modal show={toastData.show} onHide={() => setToastData({ show: false, guest: null })} centered size="lg" contentClassName="border-0 shadow-lg">
                    <Modal.Header closeButton className="border-bottom border-light">
                        <Modal.Title>Guest Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {toastData.guest && (
                            <div>
                                {/* Guest Details Section */}
                                <div className="mb-4">
                                    <div className="text-muted text-uppercase small mb-2">Name</div>
                                    <div className="fw-bold mb-3 h5">{toastData.guest.name}</div>

                                    <div className="text-muted text-uppercase small mb-1">Email</div>
                                    <div className="mb-3">{toastData.guest.email || 'N/A'}</div>

                                    <div className="text-muted text-uppercase small mb-1">Phone</div>
                                    <div className="mb-3">{toastData.guest.phone || 'N/A'}</div>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <div className="text-muted text-uppercase small mb-1">Check-in</div>
                                            <div className="mb-2">{toastData.guest.checkIn || 'N/A'}</div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="text-muted text-uppercase small mb-1">Check-out</div>
                                            <div className="mb-2">{toastData.guest.checkOut || 'N/A'}</div>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <div className="text-muted text-uppercase small mb-1">Product</div>
                                            <div className="mb-2">{toastData.guest.product || 'N/A'}</div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="text-muted text-uppercase small mb-1">Channel</div>
                                            <div className="mb-2">{toastData.guest.channel || 'N/A'}</div>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <div className="text-muted text-uppercase small mb-1">Original Staff</div>
                                            <div className="mb-2">{toastData.guest.staff || 'N/A'}</div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="text-muted text-uppercase small mb-1">Status</div>
                                            <Badge
                                                bg={toastData.guest.status === 'Booked' ? 'success' : toastData.guest.status === 'Cancelled' ? 'danger' : 'warning'}
                                                className="fw-bold px-3 py-1 text-white border-0"
                                                style={{ borderRadius: '20px' }}
                                            >
                                                {toastData.guest.status || 'Follow up'}
                                            </Badge>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Follow-up History Section */}
                                <div className="mt-4 pt-4 border-top border-light">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <h5 className="fw-bold mb-0">Follow-up History</h5>
                                    </div>
                                    {getFollowUpsByGuest(toastData.guest.id || toastData.guest.email).length === 0 ? (
                                        <div className="text-secondary mb-3">No follow-ups completed yet</div>
                                    ) : (
                                        <div className="d-flex flex-column gap-2">
                                            {getFollowUpsByGuest(toastData.guest.id || toastData.guest.email || '').map((fu, idx, arr) => (
                                                <div
                                                    key={fu.id || idx}
                                                    className="p-2 rounded mb-1"
                                                    style={{
                                                        backgroundColor: idx === arr.length - 1 ? 'rgba(212, 175, 55, 0.05)' : '#f8f9fa',
                                                        border: idx === arr.length - 1 ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid #e9ecef',
                                                        opacity: idx === arr.length - 1 ? 1 : 0.8
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="small fw-bold d-flex align-items-center gap-2">
                                                                Follow-up #{idx + 1}
                                                                {idx === arr.length - 1 ? (
                                                                    <Badge bg="warning" text="dark" style={{ fontSize: '0.6rem' }}>EDITABLE</Badge>
                                                                ) : (
                                                                    <Badge bg="secondary" style={{ fontSize: '0.6rem', opacity: 0.5 }}>LOCKED</Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-muted small mt-1">{fu.date} • {fu.method} • <span className="text-primary">{fu.staff}</span></div>
                                                        </div>
                                                        <Badge bg={isDateReached(fu.date) ? 'danger' : 'success'}>
                                                            {isDateReached(fu.date) ? 'Canceled' : fu.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-top border-light d-flex justify-content-center gap-2">
                        <Button variant="warning" className="d-flex align-items-center gap-2" onClick={handleFollowUpClick}>
                            <FiCheckSquare />
                            Follow-up #{toastData.guest ? getFollowUpsByGuest(toastData.guest.id || toastData.guest.email || '').length + 1 : 1}
                        </Button>
                        <Button
                            variant="secondary"
                            className="d-flex align-items-center gap-2"
                            onClick={handleEditLastFollowUp}
                            disabled={!toastData.guest || getFollowUpsByGuest(toastData.guest.id || toastData.guest.email || '').length === 0}
                        >
                            <span>✏️</span>
                            Edit Last
                        </Button>
                        <Button variant="warning" onClick={() => setToastData({ show: false, guest: null })}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Follow-up Form Modal */}
                <Modal show={followUpModal.show} onHide={() => setFollowUpModal({ show: false, guest: null })} centered size="lg" contentClassName="border-0 shadow-lg">
                    <Modal.Header closeButton className="border-bottom border-light">
                        <Modal.Title>Complete Follow-up #{followUpModal.guest ? getFollowUpCount(followUpModal.guest.id || followUpModal.guest.email || '') + 1 : 1}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {followUpModal.guest && (
                            <div>
                                <div className="p-3 rounded mb-3" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', borderLeft: '4px solid #d4af37' }}>
                                    <div className="fw-bold">Guest: {followUpModal.guest.name}</div>
                                    <div className="text-secondary small mt-1">Original Lead Creator: {followUpModal.guest.staff || 'N/A'}</div>
                                </div>

                                <div className="mb-3">
                                    <h6 className="text-secondary text-uppercase mb-2" style={{ fontSize: '0.75rem' }}>Guest Details</h6>
                                    <div className="small">
                                        {followUpModal.guest.phone && <div className="mb-2"><FiPhone className="me-2" size={16} />{followUpModal.guest.phone}</div>}
                                        {followUpModal.guest.checkIn && <div className="mb-2"><FiCalendar className="me-2" size={16} />{followUpModal.guest.checkIn} to {followUpModal.guest.checkOut}</div>}
                                        <div className="mb-2">{followUpModal.guest.product} • {followUpModal.guest.channel}</div>
                                    </div>
                                </div>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                            <div className="text-secondary text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Service Value</div>
                                            <div className="text-warning fw-bold">{followUpModal.guest.bookedValue ? `₱${followUpModal.guest.bookedValue}` : 'Pending'}</div>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="p-2 rounded mb-2" style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                            <div className="text-secondary text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Original Staff</div>
                                            <div className="text-dark fw-bold">{followUpModal.guest.staff || 'N/A'}</div>
                                        </div>
                                        <div className="p-2 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                            <div className="text-secondary text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Credited Staff</div>
                                            <div className="text-primary fw-bold">
                                                {(followUpData.status === 'Booked' && followUpData.staff)
                                                    ? followUpData.staff
                                                    : (followUpModal.guest.creditedStaff || 'Pending')}
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="text-muted small">Staff Who Followed Up *</Form.Label>
                                        <Form.Select value={followUpData.staff} onChange={(e) => setFollowUpData({ ...followUpData, staff: e.target.value })} className="filter-control w-100">
                                            <option value="">Select staff member</option>
                                            {staffMembers && staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="text-muted small">Follow-Up Method *</Form.Label>
                                        <Form.Select value={followUpData.method} onChange={(e) => setFollowUpData({ ...followUpData, method: e.target.value })} className="filter-control w-100">
                                            <option value="">Select method</option>
                                            <option value="Call">Call</option>
                                            <option value="Messenger">Messenger</option>
                                            <option value="Text">Text</option>
                                            <option value="Email">Email</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="text-muted small">Status *</Form.Label>
                                        <Form.Select value={followUpData.status} onChange={(e) => setFollowUpData({ ...followUpData, status: e.target.value })} className="filter-control w-100">
                                            <option value="">Select status</option>
                                            {followUpModal.guest.status === 'Sent Rate' ? (
                                                <>
                                                    <option value="Booked">Booked</option>
                                                    <option value="Done">Follow up</option>
                                                </>
                                            ) : followUpModal.guest.status === 'Intent' ? (
                                                <>
                                                    <option value="Booked">Booked</option>
                                                    <option value="Sent Rate">Sent Rate</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                    <option value="Done">Follow up</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Done">Done</option>
                                                    <option value="Booked">Booked</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </>
                                            )}
                                        </Form.Select>
                                    </Form.Group>
                                    {followUpData.status === 'Booked' && (
                                        <Form.Group className="mb-3 animate-fade-in">
                                            <Form.Label className="text-warning small fw-bold">
                                                Booked Value (₱) *
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter amount"
                                                value={followUpData.bookedValue}
                                                onChange={(e) => setFollowUpData({ ...followUpData, bookedValue: e.target.value })}
                                                className="filter-control w-100 border-warning"
                                                required
                                            />
                                        </Form.Group>
                                    )}
                                </Form>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-top border-light">
                        <Button variant="secondary" onClick={() => {
                            setFollowUpModal({ show: false, guest: null, editingId: null });
                            setFollowUpData({ staff: '', method: '', status: '', bookedValue: '' });
                        }}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveFollowUp}>
                            {followUpModal.editingId ? 'Update Changes' : 'Save Follow-up'}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Toast Notification */}
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
                    <Toast show={saveMessage.show} onClose={() => setSaveMessage({ ...saveMessage, show: false })} bg={saveMessage.type}>
                        <Toast.Body className="text-white fw-bold">
                            {saveMessage.message}
                        </Toast.Body>
                    </Toast>
                </div>
            </div>
        </div>
    );
};

export default Reminders;
