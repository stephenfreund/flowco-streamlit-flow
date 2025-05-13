// MarkdownFlowNodes.jsx
import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

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
  const srcPos = sourcePosition;
  const tgtPos = targetPosition;

  return (
    <>
      <div className={` markdown-node-hover-container ${data.has_messages ? 'has-messages' : ''}`}>
        {data.blinkText && <span className="blinking-text">{data.blinkText}</span>}

        {data.locked && (
          <i className="bi bi-lock-fill lock-icon" title="Locked" />
        )}

        <NodeResizer
          color="#ff0071"
          isVisible={selected}
          minWidth={100}
          minHeight={50}
        />

        {/* Source handle */}
        {srcPos && <Handle type="source" position={srcPos} id="source" />}

        {/* Target handle */}
        {tgtPos === Position.Top && <Handle type="target" position={tgtPos} id="target" />}
        {tgtPos === Position.Left && <Handle type="target" position={tgtPos} id="target" className="output-handle" />}

        {/* Output handle on right with distinct style */}
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="output-handle"
        />

        <div className={`markdown-node ${data.kind === 'plot' ? 'markdown-node-plot' : ''} ${data.has_messages ? 'has-messages' : ''}`}>
          <MemoizedMarkdown content={getContent(data)} />
          {data.has_messages && (
            <div className="stop-sign">
              <i className="bi bi-octagon-fill" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Input node: only source handle and output
export const MarkdownInputNode = ({ data, selected }) => (
  <MarkdownFlowNode
    data={data}
    sourcePosition={Position.Bottom}
    selected={selected}
  />
);

// Default node: both handles and output
export const MarkdownDefaultNode = ({ data, selected }) => (
  <MarkdownFlowNode
    data={data}
    sourcePosition={Position.Bottom}
    targetPosition={Position.Top}
    selected={selected}
  />
);

// Output node: only target and output
export const MarkdownOutputNode = ({ data, selected }) => (
  <MarkdownFlowNode
    data={data}
    targetPosition={Position.Left}
    selected={selected}
  />
);
