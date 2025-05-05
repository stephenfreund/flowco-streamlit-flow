// MarkdownFlowNodes.jsx
import React, { memo, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Handle, Position, NodeResizer, } from 'reactflow';
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


function getContent(data) {
    if (data.pill) {
        return `###### ${data.pill}\n\n${data.content}`;
    }
    return data.content;
}

export function MarkdownFlowNode({ data, sourcePosition, targetPosition, selected }) {
    // const [showPopup, setShowPopup] = useState(false);
    const srcPos = sourcePosition && handlePosMap[sourcePosition];
    const tgtPos = targetPosition && handlePosMap[targetPosition];

    // // 1) Shift‑click to show, 2) any click while visible hides
    // const onContainerClick = useCallback(
    //     (e) => {
    //         if (!data['html']) {
    //             data['command'] = 'inspect';
    //         } else if (showPopup) {
    //             setShowPopup(false);
    //         } else if (e.shiftKey) {
    //             setShowPopup(true);
    //         }
    //     },
    //     [showPopup]
    // );


    // Find the React Flow container to portal into
    const flowContainer = document.querySelector("div[id='root']")

    return (
        <>
            <div
                className="markdown-node-hover-container"
            >
                {data.blinkText && (<span className="blinking-text">{data.blinkText}</span>)}

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
                    minHeight={50}
                />

                {srcPos && <Handle type="source" position={srcPos} />}

                <div className={`markdown-node ${data.kind === 'plot' ? 'markdown-node-plot' : ''}`}>
                    <MemoizedMarkdown content={getContent(data)} />
                </div>

                {tgtPos && <Handle type="target" position={tgtPos} />}
            </div>

            {/* {showPopup && flowContainer && ReactDOM.createPortal(
                <div
                    className="node-popup-overlay"
                    onClick={() => setShowPopup(false)}
                    dangerouslySetInnerHTML={{ __html: data.html }}
                />,
                flowContainer
            )} */}
        </>
    );
}

// Input node: only source handle
export const MarkdownInputNode = ({ data, selected }) => (
    <MarkdownFlowNode
        data={data}
        sourcePosition={Position.Bottom}
        selected={selected}
    />
);

// Default node: both handles
export const MarkdownDefaultNode = ({ data, selected }) => (
    <MarkdownFlowNode
        data={data}
        sourcePosition={Position.Bottom}
        targetPosition={Position.Top}
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
