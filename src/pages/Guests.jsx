import React, { useState } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Modal, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import { FiSearch, FiFilter, FiPlus, FiMoreVertical, FiEdit2, FiTrash2, FiUsers, FiEye, FiFileText } from 'react-icons/fi';
import { useData } from '../context/DataContext';

const Guests = () => {
    const { guests, products, channels, staffMembers, statuses, followUps, addGuest, updateGuest, deleteGuest } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [showPaperModal, setShowPaperModal] = useState(false);
    const [paperGuest, setPaperGuest] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Form State
    const initialFormState = {
        name: '',
        email: '',
        phone: '',
        fbName: '',
        checkIn: '',
        checkOut: '',
        product: '',
        channel: '',
        staff: '',
        status: '',
        bookedValue: '',
        creditedStaff: '',
        notes: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleShow = (guest = null) => {
        if (guest) {
            setEditingId(guest.id);
            setFormData(guest);
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setShowModal(true);
    };

    const handleClose = () => setShowModal(false);

    const handleShowDetails = (guest) => {
        setSelectedGuest(guest);
        setShowDetailsModal(true);
    };

    const handleCloseDetails = () => {
        setShowDetailsModal(false);
        setSelectedGuest(null);
    };

    const handleShowPaper = (guest) => {
        setPaperGuest(guest);
        setShowPaperModal(true);
    };

    const handleClosePaper = () => {
        setShowPaperModal(false);
        setPaperGuest(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            updateGuest({ ...formData, id: editingId });
            setToast({ show: true, message: 'Guest updated successfully!', type: 'success' });
            handleClose();
        } else {
            const result = await addGuest(formData);
            if (result.isDuplicate) {
                setToast({ show: true, message: result.message, type: 'warning' });
            } else {
                setToast({ show: true, message: result.message, type: 'success' });
                handleClose();
            }
        }
    };

    const filteredGuests = guests.filter(guest => {
        const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guest.phone.includes(searchTerm);

        const matchesStatus = selectedStatus === '' || guest.status === selectedStatus;
        const matchesProduct = selectedProduct === '' || guest.product === selectedProduct;
        const matchesChannel = selectedChannel === '' || guest.channel === selectedChannel;
        const matchesStaff = selectedStaff === '' || guest.staff === selectedStaff;

        return matchesSearch && matchesStatus && matchesProduct && matchesChannel && matchesStaff;
    });

    const getFollowUpsByGuest = (guestId) => {
        return followUps.filter(fu => fu.guestId === guestId || fu.guestId === guestId?.email);
    };

    const formLocked = editingId && formData.status === 'Booked';

    return (
        <div>
            <ToastContainer position="top-end" className="p-3">
                <Toast
                    show={toast.show}
                    onClose={() => setToast({ ...toast, show: false })}
                    delay={3000}
                    autohide
                    bg={toast.type === 'warning' ? 'warning' : 'success'}
                >
                    <Toast.Body className={toast.type === 'warning' ? 'text-dark fw-bold' : 'text-white fw-bold'}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold mb-1 d-flex align-items-center gap-2"><FiUsers className="text-warning" />All Guests</h1>
                    <p className="text-secondary mb-0">Manage your guests and bookings.</p>
                </div>
                <Button variant="primary" onClick={() => handleShow()} className="d-flex align-items-center gap-2">
                    <FiPlus />
                    Add Guest
                </Button>
            </div>

            <div className="filter-bar mb-4 animate-slide-up">
                <Row className="g-3">
                    <Col md={3}>
                        <InputGroup className="glass-input">
                            <InputGroup.Text>
                                <FiSearch />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search name, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="filter-control"
                        >
                            <option value="">All Statuses</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="filter-control"
                        >
                            <option value="">All Products</option>
                            {products.map(p => <option key={p} value={p}>{p}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                            className="filter-control"
                        >
                            <option value="">All Channels</option>
                            {channels.map(c => <option key={c} value={c}>{c}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Form.Select
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                            className="filter-control"
                        >
                            <option value="">All Staff</option>
                            {staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                    </Col>
                </Row>
            </div>
            <Card className="glass-card mb-4">
                <Card.Body>
                    <Table responsive hover className="table-borderless mb-0 align-middle">
                        <thead>
                            <tr className="border-bottom border-light">
                                <th className="ps-4 text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Guest Name</th>
                                <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Channel</th>

                                <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Status</th>
                                <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Product</th>
                                <th className="text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Dates</th>
                                <th className="text-end pe-4 text-muted text-uppercase" style={{ fontSize: '0.75rem', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.map((guest) => (
                                <tr key={guest.id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                                                style={{ width: '36px', height: '36px', background: `hsl(${(guest.name.length * 20) % 360}, 65%, 55%)` }}>
                                                {guest.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="fw-medium">{guest.name}</div>
                                                <div className="small text-muted" style={{ fontSize: '0.75rem' }}>{guest.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-secondary">{guest.channel}</td>

                                    <td>
                                        {(() => {
                                            const s = guest.status;
                                            if (s === 'Booked') {
                                                return (
                                                    <div className="d-flex flex-column gap-1">
                                                        <Badge bg="success" className="fw-bold px-3 py-1 text-white border-0" style={{ borderRadius: '20px' }}>Booked</Badge>
                                                        <div className="small fw-bold text-success">
                                                            ₱{Number(guest.bookedValue || 0).toLocaleString()}
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            if (s === 'Cancelled') {
                                                return <Badge bg="danger" className="fw-bold px-3 py-1 text-white border-0" style={{ fontSize: '0.75rem', borderRadius: '20px' }}>Cancelled</Badge>;
                                            }

                                            // ALL other statuses show as 'Follow up'
                                            return (
                                                <div className="d-flex flex-column gap-1">
                                                    <Badge bg="warning" className="fw-bold px-3 py-1 text-white border-0" style={{ borderRadius: '20px' }}>Follow up</Badge>
                                                    <div className="d-flex flex-column gap-0" style={{ fontSize: '0.7rem' }}>
                                                        {(!['Sent Rate', 'Cancelled', 'Intent', 'Booked'].includes(s)) && (
                                                            <div className="text-muted">{s}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="text-secondary">{guest.product}</td>
                                    <td className="small text-secondary">
                                        <div>In: {guest.checkIn}</div>
                                        <div>Out: {guest.checkOut}</div>
                                    </td>
                                    <td className="text-end pe-4">
                                        <Button
                                            variant="link"
                                            className="p-1 me-2"
                                            onClick={() => handleShowPaper(guest)}
                                            style={{ color: '#d4af37' }}
                                            title="Staff Log"
                                        >
                                            <FiFileText size={18} />
                                        </Button>
                                        <Button
                                            variant="link"
                                            className="p-1 me-2"
                                            onClick={() => handleShowDetails(guest)}
                                            style={{ color: '#d4af37' }}
                                            title="View Details"
                                        >
                                            <FiEye size={18} />
                                        </Button>
                                        <Button
                                            variant="link"
                                            className="p-1 me-2"
                                            onClick={() => handleShow(guest)}
                                            style={{ color: '#c9a961' }}
                                        >
                                            <FiEdit2 size={18} />
                                        </Button>
                                        <Button
                                            variant="link"
                                            className="p-1"
                                            onClick={() => deleteGuest(guest.id)}
                                            style={{ color: '#c45a3c' }}
                                        >
                                            <FiTrash2 size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredGuests.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-muted">No guests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Guest Details Modal */}
            <Modal show={showDetailsModal} onHide={handleCloseDetails} centered size="lg" className="glass-modal" contentClassName="border-0 shadow-lg">
                <Modal.Header closeButton className="border-bottom border-light">
                    <Modal.Title>Guest Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedGuest && (
                        <div className="p-2">
                            <div className="mb-4">
                                <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Full Name</div>
                                <div className="h5 fw-bold mb-0">{selectedGuest.name}</div>
                            </div>
                            <div className="mb-4">
                                <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Email</div>
                                <div className="mb-0">{selectedGuest.email || 'N/A'}</div>
                            </div>
                            <div className="mb-4">
                                <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Phone</div>
                                <div className="mb-0">{selectedGuest.phone || 'N/A'}</div>
                            </div>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Check-in</div>
                                    <div className="">{selectedGuest.checkIn || 'N/A'}</div>
                                </Col>
                                <Col md={6}>
                                    <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Check-out</div>
                                    <div className="">{selectedGuest.checkOut || 'N/A'}</div>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Product</div>
                                    <div className="">{selectedGuest.product || 'N/A'}</div>
                                </Col>
                                <Col md={6}>
                                    <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Channel</div>
                                    <div className="">{selectedGuest.channel || 'N/A'}</div>
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <div className="mb-2">
                                        <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Credited Staff</div>
                                        <div className="fw-bold text-primary">{selectedGuest.creditedStaff || 'Pending'}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Original Staff</div>
                                        <div className="text-secondary">{selectedGuest.staff || 'N/A'}</div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Status</div>
                                    <Badge
                                        bg={selectedGuest.status === 'Booked' ? 'success' : selectedGuest.status === 'Cancelled' ? 'danger' : 'info'}
                                        className="fw-normal px-2 py-1 bg-opacity-25"
                                        style={{ color: selectedGuest.status === 'Cancelled' ? '#ff4d4d' : 'inherit' }}
                                    >
                                        {selectedGuest.status}
                                    </Badge>
                                </Col>
                            </Row>

                            {selectedGuest.status === 'Booked' && selectedGuest.bookedValue && (
                                <Row>
                                    <Col md={6}>
                                        <div className="text-muted text-uppercase small mb-1" style={{ fontSize: '0.7rem' }}>Booked Value</div>
                                        <div className="text-success fw-bold">₱{Number(selectedGuest.bookedValue).toLocaleString()}</div>
                                    </Col>
                                </Row>
                            )}

                            <div className="mt-4 pt-4 border-top border-light">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <h5 className="mb-0 fw-bold">Follow-up History</h5>
                                </div>
                                {getFollowUpsByGuest(selectedGuest.id || selectedGuest.email).length === 0 ? (
                                    <div className="text-muted small">No follow-ups recorded.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {getFollowUpsByGuest(selectedGuest.id || selectedGuest.email).map((fu, idx) => (
                                            <div key={fu.id || idx} className="small py-2 border-bottom border-light">
                                                <span className="fw-bold">{fu.date}</span> • {fu.method} • <span className="text-primary">{fu.staff}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top border-light">
                    <Button variant="secondary" onClick={handleCloseDetails}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Paper / Staff Log Modal */}
            <Modal show={showPaperModal} onHide={handleClosePaper} centered className="glass-modal" contentClassName="border-0 shadow-lg">
                <Modal.Header closeButton className="border-bottom border-light">
                    <Modal.Title>Staff Log</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {paperGuest && (
                        <div>
                            {getFollowUpsByGuest(paperGuest.id || paperGuest.email).length === 0 ? (
                                <div className="text-muted py-4 text-center">No follow-ups recorded for this guest.</div>
                            ) : (
                                <div className="d-flex flex-column gap-2">
                                    <div className="text-secondary small">Staff involved:</div>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {Array.from(new Set(getFollowUpsByGuest(paperGuest.id || paperGuest.email).map(fu => fu.staff))).map(s => (
                                            <Badge key={s} bg="light" className="text-dark border">{s}</Badge>
                                        ))}
                                    </div>
                                    <div className="text-secondary small mt-2">Full history:</div>
                                    {getFollowUpsByGuest(paperGuest.id || paperGuest.email).map((fu, idx) => (
                                        <div key={fu.id || idx} className="small py-2 border-bottom border-light">{fu.date} • {fu.method} • {fu.staff}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-secondary">
                    <Button variant="secondary" onClick={handleClosePaper}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={handleClose} centered className="glass-modal" size="lg">
                <Modal.Header closeButton className="border-bottom border-light">
                    <Modal.Title className="fw-bold font-luxury text-gradient">{editingId ? 'Edit Guest' : 'New Guest Booking'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form onSubmit={handleSubmit}>
                        <fieldset disabled={formLocked}>
                            <div className="mb-4">
                                <h6 className="text-secondary text-uppercase mb-3 small fw-bold">Guest Information</h6>
                                <Row className="g-3">
                                    <Col md={12}>
                                        <div className="glass-input-group">
                                            <InputGroup>
                                                <InputGroup.Text><FiUsers size={18} /></InputGroup.Text>
                                                <Form.Control
                                                    required
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Guest Full Name *"
                                                    className="shadow-none"
                                                />
                                            </InputGroup>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="glass-input-group">
                                            <InputGroup>
                                                <InputGroup.Text>@</InputGroup.Text>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="Email Address"
                                                    className="shadow-none"
                                                />
                                            </InputGroup>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="glass-input-group">
                                            <InputGroup>
                                                <InputGroup.Text>#</InputGroup.Text>
                                                <Form.Control
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="Phone Number"
                                                    className="shadow-none"
                                                />
                                            </InputGroup>
                                        </div>
                                    </Col>
                                    <Col md={12}>
                                        <div className="glass-input-group">
                                            <InputGroup>
                                                <InputGroup.Text>fb</InputGroup.Text>
                                                <Form.Control
                                                    name="fbName"
                                                    value={formData.fbName}
                                                    onChange={handleChange}
                                                    placeholder="Facebook Name"
                                                    className="shadow-none"
                                                />
                                            </InputGroup>
                                        </div>
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <h6 className="text-secondary text-uppercase mb-3 small fw-bold">Booking Details</h6>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Label className="small text-muted mb-1">Check-in Date *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            required
                                            name="checkIn"
                                            value={formData.checkIn}
                                            onChange={handleChange}
                                            className="filter-control w-100"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label className="small text-muted mb-1">Check-out Date *</Form.Label>
                                        <Form.Control
                                            type="date"
                                            required
                                            name="checkOut"
                                            value={formData.checkOut}
                                            onChange={handleChange}
                                            className="filter-control w-100"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted mb-1">Product *</Form.Label>
                                            <Form.Select required name="product" value={formData.product} onChange={handleChange} className="filter-control w-100">
                                                <option value="">Select Product...</option>
                                                {products.map(p => <option key={p} value={p}>{p}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted mb-1">Sales Channel *</Form.Label>
                                            <Form.Select required name="channel" value={formData.channel} onChange={handleChange} className="filter-control w-100">
                                                <option value="">Select Channel...</option>
                                                {channels.map(c => <option key={c} value={c}>{c}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            <div className="mb-4">
                                <h6 className="text-secondary text-uppercase mb-3 small fw-bold">Internal Use</h6>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted mb-1">Staff Member *</Form.Label>
                                            <Form.Select required name="staff" value={formData.staff} onChange={handleChange} className="filter-control w-100">
                                                <option value="">Select Staff...</option>
                                                {staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted mb-1">Status *</Form.Label>
                                            <Form.Select required name="status" value={formData.status} onChange={handleChange} className="filter-control w-100">
                                                <option value="">Select Status...</option>
                                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    {formData.status === 'Booked' && (
                                        <Col md={12} className="animate-fade-in">
                                            <div className="p-3 rounded border border-warning bg-warning bg-opacity-10">
                                                <Row className="g-3">
                                                    <Col md={6}>
                                                        <Form.Label className="text-warning fw-bold mb-1">Total Booked Value (₱)</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            name="bookedValue"
                                                            value={formData.bookedValue}
                                                            onChange={handleChange}
                                                            className="filter-control w-100 border-warning fw-bold"
                                                            placeholder="0.00"
                                                        />
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Label className="text-warning fw-bold mb-1">Credited Staff</Form.Label>
                                                        <Form.Select
                                                            name="creditedStaff"
                                                            value={formData.creditedStaff || formData.staff}
                                                            onChange={handleChange}
                                                            className="filter-control w-100 border-warning fw-bold"
                                                        >
                                                            <option value="">Select Staff...</option>
                                                            {staffMembers.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </Form.Select>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                    )}
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="small text-muted mb-1">Notes</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleChange}
                                                className="filter-control w-100"
                                                placeholder="Additional notes about the guest..."
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>
                        </fieldset>
                        <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top border-light">
                            <Button variant="outline-secondary" onClick={handleClose} className="px-4">Cancel</Button>
                            <Button variant="primary" type="submit" disabled={formLocked} className="px-5 shadow-sm">
                                {editingId ? 'Global Update' : 'Create Booking'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div >
    );
};

export default Guests;
