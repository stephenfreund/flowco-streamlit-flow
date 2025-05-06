import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/esm/ButtonGroup';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const EditNodeModal = ({ show, node, handleClose, theme, setNodeContextMenu, setModalClosing, setNodes, nodes, edges, handleDataReturnToStreamlit }) => {

    const [editedNode, setEditedNode] = useState(node);
    const allowTypeChange = edges.filter(edge => edge.source === editedNode.id || edge.target === editedNode.id).length === 0;

    const onExited = (e) => {
        setModalClosing(true);
        setNodeContextMenu(null);
    }

    const onPillContentChange = (e) => {
        const pill = 
            e.target.value
                .replace(/[^a-zA-Z0-9]/g, '-')
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('-');
        setEditedNode((editedNode) => ({ ...editedNode, data: { ...editedNode.data, pill: pill } }));
    };

    const onNodeContentChange = (e) => {
        setEditedNode((editedNode) => ({ ...editedNode, data: { ...editedNode.data, content: e.target.value } }));
    };

    const handleSaveChanges = (e) => {
        const updatedNodes = nodes.map(n => n.id === editedNode.id ? editedNode : n);
        setNodes(updatedNodes);
        handleDataReturnToStreamlit(updatedNodes, edges, null);
        setNodeContextMenu(null);
    };

    return (
        <Modal show={show} onHide={handleClose} data-bs-theme={theme} onExited={onExited}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Node</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row className='g-2'>
                    <Col md>
                        <FloatingLabel controlId="floatingInput" label="Title">
                            <Form.Control type="text" placeholder="nodeContent" value={editedNode.data.pill} autoFocus onChange={onPillContentChange} />
                        </FloatingLabel>
                    </Col>
                </Row>
                <Row className='g-2'>
                    <Col md>
                        <FloatingLabel controlId="floatingInput" label="Description">
                            <Form.Control type="text" as="textarea" style={{ height: '100px' }} placeholder="nodeContent" value={editedNode.data.content} autoFocus onChange={onNodeContentChange} />
                        </FloatingLabel>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleSaveChanges}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>);
};

const NodeContextMenu = ({ nodeContextMenu, nodes, edges, setNodeContextMenu, setNodes, setEdges, theme, handleDataReturnToStreamlit }) => {

    const [showModal, setShowModal] = useState(false);
    const [modalClosing, setModalClosing] = useState(false);

    const handleClose = () => {
        setShowModal(false);
        setModalClosing(true);
    };

    const handleShow = () => setShowModal(true);

    const handleEditNode = (e) => {
        handleShow();
    }

    function handleCommand(cmd) {
        return (e) => {
            handleDataReturnToStreamlit(nodes, edges, null, {
                'command': cmd,
                'id': nodeContextMenu.node.id,
            });
            setNodeContextMenu(null);
        }
    }

    const handleDeleteNode = (e) => {
        if (nodeContextMenu.node.deletable) {
            const updatedNodes = nodes.filter(node => node.id !== nodeContextMenu.node.id)
            const updatedEdges = edges.filter(edge => edge.source !== nodeContextMenu.node.id && edge.target !== nodeContextMenu.node.id)
            setNodes(updatedNodes);
            setEdges(updatedEdges);
            handleDataReturnToStreamlit(updatedNodes, updatedEdges, null);
        }
        setNodeContextMenu(null);
    }

    return (
        <>
            <div style={{
                position: 'absolute',
                top: nodeContextMenu.top,
                left: nodeContextMenu.left,
                right: nodeContextMenu.right,
                bottom: nodeContextMenu.bottom,
                backgroundColor: 'white',
                borderRadius: '8px',
                alignItems: 'left',
                textAlign: 'left',
                zIndex: 10
            }}>
                {(!showModal && !modalClosing) && <ButtonGroup vertical>
                    <Button variant="outline-primary" onClick={handleEditNode} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-pencil-square"></i> Quick Edit</Button>

                    { nodeContextMenu.node.data.editable && <Button variant="outline-primary" onClick={handleCommand("edit")} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-pencil-square"></i> Edit</Button>}
                    { !nodeContextMenu.node.data.editable && <Button variant="outline-primary" onClick={handleCommand("edit")} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-arrow-clockwise"></i> Update</Button>}

                    { !nodeContextMenu.node.data.locked && <Button variant="outline-primary" onClick={handleCommand("lock")} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-lock"></i> Lock</Button> }
                    { nodeContextMenu.node.data.locked && <Button variant="outline-primary" onClick={handleCommand("unlock")} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-unlock"></i> Unlock</Button> }                    
                    <span className="btn-divider" />
                    { !nodeContextMenu.node.data.show_output && <Button variant="outline-success" onClick={handleCommand("show")} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-eye"></i> Show Output</Button> }
                    { nodeContextMenu.node.data.show_output && <Button variant="outline-success" onClick={handleCommand("hide")} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-eye-slash"></i> Hide Output</Button> }
                    <Button variant="outline-success" onClick={handleCommand("run")} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-play"></i>Run </Button>
                    <span className="btn-divider" />
                    <Button variant={nodeContextMenu.node.deletable ? "outline-danger" : "secondary"} onClick={handleDeleteNode} disabled={!nodeContextMenu.node.deletable}><i className="bi bi-trash3"></i> Delete Node</Button>

                </ButtonGroup>}
            </div>
            <EditNodeModal show={showModal}
                node={nodeContextMenu.node}
                nodes={nodes}
                edges={edges}
                handleClose={handleClose}
                theme={theme.base}
                setNodeContextMenu={setNodeContextMenu}
                setModalClosing={setModalClosing}
                setNodes={setNodes}
                handleDataReturnToStreamlit={handleDataReturnToStreamlit}
            />
        </>
    );
};

export default NodeContextMenu;