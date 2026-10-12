import React from 'react';
import AIReport from './AIReport';

export default function AIResponse({ data, loading }) {
  return <AIReport response={data} loading={loading} error={data?.error ? `AI Error: ${data.message || 'Request failed'}` : undefined} title="AI Analysis" />;
}
