import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Table, ProgressBar, Form, Button, Toast, ToastContainer } from 'react-bootstrap';
import { FiTrendingUp, FiUsers, FiDollarSign, FiActivity, FiTarget, FiAward, FiCalendar, FiPlus, FiSave, FiTag, FiPhone } from 'react-icons/fi';
import { useData } from '../context/DataContext';
import DatabaseStatus from '../components/DatabaseStatus';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <Card className="glass-card mb-4 border-0 h-100">
        <Card.Body>
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <Icon size={14} className="text-secondary opacity-75" />
                        <h6 className="text-secondary text-uppercase mb-0" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', fontWeight: '600' }}>{title}</h6>
                    </div>
                    <h3 className="fw-bold mb-0">{value}</h3>
                </div>
                <div className={`p-2 rounded-3 bg-${color} bg-opacity-10`}>
                    <Icon size={20} className={`text-${color}`} />
                </div>
            </div>
            <div className="small text-muted">{subtext}</div>
        </Card.Body>
    </Card>
);

const ForecastCard = ({ title, label, leads, booked, revenue, rate, color, emoji }) => {
    // Map colors to bootstrap utilities for consistency
    const textVariant = color === 'warning' ? 'text-warning' : (color === 'primary' ? 'text-primary' : 'text-info');
    const bgVariant = color === 'warning' ? 'bg-warning' : (color === 'primary' ? 'bg-primary' : 'bg-info');

    return (
        <Card className="glass-card h-100 border-0">
            <Card.Body className="p-3 d-flex flex-column h-100 position-relative overflow-hidden">
                {/* Top accent line */}
                <div className={`${bgVariant}`} style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    opacity: 0.8
                }}></div>

                {/* Header */}
                <div className="mb-3 mt-2">
                    <div className={`d-flex align-items-center gap-2 mb-1 ${textVariant} opacity-75`} style={{ fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                        <span style={{ fontSize: '0.9rem' }}>{emoji}</span> {label}
                    </div>
                    <h5 className="fw-bold mb-0">{title}</h5>
                </div>

                {/* Closing Rate Big Stat */}
                <div className="mb-3">
                    <h2 className={`fw-bold mb-0 ${textVariant}`} style={{ fontSize: '2.5rem', lineHeight: '1' }}>{rate}%</h2>
                    <div className="text-secondary small text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Closing Rate</div>
                </div>

                {/* Metrics Grid */}
                <div className="mt-auto">
                    <Row className="g-2 mb-3">
                        <Col xs={6}>
                            <div className="p-2 rounded-3" style={{ backgroundColor: 'var(--table-header-bg)', border: '1px solid var(--border-color)' }}>
                                <div className="mb-0 fw-bold h6 text-primary">{booked}</div>
                                <div className="text-secondary tiny" style={{ fontSize: '0.65rem' }}>Booked</div>
                            </div>
                        </Col>
                        <Col xs={6}>
                            <div className="p-2 rounded-3" style={{ backgroundColor: 'var(--table-header-bg)', border: '1px solid var(--border-color)' }}>
                                <div className="mb-0 fw-bold h6 text-primary">{leads}</div>
                                <div className="text-secondary tiny" style={{ fontSize: '0.65rem' }}>Leads</div>
                            </div>
                        </Col>
                    </Row>

                    <div>
                        <div className="d-flex justify-content-between align-items-end mb-1">
                            <div>
                                <div className="fw-bold fs-5 text-primary">₱{revenue.toLocaleString()}</div>
                                <div className="text-secondary tiny" style={{ fontSize: '0.65rem' }}>Revenue</div>
                            </div>
                            <span className={`tiny fw-bold ${textVariant}`}>{Math.min(rate, 100)}%</span>
                        </div>
                        {/* Progress bar visual */}
                        <ProgressBar
                            now={Math.min(rate, 100)}
                            variant={color}
                            style={{ height: '4px', backgroundColor: 'rgba(0,0,0,0.05)' }}
                        />
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

const Dashboard = () => {
    const { guests, products, channels, staffMembers, statuses } = useData();
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        const getRevenueDate = (g) => (g.bookedAt || g.sentRateAt || g.createdAt || '').split('T')[0];
        const getCreationDate = (g) => (g.createdAt || '').split('T')[0];

        // Revenue Today vs Yesterday
        const revenueToday = guests
            .filter(g => (g.status === 'Booked' || g.status === 'Sent Rate') && getRevenueDate(g) === todayStr)
            .reduce((sum, g) => sum + Number(g.bookedValue || 0), 0);

        const revenueYesterday = guests
            .filter(g => (g.status === 'Booked' || g.status === 'Sent Rate') && getRevenueDate(g) === yesterdayStr)
            .reduce((sum, g) => sum + Number(g.bookedValue || 0), 0);

        const bookingsToday = guests.filter(g => g.status === 'Booked' && getRevenueDate(g) === todayStr).length;

        // Monthly Metrics
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = guests
            .filter(g => {
                if (g.status !== 'Booked' && g.status !== 'Sent Rate') return false;
                const d = new Date(g.bookedAt || g.sentRateAt || g.createdAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum, g) => sum + Number(g.bookedValue || 0), 0);

        const monthlyBooked = guests.filter(g => {
            if (g.status !== 'Booked') return false;
            const d = new Date(g.bookedAt || g.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const thisMonthLeads = guests.filter(g => {
            const d = new Date(g.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthlyLeads = thisMonthLeads.length;
        const closingRate = monthlyLeads > 0 ? ((monthlyBooked / monthlyLeads) * 100).toFixed(1) : 0;

        // Staff Performance (Month)
        const staffStats = {};

        // Use all leads for calculation
        thisMonthLeads.forEach(g => {
            if (!staffStats[g.staff]) staffStats[g.staff] = { revenue: 0, booked: 0, leads: 0 };
            staffStats[g.staff].leads++;
        });

        // Use monthly bookings/rates for revenue/booked counts
        guests.filter(g => {
            if (g.status !== 'Booked' && g.status !== 'Sent Rate') return false;
            const d = new Date(g.bookedAt || g.sentRateAt || g.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).forEach(g => {
            if (!staffStats[g.staff]) staffStats[g.staff] = { revenue: 0, booked: 0, leads: 0 };
            if (g.status === 'Booked') staffStats[g.staff].booked++;
            staffStats[g.staff].revenue += Number(g.bookedValue || 0);
        });

        let topPerformer = { name: 'N/A', revenue: 0, booked: 0, rate: 0 };
        let bestCloser = { name: 'N/A', rate: 0, closed: 0 };
        let topLeadGetter = { name: 'N/A', leads: 0 };

        Object.entries(staffStats).forEach(([name, data]) => {
            const rate = data.leads > 0 ? (data.booked / data.leads) * 100 : 0;

            if (data.revenue > topPerformer.revenue) {
                topPerformer = { name, ...data, rate: rate.toFixed(1) };
            }
            if (rate > (Number(bestCloser.rate) || 0)) {
                bestCloser = { name, rate: rate.toFixed(1), closed: data.booked };
            }
            if (data.leads > topLeadGetter.leads) {
                topLeadGetter = { name, leads: data.leads };
            }
        });

        // Forecast Data (3 Months by Check-in)
        const forecastData = [];
        const today = new Date();

        for (let i = 0; i < 3; i++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const tMonth = targetDate.getMonth();
            const tYear = targetDate.getFullYear();
            const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Filter guests by checkIn date
            const monthGuests = guests.filter(g => {
                if (!g.checkIn) return false;
                const d = new Date(g.checkIn);
                return d.getMonth() === tMonth && d.getFullYear() === tYear;
            });

            const leads = monthGuests.length;
            const booked = monthGuests.filter(g => g.status === 'Booked').length;
            const revenue = monthGuests
                .filter(g => g.status === 'Booked')
                .reduce((sum, g) => sum + Number(g.bookedValue || 0), 0);

            const rate = leads > 0 ? ((booked / leads) * 100).toFixed(1) : 0;

            // Labels and Colors
            let label = 'CURRENT MONTH';
            let color = 'warning'; // Gold
            let emoji = '🗓️';

            if (i === 1) {
                label = 'FORECAST - NEXT MONTH';
                color = 'primary'; // Blue
                emoji = '🔮';
            } else if (i === 2) {
                label = 'FORECAST - MONTH +2';
                color = 'info'; // Purple usage
                emoji = '🔮';
            }

            forecastData.push({
                monthName,
                leads,
                booked,
                revenue,
                rate,
                label,
                color,
                emoji
            });
        }

        return {
            revenueToday,
            revenueYesterday,
            bookingsToday,
            monthlyRevenue,
            monthlyBooked,
            monthlyLeads,
            closingRate,
            topPerformer,
            bestCloser,
            topLeadGetter,
            staffStats,
            forecastData
        };
    }, [guests]);

    return (
        <div className="animate-fade-in">
            <ToastContainer position="top-end" className="p-3">
                <Toast show={toast.show} onClose={() => setToast({ ...toast, show: false })} delay={3000} autohide bg={toast.type}>
                    <Toast.Body className="text-white fw-bold">{toast.message}</Toast.Body>
                </Toast>
            </ToastContainer>

            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <h1 className="fw-bold mb-1 d-flex align-items-center gap-2"><FiActivity className="text-warning" />Overview</h1>
                    <p className="text-secondary mb-0">Track your business growth and capture leads.</p>
                </div>
                <div className="text-end">
                    <h5 className="mb-0 d-flex align-items-center gap-2 text-primary"><FiCalendar className="text-warning" />{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h5>
                </div>
            </div>

            <DatabaseStatus />

            <Row className="g-4 mb-5">
                <Col md={4} className="animate-slide-up delay-100">
                    <StatCard
                        title="Revenue (Today)"
                        value={`₱${stats.revenueToday.toLocaleString()}`}
                        subtext={`vs ₱${stats.revenueYesterday.toLocaleString()} yesterday`}
                        icon={FiDollarSign}
                        color="primary"
                    />
                </Col>
                <Col md={4} className="animate-slide-up delay-200">
                    <StatCard
                        title="Month Revenue"
                        value={`₱${stats.monthlyRevenue.toLocaleString()}`}
                        subtext={`${stats.monthlyBooked} bookings from ${stats.monthlyLeads} leads`}
                        icon={FiActivity}
                        color="success"
                    />
                </Col>
                {/* Removed simple Closing Rate card to replace with detailed section below */}
                <Col md={4} className="animate-slide-up delay-400">
                    <StatCard
                        title="Bookings Today"
                        value={stats.bookingsToday}
                        subtext="New confirmed bookings"
                        icon={FiTarget}
                        color="warning"
                    />
                </Col>
            </Row>

            {/* New Closing Rate Forecast Section */}
            <div className="mb-4 animate-slide-up delay-300">
                <div className="d-flex align-items-center gap-2 mb-3">
                    <FiTrendingUp className="text-warning" size={20} />
                    <h5 className="fw-bold mb-0">Forecast (by Check-in Date)</h5>
                </div>

                <Row className="g-3">
                    {stats.forecastData.map((data, idx) => (
                        <Col md={4} key={idx}>
                            <ForecastCard
                                title={data.monthName}
                                label={data.label}
                                leads={data.leads}
                                booked={data.booked}
                                revenue={data.revenue}
                                rate={data.rate}
                                color={data.color}
                                emoji={data.emoji}
                            />
                        </Col>
                    ))}
                </Row>

                <div className="mt-3 p-3 rounded-3 d-flex align-items-start gap-2 bg-warning bg-opacity-10 border border-warning border-opacity-25">
                    <FiActivity className="text-warning mt-1" size={16} />
                    <p className="small text-secondary mb-0" style={{ lineHeight: '1.5', fontSize: '0.8rem' }}>
                        <span className="fw-bold">Note:</span> Closing rates are based on <span className="fw-bold">check-in dates</span> to forecast future conversion performance.
                    </p>
                </div>
            </div>

            <Row className="g-4">
                <Col lg={12}>
                    <Row className="g-4">
                        {/* Top Performers */}
                        <Col md={12} className="animate-slide-up delay-500">
                            <Card className="glass-card shadow-sm border-0 h-100">
                                <Card.Header className="bg-transparent border-bottom border-light border-opacity-10 py-3">
                                    <h5 className="mb-0 d-flex align-items-center gap-2"><FiAward className="text-warning" />Top Performers (This Month)</h5>
                                </Card.Header>
                                <Card.Body className="py-4">
                                    <Row>
                                        <Col md={4}>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-3 rounded-circle bg-warning bg-opacity-10 shadow-sm">
                                                    <FiAward size={24} style={{ color: '#d4af37' }} />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="text-secondary text-uppercase mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                                                        <span style={{ fontSize: '0.9rem', lineHeight: '1' }}>₱</span> Top Revenue
                                                    </h6>
                                                    <div className="d-flex justify-content-between align-items-end">
                                                        <h4 className="fw-bold mb-0 text-gradient">{stats.topPerformer.name}</h4>
                                                        <div className="text-end">
                                                            <div className="text-warning text-gradient fw-bold" style={{ fontSize: '1.2rem' }}>₱{Number(stats.topPerformer.revenue).toLocaleString()}</div>
                                                            <small className="text-secondary opacity-75">{stats.topPerformer.booked} Bookings</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={4} className="border-start border-light border-opacity-10">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-3 rounded-circle bg-primary bg-opacity-10 shadow-sm">
                                                    <FiUsers size={24} className="text-primary" />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="text-secondary text-uppercase mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                                                        <FiUsers size={12} style={{ marginTop: '-1px' }} /> Top Lead Getter
                                                    </h6>
                                                    <div className="d-flex justify-content-between align-items-end">
                                                        <h4 className="fw-bold mb-0 text-gradient">{stats.topLeadGetter.name}</h4>
                                                        <div className="text-end">
                                                            <div className="text-primary fw-bold" style={{ fontSize: '1.2rem' }}>{stats.topLeadGetter.leads} Leads</div>
                                                            <small className="text-secondary opacity-75">Active discovery</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={4} className="border-start border-light border-opacity-10">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="p-3 rounded-circle bg-info bg-opacity-10 shadow-sm">
                                                    <FiTrendingUp size={24} style={{ color: '#0dcaf0' }} />
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="text-secondary text-uppercase mb-0 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.5px' }}>
                                                        <FiTrendingUp size={12} style={{ marginTop: '-1px' }} /> Best Closer
                                                    </h6>
                                                    <div className="d-flex justify-content-between align-items-end">
                                                        <h4 className="fw-bold mb-0 text-gradient">{stats.bestCloser.name}</h4>
                                                        <div className="text-end">
                                                            <div className="text-info fw-bold" style={{ fontSize: '1.2rem' }}>{stats.bestCloser.rate}% Rate</div>
                                                            <small className="text-secondary opacity-75">{stats.bestCloser.closed} Closed</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Staff Performance Table */}
                        <Col md={12} className="animate-slide-up delay-500">
                            <Card className="glass-card shadow-sm border-0">
                                <Card.Header className="bg-transparent border-bottom border-light border-opacity-10 py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 d-flex align-items-center gap-2"><FiUsers className="text-info" />Staff Efficiency</h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="table-borderless mb-0 align-middle">
                                        <thead>
                                            <tr>
                                                <th className="ps-4 text-secondary text-uppercase small py-3" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Staff</th>
                                                <th className="text-secondary text-uppercase small py-3" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Leads</th>
                                                <th className="text-secondary text-uppercase small py-3" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Booked</th>
                                                <th className="text-secondary text-uppercase small py-3" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Rate</th>
                                                <th className="pe-4 text-end text-secondary text-uppercase small py-3" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody id="dboard">
                                            {Object.entries(stats.staffStats).map(([name, data], i) => (
                                                <tr key={name} className="border-bottom border-light border-opacity-50">
                                                    <td className="ps-4 fw-medium">{name}</td>
                                                    <td className="text-light opacity-75">{data.leads}</td>
                                                    <td className="text-light opacity-75">{data.booked}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="small fw-bold">{(data.leads > 0 ? (data.booked / data.leads * 100) : 0).toFixed(0)}%</span>
                                                            <ProgressBar now={(data.leads > 0 ? (data.booked / data.leads * 100) : 0)} variant="warning" style={{ height: '4px', width: '50px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-4 text-gold fw-bold">₱{data.revenue.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {Object.keys(stats.staffStats).length === 0 && (
                                                <tr><td colSpan="5" className="text-center text-muted py-5">No active data for this month</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
