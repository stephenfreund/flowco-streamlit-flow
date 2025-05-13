import React, { useRef, useEffect, useState, useMemo, useCallback } from "react"

import {
    Streamlit,
} from "streamlit-component-lib"

import
isEqual from "lodash";

import differenceWith from "lodash";

import { FontSizeIcon, MagicWandIcon } from '@radix-ui/react-icons'
import { MdOutlineSmartToy } from "react-icons/md";

import { toPng } from 'html-to-image';
import ReactFlow, {
    Controls,
    ControlButton,
    Background,
    MiniMap,
    getOutgoers,
    getIncomers,
    getConnectedEdges,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    useNodesInitialized,
    useReactFlow,
    getNodesBounds,
    getViewportForBounds,
} from 'reactflow';

import 'reactflow/dist/style.css';
import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap-icons/font/bootstrap-icons.css";

import './style.css';

import { MarkdownInputNode, MarkdownOutputNode, MarkdownDefaultNode } from "./components/MarkdownNode";
import PaneConextMenu from "./components/PaneContextMenu";
import NodeContextMenu from "./components/NodeContextMenu";
import EdgeContextMenu from "./components/EdgeContextMenu";

import createElkGraphLayout from "./layouts/ElkLayout";
import { DrawingOverlay } from "./components/DrawingOverlay";

function arraysAreEqual(arr1, arr2) {
    return isEqual.isEqual(arr1, arr2);
}

