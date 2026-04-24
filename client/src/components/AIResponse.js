import React from 'react';

function formatAIContent(text) {
  if (!text) return '';

  // Convert markdown-like formatting to HTML
  let html = text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h2>$1</h2>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^• (.*$)/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Checkmarks
    .replace(/✅/g, '<span style="color: #4ade80">✅</span>')
    .replace(/⚠️/g, '<span style="color: #fbbf24">⚠️</span>')
    .replace(/❌/g, '<span style="color: #f87171">❌</span>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br\/>)?)+/g, (match) => {
    return '<ul>' + match.replace(/<br\/>/g, '') + '</ul>';
  });

  return '<p>' + html + '</p>';
}

export default function AIResponse({ data, loading }) {
  if (loading) {
    return (
      <div className="ai-response">
        <div className="ai-loading">
          <div className="spinner"></div>
          Analyzing with AI...
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.error) {
    return (
      <div className="ai-response">
        <div className="error-message">AI Error: {data.message}</div>
      </div>
    );
  }

  const content = data.result || data;

  return (
    <div className="ai-response">
      <div className="ai-response-header">
        <div className="ai-icon">🤖</div>
        <div>
          <div className="ai-label">AI Analysis</div>
        </div>
        {data.model && <span className="ai-model">{data.model}</span>}
        {data.usage && (
          <span className="ai-model">
            {data.usage.total_tokens} tokens
          </span>
        )}
      </div>
      <div
        className="ai-content"
        dangerouslySetInnerHTML={{ __html: formatAIContent(content) }}
      />
    </div>
  );
}
