import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

const handlePosMap = {
    'top': Position.Top,
    'right': Position.Right,
    'bottom': Position.Bottom,
    'left': Position.Left,
};

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeHighlight, rehypeRaw, rehypeKatex];

const MemoizedMarkdown = memo(({ content }) => (
    <Markdown 
        rehypePlugins={rehypePlugins} 
        remarkPlugins={remarkPlugins}
    >
        {content}
    </Markdown>
));

const MarkdownInputNode = ({ data, sourcePosition, selected }) => {
    
    const position = handlePosMap[sourcePosition] || Position.Right;
    
    return (
        <>
            <Handle type="source" position={position} isConnectable />
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={30}
            />
            <div style= {{ overflow: 'hidden' }}>
                <div className="markdown-node">
                    <MemoizedMarkdown content={data.content} />
                </div>
            </div>
        </>
    );
};

const MarkdownOutputNode = ({ data, targetPosition, selected }) => {

    const position = handlePosMap[targetPosition] || Position.Left;
    
    return (
        <>
            <Handle type="target" position={position} isConnectable />
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={30}
            />
            <div style= {{ overflow: 'hidden' }}>
                <div className="markdown-node">
                    <MemoizedMarkdown content={data.content} />
                </div>
            </div>
        </>
    );
};

const MarkdownDefaultNode = ({ data, sourcePosition, targetPosition, selected }) => {

    const sourcePos = handlePosMap[sourcePosition] || Position.Right;
    const targetPos = handlePosMap[targetPosition] || Position.Left;
    
    return (
        <>
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={30}
            />
            <Handle type="source" position={sourcePos} isConnectable />
            <div style= {{ overflow: 'hidden' }}>
                <div className="markdown-node">
                    <MemoizedMarkdown content={data.content} />
                </div>
            </div>
            <Handle type="target" position={targetPos} isConnectable />
        </>
    );
};

export { MarkdownInputNode, MarkdownOutputNode, MarkdownDefaultNode }