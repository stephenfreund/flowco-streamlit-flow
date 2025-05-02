// MarkdownFlowNodes.jsx
import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position, NodeResizer } from 'reactflow';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

const handlePosMap = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeHighlight, rehypeRaw, rehypeKatex];

const MemoizedMarkdown = memo(({ content }) => (
    <Markdown rehypePlugins={rehypePlugins} remarkPlugins={remarkPlugins}>
        {content}
    </Markdown>
));

function BlinkingWrapper({ blinkText, children }) {
    return (
        <div className="markdown-node-wrapper">
            {blinkText && <div className="blinking-text">{blinkText}</div>}
            {children}
        </div>
    );
}

function getContent(data) {
    if (data.pill) {
        return `###### ${data.pill}\n\n${data.content}`;
    }
    return data.content;
}

export function MarkdownFlowNode({ data, sourcePosition, targetPosition, selected }) {
    const [showPopup, setShowPopup] = useState(false);
    const timerRef = useRef(null);
    const mouseInRef = useRef(false);
    const srcPos = sourcePosition && handlePosMap[sourcePosition];
    const tgtPos = targetPosition && handlePosMap[targetPosition];

    const onMouseEnter = useCallback(() => {
        console.log('mouse enter');
        mouseInRef.current = true;
        timerRef.current = window.setTimeout(() => {
            console.log('show popup');
            if (mouseInRef.current) {
                setShowPopup(true);
            }
        timerRef.current = null;
        }, 500);
    }, []);

    // Cancel timer if mouse leaves early
    const onMouseLeave = useCallback(() => {
        console.log('mouse leave');
        mouseInRef.current = false;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Cancel timer if mouse leaves early
    const onMouseDown = useCallback(() => {
        console.log('mouse down');
        mouseInRef.current = false;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const onMouseMove = useCallback(() => {
        console.log('mouse move');
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            timerRef.current = window.setTimeout(() => {
                if (mouseInRef.current) {
                    console.log('show move popup');
                    setShowPopup(true);
                }
                timerRef.current = null;
            }, 500);
        }
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Find the React Flow container to portal into
    const flowContainer = document.querySelector("div[id='root']")

    return (
        <>
            <div
                className="markdown-node-hover-container"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onMouseMove={onMouseMove}
                onMouseDownCapture={onMouseDown} 
                onMouseUpCapture={onMouseDown}
                >
                   {data.locked && (
                     <i
                       className="bi bi-lock-fill lock-icon"
                       title="Locked"
                     />
                   )}
                   <NodeResizer
                    color="#ff0071"
                    isVisible={selected}
                    minWidth={100}
                    minHeight={30}
                />

                {srcPos && <Handle type="source" position={srcPos}  />}

                <BlinkingWrapper blinkText={data.blinkText}>
                    <div className={`markdown-node ${data.kind === 'plot' ? 'markdown-node-plot' : ''}`}>
                        <MemoizedMarkdown content={getContent(data)} />
                    </div>
                </BlinkingWrapper>

                {tgtPos && <Handle type="target" position={tgtPos}  />}
            </div>

            {showPopup && flowContainer && ReactDOM.createPortal(
                <div
                    className="node-popup-overlay"
                    onClick={() => setShowPopup(false)}
                    dangerouslySetInnerHTML={{ __html: data.html }}
                />,
                flowContainer
            )}
        </>
    );
}

// Input node: only source handle
export const MarkdownInputNode = ({ data, selected }) => (
    <MarkdownFlowNode
        data={data}
        sourcePosition={Position.Right}
        selected={selected}
    />
);

// Default node: both handles
export const MarkdownDefaultNode = ({ data, selected }) => (
    <MarkdownFlowNode
        data={data}
        sourcePosition={Position.Right}
        targetPosition={Position.Left}
        selected={selected}
    />
);

// Output node: only target handle
export const MarkdownOutputNode = ({ data, selected }) => (
    <MarkdownFlowNode
        data={data}
        targetPosition={Position.Left}
        selected={selected}
    />
);
