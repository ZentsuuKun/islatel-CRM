import React from 'react';
import { Card, Table, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { FiSearch, FiFilter, FiPlus, FiMoreVertical, FiUsers } from 'react-icons/fi';

const Customers = () => {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="fw-bold text-white mb-1 d-flex align-items-center gap-2"><FiUsers className="text-warning" />Customers</h1>
                    <p className="text-secondary mb-0">Manage your relationships and contacts.</p>
                </div>
                <Button variant="primary" className="d-flex align-items-center gap-2">
                    <FiPlus />
                    Add Customer
                </Button>
            </div>

            <Card className="glass-card mb-4">
                <Card.Body>
                    <div className="d-flex gap-3 mb-4">
                        <InputGroup className="glass-input-group" style={{ maxWidth: '300px' }}>
                            <InputGroup.Text className="bg-transparent border-end-0 text-secondary">
                                <FiSearch />
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Search customers..."
                                className="bg-transparent border-start-0 text-white shadow-none ps-0"
                            />
                        </InputGroup>
                        <Button variant="outline-secondary" className="d-flex align-items-center gap-2 text-white border-secondary border-opacity-25">
                            <FiFilter /> Filter
                        </Button>
                    </div>

                    <Table responsive hover className="table-borderless mb-0 align-middle">
                        <thead>
                            <tr>
                                <th className="ps-4">Name</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Last Active</th>
                                <th>Email</th>
                                <th>Spent</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody id='dboard'>
                            {[
                                { name: 'Alice Freeman', company: 'Fusion Dynamics', status: 'Active', active: '2 min ago', email: 'alice@fusion.com', spent: '$12,500' },
                                { name: 'Bob Smith', company: 'Global Corp', status: 'Inactive', active: '3 days ago', email: 'bob@global.com', spent: '$2,300' },
                                { name: 'Charlie Kim', company: 'InnovateOne', status: 'Lead', active: '1 hr ago', email: 'ckim@innovate.com', spent: '$0' },
                                { name: 'Diana Prince', company: 'Shield Systems', status: 'Active', active: '5 min ago', email: 'diana@shield.com', spent: '$45,000' },
                                { name: 'Eve Polastri', company: 'MI6', status: 'Churned', active: '1 week ago', email: 'eve@mi6.uk', spent: '$8,200' },
                            ].map((row, i) => (
                                <tr key={i}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold`}
                                                style={{ width: '36px', height: '36px', background: `hsl(${Math.random() * 360}, 70%, 60%)` }}>
                                                {row.name.charAt(0)}
                                            </div>
                                            <div className="fw-medium text-white">{row.name}</div>
                                        </div>
                                    </td>
                                    <td className="text-secondary">{row.company}</td>
                                    <td>
                                        <Badge
                                            bg={row.status === 'Active' ? 'success' : row.status === 'Inactive' ? 'secondary' : row.status === 'Lead' ? 'info' : 'danger'}
                                            className="fw-normal px-2 py-1 bg-opacity-25 text-white"
                                            style={{ opacity: 0.9 }}
                                        >
                                            {row.status}
                                        </Badge>
                                    </td>
                                    <td className="text-secondary small">{row.active}</td>
                                    <td className="text-secondary">{row.email}</td>
                                    <td className="font-monospace text-white">{row.spent}</td>
                                    <td className="text-end pe-4">
                                        <Button variant="link" className="text-secondary p-0">
                                            <FiMoreVertical />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Customers;
