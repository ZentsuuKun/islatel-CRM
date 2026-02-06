import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, ListGroup } from 'react-bootstrap';
import { FiPlus, FiTrash2, FiSettings } from 'react-icons/fi';
import { useData } from '../context/DataContext';

const ItemManager = ({ title, items, onAdd, onDelete }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (newItem.trim()) {
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    return (
        <Card className="glass-card h-100">
            <Card.Header className="border-bottom border-light border-opacity-10">
                <h5 className="mb-0">{title}</h5>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleAdd} className="mb-3">
                    <div className="d-flex gap-2">
                        <Form.Control
                            placeholder={`Add new ${title.toLowerCase().slice(0, -1)}...`}
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            className="filter-control w-100"
                        />
                        <Button type="submit" variant="primary">
                            <FiPlus />
                        </Button>
                    </div>
                </Form>
                <ListGroup variant="flush" className="overflow-auto" style={{ maxHeight: '300px' }}>
                    {items.map((item, index) => (
                        <ListGroup.Item key={index} className="bg-transparent text-secondary d-flex justify-content-between align-items-center border-bottom border-light border-opacity-10">
                            {item}
                            <Button variant="link" className="text-danger p-0 delete-btn" onClick={() => onDelete(item)}>
                                <FiTrash2 size={16} />
                            </Button>
                        </ListGroup.Item>
                    ))}
                    {items.length === 0 && <div className="text-muted small text-center py-2">No items found.</div>}
                </ListGroup>
            </Card.Body>
        </Card>
    );
};

const Manage = () => {
    const { products, channels, staffMembers, addItem, deleteItem } = useData();

    return (
        <div>
            <div className="d-flex align-items-center mb-4 gap-3">
                <div className="p-2 rounded bg-primary bg-opacity-10 text-primary">
                    <FiSettings size={24} />
                </div>
                <div>
                    <h1 className="fw-bold mb-1">Manage Options</h1>
                    <p className="text-secondary mb-0">Configure your dropdowns and CRM settings.</p>
                </div>
            </div>

            <Row className="g-4">
                <Col md={4}>
                    <ItemManager
                        title="Products"
                        items={products}
                        onAdd={(item) => addItem('products', item)}
                        onDelete={(item) => deleteItem('products', item)}
                    />
                </Col>
                <Col md={4}>
                    <ItemManager
                        title="Sales Channels"
                        items={channels}
                        onAdd={(item) => addItem('channels', item)}
                        onDelete={(item) => deleteItem('channels', item)}
                    />
                </Col>
                <Col md={4}>
                    <ItemManager
                        title="Staff Members"
                        items={staffMembers}
                        onAdd={(item) => addItem('staff', item)}
                        onDelete={(item) => deleteItem('staff', item)}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default Manage;
