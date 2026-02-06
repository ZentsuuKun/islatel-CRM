import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Form, Button, Toast, ToastContainer } from 'react-bootstrap';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiPieChart, FiSettings, FiLogOut, FiPlus, FiBell, FiLogIn, FiSun, FiMoon } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const Layout = () => {
    const { guests } = useData();
    const location = useLocation();
    const auth = useAuth();
    const navigate = useNavigate();
    const [passcode, setPasscode] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
    const [reminderToast, setReminderToast] = useState({ show: false, count: 0 });

    // Theme state
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (guests && guests.length > 0) {
            const today = new Date().toISOString().split('T')[0];

            const dueGuests = guests.filter(g => {
                if (g.status === 'Booked' || g.status === 'Cancelled' || !g.checkIn) return false;
                const diffTime = new Date(g.checkIn) - new Date(today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 4;
            });

            if (dueGuests.length > 0) {
                setReminderToast({ show: true, count: dueGuests.length });
            }
        }
    }, [guests]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const navItems = [
        { path: '/', label: 'Overview', icon: <FiHome size={18} /> },
        { path: '/guests', label: 'All Guests', icon: <FiUsers size={18} /> },
        { path: '/reminders', label: 'Reminders', icon: <FiBell size={18} /> },
    ];

    if (auth && auth.user && auth.user.role === 'admin') {
        navItems.push({ path: '/manage', label: 'Manage Options', icon: <FiSettings size={18} /> });
        navItems.push({ path: '/reports', label: 'Reports', icon: <FiPieChart size={18} /> });
    }

    return (
        <div className="d-flex" style={{ minHeight: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div
                className="d-flex flex-column flex-shrink-0 p-4 sidebar-dark m-3"
                style={{ width: '280px', height: 'calc(100vh - 32px)', position: 'sticky', top: '16px', zIndex: 1000 }}
            >
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <a href="/" className="text-decoration-none">
                        <span className="fs-4 fw-bold text-gradient">ISLATEL CRM</span>
                    </a>
                    <Button
                        variant="link"
                        onClick={toggleTheme}
                        className="p-0 text-secondary"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
                    </Button>
                </div>

                <hr className="border-secondary opacity-25" />
                <Nav className="flex-column">
                    {navItems.map((item) => (
                        <Nav.Link
                            as={Link}
                            to={item.path}
                            key={item.path}
                            className={`d-flex align-items-center gap-3 px-3 py-2 ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            {item.icon}
                            {item.label}
                        </Nav.Link>
                    ))}
                </Nav>

                <div className="mt-auto mt-3">
                    {auth && auth.user ? (
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="small text-secondary">Role: <span className="text-secondary fw-bold ms-1">{auth.user.role}</span></div>
                            <Nav.Link as={Link} to="#" onClick={() => { auth.logout(); navigate('/'); }} className="text-danger">Logout</Nav.Link>
                        </div>
                    ) : (
                        <div className="px-2">
                            <Form onSubmit={(e) => {
                                e.preventDefault();
                                const res = auth.login(passcode.trim());
                                if (res.success) {
                                    setToast({ show: true, message: `Signed in as ${res.role}`, variant: 'success' });
                                    setPasscode('');
                                    navigate('/');
                                } else {
                                    setToast({ show: true, message: 'Invalid passcode', variant: 'danger' });
                                }
                            }}>
                                <Form.Group className="mb-2">
                                    <Form.Control
                                        type="password"
                                        placeholder="passcode"
                                        value={passcode}
                                        onChange={(e) => setPasscode(e.target.value)}
                                        className="filter-control w-100"
                                        size="sm"
                                    />
                                </Form.Group>
                                <div className="d-flex gap-2">
                                    <Button type="submit" size="sm" variant="primary" className="flex-grow-1">Sign in</Button>
                                </div>
                            </Form>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1 p-4" style={{ height: '100vh', overflowY: 'auto' }}>
                <Outlet />
            </div>

            <ToastContainer position="bottom-end" className="p-3">
                <Toast show={toast.show} onClose={() => setToast({ ...toast, show: false })} bg={toast.variant} delay={3000} autohide>
                    <Toast.Body className="text-white fw-bold">{toast.message}</Toast.Body>
                </Toast>
                <Toast show={reminderToast.show} onClose={() => setReminderToast({ ...reminderToast, show: false })} bg="warning">
                    <Toast.Header>
                        <strong className="me-auto">Reminder Alert</strong>
                    </Toast.Header>
                    <Toast.Body className="fw-bold">
                        ⚠️ You have {reminderToast.count} guest(s) approaching check-in!
                        <div className="mt-2">
                            <Button size="sm" variant="dark" onClick={() => {
                                navigate('/reminders');
                                setReminderToast({ ...reminderToast, show: false });
                            }}>
                                Check Reminders
                            </Button>
                        </div>
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default Layout;