const StreamlitFlowComponent = (props) => {

    const nodeTypes = useMemo(() => ({ input: MarkdownInputNode, output: MarkdownOutputNode, default: MarkdownDefaultNode }), []);

    const [viewFitAfterLayout, setViewFitAfterLayout] = useState(null);
    const [nodes, setNodes, onNodesChangeRaw] = useNodesState(props.args.nodes);
    const [edges, setEdges, onEdgesChangeRaw] = useEdgesState(props.args.edges);
    const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(props.args.timestamp);
    const [layoutNeedsUpdate, setLayoutNeedsUpdate] = useState(false);

    const [layoutCalculated, setLayoutCalculated] = useState(false);

    const [paneContextMenu, setPaneContextMenu] = useState(null);
    const [nodeContextMenu, setNodeContextMenu] = useState(null);
    const [edgeContextMenu, setEdgeContextMenu] = useState(null);

    const nodesInitialized = useNodesInitialized({ 'includeHiddenNodes': false });

    const [htmlPopup, setHtmlPopup] = useState(null);

    const ref = useRef(null);
    const reactFlowInstance = useReactFlow();
    const { fitView, getNodes, getEdges } = useReactFlow();

    // Helper Functions
    const handleLayout = () => {
        createElkGraphLayout(getNodes(), getEdges(), props.args.layoutOptions)
            .then(({ nodes, edges }) => {
                setNodes(nodes);
                setEdges(edges);
                setViewFitAfterLayout(false);
                handleDataReturnToStreamlit(nodes, edges, null);
                setLayoutCalculated(true);
            })
            .catch(err => console.log(err));
    }

    const handleDataReturnToStreamlit = (_nodes, _edges, selectedId, command = null) => {

        const timestamp = (new Date()).getTime();
        setLastUpdateTimestamp(timestamp);
        Streamlit.setComponentValue({ 'nodes': _nodes, 'edges': _edges, 'selectedId': selectedId, 'timestamp': timestamp, 'command': command });
    }



    // wrap onNodesChange so we can catch resize events
    const onNodesChange = useCallback((changes) => {
        onNodesChangeRaw(changes);
        if (changes.length === 1 && changes[0].type === 'dimensions' && !changes[0].resizing) {
            handleDataReturnToStreamlit(getNodes(), getEdges(), changes[0].id);
        }
    }, [onNodesChangeRaw, getNodes, getEdges, handleDataReturnToStreamlit]);

    // wrap onNodesChange so we can catch resize events
    const onEdgesChange = useCallback((changes) => {
        onEdgesChangeRaw(changes);
        handleDataReturnToStreamlit(getNodes(), getEdges(), null);
    }, [onEdgesChangeRaw, getNodes, getEdges, handleDataReturnToStreamlit]);


    const calculateMenuPosition = (event) => {
        const pane = ref.current.getBoundingClientRect();
        return {
            top: event.clientY < pane.height - 200 && event.clientY,
            left: event.clientX < pane.width - 200 && event.clientX,
            right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
            bottom: event.clientY >= pane.height - 200 && pane.height - event.clientY,
        }
    }

    const clearMenus = () => {
        setPaneContextMenu(null);
        setNodeContextMenu(null);
        setEdgeContextMenu(null);
    }

    useEffect(() => {
        function hideError(e) {
            if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
                const resizeObserverErrDiv = document.getElementById(
                    'webpack-dev-server-client-overlay-div'
                );
                const resizeObserverErr = document.getElementById(
                    'webpack-dev-server-client-overlay'
                );
                if (resizeObserverErr) {
                    resizeObserverErr.setAttribute('style', 'display: none');
                }
                if (resizeObserverErrDiv) {
                    resizeObserverErrDiv.setAttribute('style', 'display: none');
                }
                console.log('ResizeObserver loop completed with undelivered notifications.');
            }
        }

        window.addEventListener('error', hideError)
        return () => {
            window.addEventListener('error', hideError)
        }
    }, [])


    useEffect(() => Streamlit.setFrameHeight());



    // build the exact ELK settings you listed
    const elkOptions = useMemo(() => (
        {
        'elk.algorithm': 'org.eclipse.elk.mrtree',
        // 'elk.direction': 'DOWN',
        // 'elk.spacing.nodeNode': 75,
        // 'elk.layered.spacing.nodeNodeBetweenLayers': 100,
        // 'elk.'
        // 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    }
), [
        props.args.direction,
        props.args.nodeNodeSpacing,
        props.args.nodeLayerSpacing
    ]);

    // generic “run one layout” helper:
    const performLayoutOnce = useCallback((
        layoutFn = createElkGraphLayout,
        options = { elkOptions }
    ) => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();

        console.log("Beep")

        layoutFn(currentNodes, currentEdges, options)
            .then(({ nodes: newNodes, edges: newEdges }) => {
                setNodes(newNodes);
                setEdges(newEdges);
                setViewFitAfterLayout(false);
                handleDataReturnToStreamlit(newNodes, newEdges, null);
                setLayoutCalculated(true);
            })
            .catch(err => console.error("layout failed", err));
    }, [
        getNodes, getEdges,
        setNodes, setEdges,
        setViewFitAfterLayout,
        handleDataReturnToStreamlit
    ]);



    // Update elements if streamlit sends new arguments - check by comparing timestamp recency
    useEffect(() => {
        if (lastUpdateTimestamp <= props.args.timestamp) {
            if (!arraysAreEqual(nodes, props.args.nodes) || !arraysAreEqual(edges, props.args.edges)) {
                if (props.args.nodes.filter(node => !node.id.startsWith('output-')).every(node => node.position.x === 0 && node.position.y === 0)) {
                    performLayoutOnce();
                }
    
                setLayoutNeedsUpdate(true);
                setLastUpdateTimestamp((new Date()).getTime());
                setNodes(props.args.nodes);
                setEdges(props.args.edges);
                const selectedId =
                    props.args.nodes.find(node => node.selected)?.id || null;
                handleDataReturnToStreamlit(props.args.nodes, props.args.edges, selectedId);
            }
        }

    }, [props.args.nodes, props.args.edges]);

    // Handle layout when streamlit sends new state
    useEffect(() => {
        if (layoutNeedsUpdate) {
            setLayoutNeedsUpdate(false);
            setLayoutCalculated(false);
        }
    }, [nodes, edges])

    // Auto zoom callback
    useEffect(() => {
        if (!viewFitAfterLayout && props.args.fitView) {
            fitView();
            setViewFitAfterLayout(true);
        }
    }, [viewFitAfterLayout, props.args.fitView]);

    // Theme callback
    useEffect(() => {
        setEdges(edges.map(edge => ({ ...edge, labelStyle: { 'fill': props.theme.base === "dark" ? 'white' : 'black' } })))
    }, [props.theme.base])

    // Context Menu Callbacks

    const handlePaneContextMenu = (event) => {
        event.preventDefault();

        setNodeContextMenu(null);
        setEdgeContextMenu(null);

        setPaneContextMenu({
            ...calculateMenuPosition(event),
            clickPos: reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY
            })
        });
    }

    const handleNodeContextMenu = (event, node) => {
        event.preventDefault();

        setPaneContextMenu(null);
        setEdgeContextMenu(null);

        setNodeContextMenu({
            node: node,
            ...calculateMenuPosition(event)
        })
    }

    const handleEdgeContextMenu = (event, edge) => {
        event.preventDefault();

        setPaneContextMenu(null);
        setNodeContextMenu(null);

        setEdgeContextMenu({
            edge: edge,
            ...calculateMenuPosition(event)
        })
    }

    // Flow interaction callbacks

    // const handlePaneClick = (event) => {
    //     clearMenus();
    //     handleDataReturnToStreamlit(nodes, edges, null);
    // }

    const handleNodeClick = useCallback((event, node) => {
        clearMenus();
        // if Shift is down, show htmlPopup and bail out
        if (event.shiftKey) {
            console.log(node.id)
            if (!node.id.startsWith('output-')) {
                setHtmlPopup(node.data.html);
            } else {
                const origin = nodes.find(n => n.id === node.id.replace('output-', ''));
                if (origin) {
                    origin.data = { ...origin.data, command: 'inspect' };
                    const updatedNodes = nodes.map(n => n.id === origin.id ? origin : n);
                    setNodes(updatedNodes);
                    handleDataReturnToStreamlit(updatedNodes, edges, origin.id,
                        {
                            'command': 'inspect',
                            'id': origin.id,
                        }
                    );
                }
            }
        } else {
            // otherwise fall back to your old behavior
            if (props.args.getNodeOnClick) {
                handleDataReturnToStreamlit(nodes, edges, node.id);
            }
        }
    }, [clearMenus, props.args.getNodeOnClick, nodes, edges, handleDataReturnToStreamlit]);

    const handlePaneClick = (event) => {
        clearMenus();
        setHtmlPopup(null);           // ← clear the popup
        handleDataReturnToStreamlit(nodes, edges, null);
    }

    // const handleNodeClick = (event, node) => {
    //     clearMenus();
    //     if (props.args.getNodeOnClick)
    //         handleDataReturnToStreamlit(nodes, edges, node.id);
    // }

    const handleEdgeClick = (event, edge) => {
        clearMenus();
        if (props.args.getEdgeOnClick)
            handleDataReturnToStreamlit(nodes, edges, edge.id);
    }


    const handleConnect = (params) => {
        const newEdgeId = `st-flow-edge_${params.source}-${params.target}`;
        const newEdges = addEdge({ ...params, animated: props.args["animateNewEdges"], labelShowBg: false, id: newEdgeId }, edges);
        setEdges(newEdges);
        handleDataReturnToStreamlit(nodes, newEdges, newEdgeId);
    }

    const handleNodeDragStop = (event, node) => {
        const updatedNodes = nodes.map(n => {
            if (n.id === node.id)
                return node;
            return n;
        });
        handleDataReturnToStreamlit(updatedNodes, edges, null);
    }

    const isValidConnection = (connection) => {
        // we are using getNodes and getEdges helpers here
        // to make sure we create isValidConnection function only once
        const nodes = getNodes();
        const edges = getEdges();

        // if edge already exists, don't allow to create it
        if (edges.some((edge) => edge.source === connection.source && edge.target === connection.target)) {
            return false;
        }

        const target = nodes.find((node) => node.id === connection.target);
        const hasCycle = (node, visited = new Set()) => {
            if (visited.has(node.id)) return false;

            visited.add(node.id);

            for (const outgoer of getOutgoers(node, nodes, edges)) {
                if (outgoer.id === connection.source) return true;
                if (hasCycle(outgoer, visited)) return true;
            }
        };

        if (target.id === connection.source) return false;
        return !hasCycle(target);
    }

    const onNodesDelete = (deleted) => {
        setEdges(
            deleted.reduce((acc, node) => {
                const incomers = getIncomers(node, nodes, edges);
                const outgoers = getOutgoers(node, nodes, edges);
                const connectedEdges = getConnectedEdges([node], edges);

                const remainingEdges = acc.filter(
                    (edge) => !connectedEdges.includes(edge),
                );

                const createdEdges = incomers.flatMap(({ id: source }) =>
                    outgoers.map(({ id: target }) => ({
                        id: `${source}->${target}`,
                        source,
                        target,
                    })),
                );

                return [...remainingEdges, ...createdEdges];
            }, edges),
        );
    }

    const overlayRef = useRef(null);
    const wrapperRef = useRef(null)

    const handleSave = async () => {
        const imageWidth = 1024;
        const imageHeight = 768;
        // 1) figure out the viewport transform you want
        const nodes = getNodes()
        const nodesBounds = getNodesBounds(nodes)

        // 2) ask overlay where the ink lives
        const drawBounds = overlayRef.current.getDrawingBounds();

        // 3) if there is ink, union the rectangles:
        const unionBounds = drawBounds
            ? {
                x: Math.min(nodesBounds.x, drawBounds.x),
                y: Math.min(nodesBounds.y, drawBounds.y),
                width: Math.max(
                    nodesBounds.x + nodesBounds.width,
                    drawBounds.x + drawBounds.width
                ) - Math.min(nodesBounds.x, drawBounds.x),
                height: Math.max(
                    nodesBounds.y + nodesBounds.height,
                    drawBounds.y + drawBounds.height
                ) - Math.min(nodesBounds.y, drawBounds.y),
            }
            : nodesBounds;



        const vp = getViewportForBounds(unionBounds, imageWidth, imageHeight) // 0.5, 2)
        // 2) snapshot the *entire* wrapper at that transform
        const dataUrl = await toPng(wrapperRef.current, {
            width: imageWidth,
            height: imageHeight,
            backgroundColor: '#fff',
            style: {
                transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
                transformOrigin: 'top left',
                width: imageWidth,
                height: imageHeight,
            },
            filter: (node) => {
                if (!node.classList) return true
                const cls = node.classList
                
                if (node.tagName === 'IMG') {
                    const imageUrl = new URL(node.src);
                    if (imageUrl.hostname !== window.location.hostname || imageUrl.port !== window.location.port) {
                        console.warn('External image:', node.src);
                        return false;
                    }
                }
                
                if (
                    cls.contains('react-flow__minimap') ||  // hide MiniMap
                    cls.contains('react-flow__controls') ||  // hide Controls
                    cls.contains('react-flow__background')   // hide grid dots
                ) {
                    return false
                }
                return true
            }
        }).then((dataUrl) => {
            handleClear();
            return dataUrl;
        });
        console.log(dataUrl)  // this PNG now has both your Flow and the overlay
        handleDataReturnToStreamlit(nodes, edges, null, { 'command': 'sketch', 'dataUrl': dataUrl });
    }


    const handleClear = () => {
        overlayRef.current.clear();
    };

    const grabOverlay = () => {
        handleSave();
    }

    return (
        <div ref={wrapperRef} style={{ height: '100vh', width: '100vw' }}>
            <DrawingOverlay ref={overlayRef} penColor="red" lineWidth={1}>
                <ReactFlow
                    nodeTypes={nodeTypes}
                    ref={ref}
                    nodes={nodes}
                    onNodesChange={onNodesChange}
                    onNodeDragStop={handleNodeDragStop}
                    edges={edges}
                    onEdgesChange={onEdgesChange}
                    onConnect={props.args.allowNewEdges ? handleConnect : null}
                    isValidConnection={isValidConnection}
                    fitView={props.args.fitView}
                    style={props.args.style}
                    onNodeClick={handleNodeClick}
                    onNodeDoubleClick={handleNodeContextMenu}
                    onNodesDelete={onNodesDelete}
                    
                    onEdgeClick={handleEdgeClick}
                    onNodeDragStart={clearMenus}
                    onPaneClick={handlePaneClick}
                    onPaneContextMenu={props.args.enablePaneMenu ? handlePaneContextMenu : (event) => { }}
                    onNodeContextMenu={props.args.enableNodeMenu ? handleNodeContextMenu : (event, node) => { }}
                    onEdgeContextMenu={props.args.enableEdgeMenu ? handleEdgeContextMenu : (event, edge) => { }}
                    panOnDrag={props.args.panOnDrag}
                    zoomOnDoubleClick={props.args.allowZoom}
                    zoomOnScroll={props.args.allowZoom}
                    zoomOnPinch={props.args.allowZoom}
                    minZoom={props.args.minZoom}
                    proOptions={{ hideAttribution: props.args.hideWatermark }}>
                    {/* /* edgesUpdatable={!disabled}
                    edgesFocusable={!disabled}
                    nodesDraggable={!disabled}
                    nodesConnectable={!disabled}
                    nodesFocusable={!disabled}
                    draggable={!disabled}
                    panOnDrag={!disabled}
                    elementsSelectable={!disabled} */}
                    <Background />
                    {paneContextMenu && <PaneConextMenu
                        paneContextMenu={paneContextMenu}
                        setPaneContextMenu={setPaneContextMenu}
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        handleDataReturnToStreamlit={handleDataReturnToStreamlit}
                        setLayoutCalculated={() => performLayoutOnce(createElkGraphLayout, { elkOptions })}
                        theme={props.theme}
                    />
                    }
                    {nodeContextMenu && <NodeContextMenu
                        nodeContextMenu={nodeContextMenu}
                        setNodeContextMenu={setNodeContextMenu}
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        handleDataReturnToStreamlit={handleDataReturnToStreamlit}
                        theme={props.theme}
                    />
                    }
                    {edgeContextMenu && <EdgeContextMenu
                        edgeContextMenu={edgeContextMenu}
                        setEdgeContextMenu={setEdgeContextMenu}
                        nodes={nodes}
                        edges={edges}
                        setEdges={setEdges}
                        handleDataReturnToStreamlit={handleDataReturnToStreamlit}
                        theme={props.theme} />}
                    {props.args["showControls"] && <Controls showInteractive={false} style={{ top: 10, left: 10, right: 'auto', bottom: 'auto' }}>
                        <ControlButton onClick={grabOverlay} title="Save as PNG">
                            <MdOutlineSmartToy/>
                        </ControlButton>

                    </Controls>}
                    {props.args["showMiniMap"] && <MiniMap pannable zoomable
                        style={{ top: 10, left: 'auto', right: 10, bottom: 'auto' }}
                    />}
                </ReactFlow>
                {htmlPopup && (
                    <div
                        className="html-popup-overlay"
                        onClick={() => setHtmlPopup(null)}
                    >
                        <div
                            className="html-popup-content"
                            dangerouslySetInnerHTML={{ __html: htmlPopup }}
                        />
                    </div>
                )}
            </DrawingOverlay>
        </div>
    );
}

const ContextualStreamlitFlowComponent = (props) => {
    return (
        <ReactFlowProvider>
            <StreamlitFlowComponent {...props} />
        </ReactFlowProvider>
    );
}

export default ContextualStreamlitFlowComponent;
