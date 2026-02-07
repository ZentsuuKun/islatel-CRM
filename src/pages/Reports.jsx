import React, { useState, useMemo } from 'react';
import { Card, Button, Form, Row, Col, Table, Badge } from 'react-bootstrap';
import { FiDownload, FiTrendingUp, FiPieChart, FiBarChart2, FiActivity, FiZap, FiClock, FiTarget } from 'react-icons/fi';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '../context/DataContext';

const COLORS = ['#d4af37', '#c9a961', '#85a05c', '#f4d03f', '#c45a3c', '#b8a88a', '#8b7e6a', '#a89968'];

const Reports = () => {
    const { guests, products, channels, staffMembers, statuses, followUps } = useData();
    const [timeFrame, setTimeFrame] = useState('month'); // 'day', 'month', 'year'
    const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 7));
    const [status, setStatus] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('');

    // Filter guests based on selected criteria
    const filteredGuests = useMemo(() => {
        if (!guests) return [];
        let filtered = [...guests];

        if (dateValue) {
            filtered = filtered.filter(g => {
                const created = g.createdAt;
                if (!created) return false;

                // Determine the date to use for filtering
                // If Booked, prefer bookedAt, but fallback to createdAt to ensure they appear
                const relevantDate = (g.status === 'Booked' && g.bookedAt) ? g.bookedAt : created;

                if (timeFrame === 'day') {
                    return relevantDate.startsWith(dateValue);
                } else if (timeFrame === 'month') {
                    const [y, m] = dateValue.split('-');
                    const d = new Date(relevantDate);
                    return d.getFullYear() === parseInt(y) && (d.getMonth() + 1) === parseInt(m);
                } else if (timeFrame === 'year') {
                    const d = new Date(relevantDate);
                    return d.getFullYear() === parseInt(dateValue);
                }
                return true;
            });
        }

        if (status) {
            filtered = filtered.filter(g => g.status === status);
        }

        if (selectedProduct) {
            filtered = filtered.filter(g => g.product === selectedProduct);
        }

        if (selectedChannel) {
            filtered = filtered.filter(g => g.channel === selectedChannel);
        }

        return filtered;
    }, [guests, dateValue, timeFrame, status, selectedProduct, selectedChannel]);

    // Calculate analytics
    const analytics = useMemo(() => {
        const totalRevenue = filteredGuests
            .filter(g => g.status === 'Booked' || g.status === 'Sent Rate')
            .reduce((sum, g) => sum + Number(g.bookedValue || 0), 0);

        const revenueGeneratingGuests = filteredGuests.filter(g => g.status === 'Booked' || g.status === 'Sent Rate');
        const avgRevenue = revenueGeneratingGuests.length > 0
            ? totalRevenue / revenueGeneratingGuests.length
            : 0;

        const totalBookings = filteredGuests.filter(g => g.status === 'Booked').length;

        // Status breakdown
        const statusData = statuses.map(s => ({
            name: s,
            value: filteredGuests.filter(g => g.status === s).length
        })).filter(d => d.value > 0);

        // Channel performance
        const channelData = channels.map(c => {
            const channelGuests = filteredGuests.filter(g => g.channel === c);
            const bookings = channelGuests.filter(g => g.status === 'Booked').length;
            const leads = channelGuests.length;
            return {
                name: c,
                bookings,
                leads,
                rate: leads > 0 ? ((bookings / leads) * 100).toFixed(1) : 0,
                revenue: channelGuests.filter(g => g.status === 'Booked' || g.status === 'Sent Rate').reduce((sum, g) => sum + Number(g.bookedValue || 0), 0)
            };
        }).filter(d => d.leads > 0).sort((a, b) => b.revenue - a.revenue);

        // Product performance
        const productData = products.map(p => {
            const productGuests = filteredGuests.filter(g => g.product === p);
            const bookings = productGuests.filter(g => g.status === 'Booked').length;
            const leads = productGuests.length;
            return {
                name: p,
                bookings,
                leads,
                rate: leads > 0 ? ((bookings / leads) * 100).toFixed(1) : 0,
                revenue: productGuests.filter(g => g.status === 'Booked' || g.status === 'Sent Rate').reduce((sum, g) => sum + Number(g.bookedValue || 0), 0)
            };
        }).filter(d => d.leads > 0).sort((a, b) => b.revenue - a.revenue);

        // Staff performance
        const staffData = staffMembers.map(s => {
            const staffGuests = filteredGuests.filter(g => g.staff === s);

            // Helper to check if lead was created in the selected timeframe
            const isCreatedInPeriod = (g) => {
                if (!g.createdAt) return false;
                if (timeFrame === 'day') return g.createdAt.startsWith(dateValue);
                if (timeFrame === 'month') {
                    const [y, m] = dateValue.split('-');
                    const d = new Date(g.createdAt);
                    return d.getFullYear() === parseInt(y) && (d.getMonth() + 1) === parseInt(m);
                }
                if (timeFrame === 'year') {
                    return g.createdAt.startsWith(dateValue);
                }
                return false;
            };

            const leadsInPeriod = staffGuests.filter(g => isCreatedInPeriod(g)).length;

            const weightedBookings = staffGuests.filter(g => g.status === 'Booked').reduce((total, g) => {
                return total + (isCreatedInPeriod(g) ? 1 : 0.1);
            }, 0);

            const bookings = staffGuests.filter(g => g.status === 'Booked').length;

            return {
                name: s,
                bookings,
                leads: leadsInPeriod,
                rate: leadsInPeriod > 0 ? ((weightedBookings / leadsInPeriod) * 100).toFixed(1) : 0,
                revenue: staffGuests.filter(g => g.status === 'Booked' || g.status === 'Sent Rate').reduce((sum, g) => sum + Number(g.bookedValue || 0), 0)
            };
        }).filter(d => d.leads > 0 || d.bookings > 0).sort((a, b) => b.revenue - a.revenue);

        // Average days from Sent Rate to Booked
        let totalDays = 0;
        let conversionCount = 0;

        const safeDate = (d) => {
            if (!d) return null;
            const date = new Date(d);
            return isNaN(date.getTime()) ? null : date;
        };

        filteredGuests.filter(g => g.status === 'Booked').forEach(guest => {
            const guestId = guest.id || guest.email;
            // Handle undefined followUps safely
            const guestFUs = (followUps || []).filter(fu => fu.guestId === guestId);

            // Determining START (Sent Rate)
            const sentRateFU = guestFUs
                .filter(fu => fu.status === 'Sent Rate')
                .sort((a, b) => {
                    const dateA = safeDate(a.timestamp || a.date);
                    const dateB = safeDate(b.timestamp || b.date);
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return dateA - dateB;
                })[0];

            const startTimestamp = guest.sentRateAt
                ? safeDate(guest.sentRateAt)
                : (sentRateFU ? safeDate(sentRateFU.timestamp || sentRateFU.date) : safeDate(guest.createdAt));

            // Determining END (Booked)
            const bookedFU = guestFUs
                .filter(fu => fu.status === 'Booked')
                .sort((a, b) => {
                    const dateA = safeDate(a.timestamp || a.date);
                    const dateB = safeDate(b.timestamp || b.date);
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return dateA - dateB;
                })[0];

            // Use bookedAt, -> bookedFU -> startTimestamp (0 days fallback) -> createdAt
            const endTimestamp = guest.bookedAt
                ? safeDate(guest.bookedAt)
                : (bookedFU ? safeDate(bookedFU.timestamp || bookedFU.date) : (startTimestamp || safeDate(guest.createdAt)));

            if (startTimestamp && endTimestamp) {
                const diffTime = endTimestamp - startTimestamp;
                const diffInDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
                // Avoid insane values (e.g. negative or years apart due to bad data) if necessary, but basic checks are here
                if (diffInDays >= 0 && diffInDays < 3650) { // Safety cap check
                    totalDays += diffInDays;
                    conversionCount++;
                }
            }
        });

        // If no conversions found, but we have bookings, it implies 0 days? Or just N/A?
        // User wants "working" numbers. If we have bookings, return 0.0 instead of N/A if calc failed.
        const avgConversionDays = conversionCount > 0
            ? (totalDays / conversionCount).toFixed(1)
            : (totalBookings > 0 ? '0.0' : 'N/A');

        // Best Lead Getter
        const bestStaffGetter = staffData.length > 0
            ? staffData.reduce((prev, current) => (prev.leads > current.leads) ? prev : current)
            : { name: 'N/A', leads: 0 };

        return {
            totalRevenue,
            avgRevenue,
            totalBookings,
            statusData,
            channelData,
            productData,
            staffData,
            bestStaffGetter,
            avgConversionDays
        };
    }, [filteredGuests, statuses, channels, products, staffMembers, followUps]);

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(212, 175, 55);
        doc.text("ISLATEL Guest CRM Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        if (dateValue) doc.text(`Period: ${timeFrame.toUpperCase()} - ${dateValue}`, 14, 36);

        // Summary
        doc.setFontSize(14);
        doc.setTextColor(212, 175, 55);
        doc.text("Executive Summary", 14, 46);

        doc.setFontSize(10);
        doc.setTextColor(60);
        doc.text(`Total Revenue: PHP ${analytics.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 14, 54);
        doc.text(`Total Bookings: ${analytics.totalBookings}`, 14, 60);
        doc.text(`Avg Time to Booking: ${analytics.avgConversionDays} Days`, 14, 66);

        const topProduct = analytics.productData.length > 0 ? analytics.productData[0] : { name: 'N/A' };
        const topStaff = analytics.staffData.length > 0 ? analytics.staffData[0] : { name: 'N/A' };

        autoTable(doc, {
            head: [["Performance Perspective", "Key Insight"]],
            body: [
                ["Avg Time to Booking", `${analytics.avgConversionDays} ${analytics.avgConversionDays !== 'N/A' ? 'Days' : ''}`],
                ["Top Lead Getter (Staff)", `${analytics.bestStaffGetter.name} (${analytics.bestStaffGetter.leads} Leads)`],
                ["Top Revenue Product", topProduct.name],
                ["Top Performing Staff", topStaff.name]
            ],
            startY: 72,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [44, 36, 26], textColor: [212, 175, 55] },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });

        if (filteredGuests.length > 0) {
            const tableColumn = ["Date", "Name", "Product", "Channel", "Staff", "Status", "Revenue"];
            const tableRows = filteredGuests.map(guest => [
                guest.checkIn || guest.createdAt || '-',
                guest.name || '-',
                guest.product || '-',
                guest.channel || '-',
                guest.staff || '-',
                guest.status === 'Sent Rate'
                    ? `Sent Rate (PHP ${Number(guest.bookedValue || 0).toLocaleString()})`
                    : guest.status === 'Booked'
                        ? `Booked (PHP ${Number(guest.bookedValue || 0).toLocaleString()})`
                        : (guest.status || '-'),
                guest.status === 'Booked' && guest.bookedValue
                    ? `${Number(guest.bookedValue).toLocaleString('en-PH')}`
                    : '-'
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: doc.lastAutoTable.finalY + 12,
                theme: 'striped',
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [212, 175, 55], textColor: [26, 22, 18] },
                alternateRowStyles: { fillColor: [245, 241, 232] }
            });

            // Channels
            let finalY = doc.lastAutoTable.finalY + 10;
            if (finalY > 240) { doc.addPage(); finalY = 20; }
            doc.setFontSize(12); doc.setTextColor(0);
            doc.text("Channel Performance Details", 14, finalY);

            const channelTableData = analytics.channelData.map(c => [
                c.name, c.leads, c.bookings, `${c.rate}%`, `${c.revenue.toLocaleString('en-PH')}`
            ]);

            autoTable(doc, {
                head: [["Channel", "Leads", "Bookings", "Rate", "Revenue"]],
                body: channelTableData,
                startY: finalY + 5,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [212, 175, 55], textColor: [26, 22, 18] }
            });

            // Products
            let productY = doc.lastAutoTable.finalY + 10;
            if (productY > 240) { doc.addPage(); productY = 20; }
            doc.setFontSize(12); doc.setTextColor(0);
            doc.text("Product Performance Details", 14, productY);

            const productTableData = analytics.productData.map(p => [
                p.name, p.leads, p.bookings, `${p.rate}%`, `${p.revenue.toLocaleString('en-PH')}`
            ]);

            autoTable(doc, {
                head: [["Product", "Leads", "Booked", "Rate", "Revenue"]],
                body: productTableData,
                startY: productY + 5,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [212, 175, 55], textColor: [26, 22, 18] }
            });

            // Staff
            let staffY = doc.lastAutoTable.finalY + 10;
            if (staffY > 240) { doc.addPage(); staffY = 20; }
            doc.setFontSize(12); doc.setTextColor(0);
            doc.text("Staff Performance Details", 14, staffY);

            const staffTableData = analytics.staffData.map(s => [
                s.name, s.leads, s.bookings, `${s.rate}%`, `${s.revenue.toLocaleString('en-PH')}`
            ]);

            autoTable(doc, {
                head: [["Staff", "Leads", "Bookings", "Rate", "Revenue"]],
                body: staffTableData,
                startY: staffY + 5,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [212, 175, 55], textColor: [26, 22, 18] }
            });
        }
        doc.save(`islatel-crm-report-${dateValue || 'all'}.pdf`);
    };

    return (
        <div>
            {/* Filters */}
            <div className="filter-bar mb-4 animate-slide-up">
                <Row className="g-3">
                    <Col md={1}>
                        <Form.Group>
                            <div className="filter-label">Range</div>
                            <Form.Select
                                value={timeFrame}
                                onChange={(e) => {
                                    setTimeFrame(e.target.value);
                                    if (e.target.value === 'day') setDateValue(new Date().toISOString().split('T')[0]);
                                    if (e.target.value === 'month') setDateValue(new Date().toISOString().slice(0, 7));
                                    if (e.target.value === 'year') setDateValue(new Date().getFullYear().toString());
                                }}
                                className="filter-control"
                            >
                                <option value="day">Day</option>
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Form.Group>
                            <div className="filter-label">{timeFrame.toUpperCase()}</div>
                            {timeFrame === 'year' ? (
                                <Form.Control
                                    type="number"
                                    min="2020"
                                    max="2100"
                                    value={dateValue}
                                    onChange={(e) => setDateValue(e.target.value)}
                                    className="filter-control"
                                />
                            ) : (
                                <Form.Control
                                    type={timeFrame === 'day' ? 'date' : 'month'}
                                    value={dateValue}
                                    onChange={(e) => setDateValue(e.target.value)}
                                    className="filter-control"
                                />
                            )}
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <div className="filter-label">Status</div>
                            <Form.Select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="filter-control"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <div className="filter-label">Product</div>
                            <Form.Select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="filter-control"
                            >
                                <option value="">All Products</option>
                                {products.map(p => <option key={p} value={p}>{p}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <div className="filter-label">Channel</div>
                            <Form.Select
                                value={selectedChannel}
                                onChange={(e) => setSelectedChannel(e.target.value)}
                                className="filter-control"
                            >
                                <option value="">All Channels</option>
                                {channels.map(c => <option key={c} value={c}>{c}</option>)}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
            </div>

            {/* Key Metrics */}
            <Row className="g-4 mb-4">
                <Col md={3} className="animate-slide-up delay-100">
                    <Card className="glass-card border-0 h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success shadow-sm">
                                    <FiTrendingUp size={24} />
                                </div>
                                <div>
                                    <div className="text-secondary text-uppercase small" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Total Revenue</div>
                                    <div className="h4 text-dark fw-bold mb-0">₱{analytics.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="animate-slide-up delay-200">
                    <Card className="glass-card border-0 h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary shadow-sm">
                                    <FiTarget size={24} />
                                </div>
                                <div>
                                    <div className="text-secondary text-uppercase small" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Total Bookings</div>
                                    <div className="h4 text-dark fw-bold mb-0">{analytics.totalBookings}</div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="animate-slide-up delay-300">
                    <Card className="glass-card border-0 h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning shadow-sm">
                                    <FiZap size={24} />
                                </div>
                                <div>
                                    <div className="text-secondary text-uppercase small" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Top Lead Getter</div>
                                    <div className="h4 text-dark fw-bold mb-0">{analytics.bestStaffGetter.name}</div>
                                    <small className="text-muted">{analytics.bestStaffGetter.leads} leads</small>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3} className="animate-slide-up delay-400">
                    <Card className="glass-card border-0 h-100">
                        <Card.Body>
                            <div className="d-flex align-items-center gap-3">
                                <div className="p-3 rounded-circle bg-info bg-opacity-10 text-info shadow-sm">
                                    <FiClock size={24} />
                                </div>
                                <div>
                                    <div className="text-secondary text-uppercase small" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Avg Days</div>
                                    <div className="h4 text-dark fw-bold mb-0">{analytics.avgConversionDays} {analytics.avgConversionDays !== 'N/A' && 'Days'}</div>
                                    <small className="text-muted">Rate to Booking</small>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Charts */}
            <Row className="g-4 mb-4">
                <Col md={6} className="animate-slide-up delay-400">
                    <Card className="glass-card border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom border-light border-opacity-10 py-3">
                            <h6 className="mb-0 fw-bold">Status Breakdown</h6>
                        </Card.Header>
                        <Card.Body>
                            {analytics.statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={analytics.statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#d4af37"
                                            stroke="none"
                                            dataKey="value"
                                        >
                                            {analytics.statusData.map((entry, index) => {
                                                const statusColors = {
                                                    'Booked': '#85a05c',
                                                    'Cancelled': '#c45a3c',
                                                    'Sent Rate': '#d4af37',
                                                    'Intent': '#c9a961'
                                                };
                                                return <Cell key={`cell-${index}`} fill={statusColors[entry.name] || COLORS[index % COLORS.length]} />;
                                            })}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(212,175,55,0.1)', color: '#2c241a' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-secondary py-5">No data available</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} className="animate-slide-up delay-500">
                    <Card className="glass-card border-0 shadow-sm">
                        <Card.Header className="bg-transparent border-bottom border-light border-opacity-10 py-3">
                            <h6 className="mb-0 fw-bold">Channel Performance</h6>
                        </Card.Header>
                        <Card.Body>
                            {analytics.channelData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={analytics.channelData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                                        <XAxis dataKey="name" stroke="#b8a88a" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#b8a88a" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(212,175,55,0.1)', color: '#2c241a' }} />
                                        <Bar dataKey="revenue" fill="#d4af37" radius={[4, 4, 0, 0]} name="Revenue (₱)" barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-secondary py-5">No data available</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Product & Staff Performance */}
            <Row className="g-4 mb-4">
                <Col md={6}>
                    <Card className="glass-card">
                        <Card.Header className="border-bottom border-light border-opacity-10">
                            <h6 className="mb-0">Product Performance</h6>
                        </Card.Header>
                        <Card.Body>
                            {analytics.productData.length > 0 ? (
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th className="text-light fw-bold">Product</th>
                                            <th className="text-light fw-bold text-center">Leads</th>
                                            <th className="text-light fw-bold text-center">Booked</th>
                                            <th className="text-light fw-bold text-center">Rate</th>
                                            <th className="text-light fw-bold text-end">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.productData.map((p, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-medium">{p.name}</td>
                                                <td className="text-center text-light opacity-75">{p.leads}</td>
                                                <td className="text-center text-light opacity-75">{p.bookings}</td>
                                                <td className="text-center">
                                                    <Badge bg="warning" className="fw-bold text-white px-3 py-1 border-0" style={{ borderRadius: '20px' }}>{p.rate}%</Badge>
                                                </td>
                                                <td className="text-end text-success">₱{p.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center text-secondary py-3">No data available</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="glass-card">
                        <Card.Header className="border-bottom border-light border-opacity-10">
                            <h6 className="mb-0">Staff Performance</h6>
                        </Card.Header>
                        <Card.Body>
                            {analytics.staffData.length > 0 ? (
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th className="text-light fw-bold">Staff</th>
                                            <th className="text-light fw-bold text-center">Leads</th>
                                            <th className="text-light fw-bold text-center">Booked</th>
                                            <th className="text-light fw-bold text-center">Rate</th>
                                            <th className="text-light fw-bold text-end">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analytics.staffData.map((s, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-medium">{s.name}</td>
                                                <td className="text-center text-light opacity-75">{s.leads}</td>
                                                <td className="text-center text-light opacity-75">{s.bookings}</td>
                                                <td className="text-center">
                                                    <Badge bg="warning" className="fw-bold text-white px-3 py-1 border-0" style={{ borderRadius: '20px' }}>{s.rate}%</Badge>
                                                </td>
                                                <td className="text-end text-success">₱{s.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center text-secondary py-3">No data available</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Export Section */}
            <Card className="glass-card">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h6 className="mb-2">Export Report</h6>
                            <p className="text-secondary small mb-0">
                                Download a comprehensive PDF report with all filtered data and analytics.
                            </p>
                        </Col>
                        <Col md={4} className="text-end">
                            <Button
                                variant="primary"
                                onClick={generatePDF}
                                className="d-flex align-items-center justify-content-center gap-2 ms-auto"
                                disabled={filteredGuests.length === 0}
                            >
                                <FiDownload /> Download PDF Report
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Reports;
