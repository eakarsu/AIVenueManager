import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import CompleteAIExamples from './components/CompleteAIExamples';
import AIResponse from './components/AIResponse';
import AIReport from './components/AIReport';
import AIWorkspace from './components/AIWorkspace';
import Login from './pages/Login';
import AIDynamicPricingPage from './pages/AIDynamicPricingPage';
import AISchedulingOptimizerPage from './pages/AISchedulingOptimizerPage';
import AIRevenueForecastPage from './pages/AIRevenueForecastPage';
import AIMarketingCampaignPage from './pages/AIMarketingCampaignPage';
import AIArtistAudienceMatchPage from './pages/AIArtistAudienceMatchPage';
import SeatRecommendPage from './pages/SeatRecommendPage';
import api from './services/api';
jest.mock('./services/api', () => ({ post: jest.fn(), get: jest.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); jest.clearAllMocks(); });
function Fixture() {
  const [fields, setFields] = React.useState({ name: '', notes: '', event_id: '', count: 0 });
  const [submitted, setSubmitted] = React.useState(0);
  return <CompleteAIExamples context="Venue planning" presets={['Jazz matinee', 'Comedy evening', 'Family concert'].map((name, i) => ({ values: { name, notes: `Review ${name}`, count: 10 + i } }))}>
    <form onSubmit={e => { e.preventDefault(); setSubmitted(n => n + 1); }}>
      {['name', 'notes', 'event_id', 'count'].map(key => <input key={key} data-ai-field={key} type={key === 'count' ? 'number' : 'text'} required={key === 'name'} value={fields[key]} onChange={e => setFields({ ...fields, [key]: e.target.value })} />)}
      <input data-ai-field="upload" type="file" /><button type="submit">Generate</button>
    </form><output>{submitted}</output>
  </CompleteAIExamples>;
}
test('preset buttons fill optional fields, preserve source fields, and do not submit', () => {
  act(() => root.render(<Fixture />));
  const buttons = [...host.querySelectorAll('button')].filter(b => b.textContent.includes('Demo AI'));
  expect(buttons).toHaveLength(3);
  ['Jazz matinee', 'Comedy evening', 'Family concert'].forEach((name, i) => {
    act(() => buttons[i].click());
    expect(host.querySelector('[data-ai-field="name"]').value).toBe(name);
    expect(host.querySelector('[data-ai-field="notes"]').value).not.toBe('');
    expect(host.querySelector('[data-ai-field="count"]').value).not.toBe('');
    expect(host.querySelector('[data-ai-field="event_id"]').value).toBe('');
    expect(host.querySelector('[data-ai-field="upload"]').value).toBe('');
    expect(host.querySelector('output').textContent).toBe('0');
    expect(host.querySelector('[role="status"]').textContent).toMatch(/Actual source fields/);
  });
});
test('returned and saved JSON display labeled sections, tables and falsy values', () => {
  const value = { summary: '', approved: false, expectedReach: 0, channelMix: [{ channel: 'Email', budgetPct: 0 }], assumptions: { owner: 'Venue team' } };
  for (const markup of [renderToStaticMarkup(<AIResponse data={{ parsed: value, result: JSON.stringify(value) }} />), renderToStaticMarkup(<AIReport response={{ result_json: value }} />)]) {
    for (const label of ['Summary', 'Empty string', 'Approved', 'No', 'Expected Reach', '>0<', '<table', 'Assumptions']) expect(markup).toContain(label);
  }
  expect(renderToStaticMarkup(<AIReport response={{ result_json: false }} />)).toContain('No');
  expect(renderToStaticMarkup(<AIReport response={{ result_json: 0 }} />)).toContain('>0<');
  expect(renderToStaticMarkup(<AIReport response={{ result_json: '' }} />)).toContain('Empty string');
});
test('demo button fills configured credentials without login request', () => {
  process.env.REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL = 'true';
  process.env.REACT_APP_DEMO_EMAIL = 'fixture@example.test';
  process.env.REACT_APP_DEMO_PASSWORD = 'fixture-only';
  act(() => root.render(<Login onLogin={jest.fn()} />));
  act(() => host.querySelector('.btn-autofill').click());
  expect(host.querySelector('input[type=email]').value).toBe('fixture@example.test');
  expect(host.querySelector('input[type=password]').value).toBe('fixture-only');
  expect(api.post).not.toHaveBeenCalled();
  process.env.REACT_APP_DEMO_PASSWORD = '';
  act(() => root.render(<Login onLogin={jest.fn()} />));
  expect(host.querySelector('.btn-autofill').disabled).toBe(true);
  expect(host.textContent).toContain('not configured');
});
test('every native AI prompt page fills editable inputs without generation', async () => {
  api.get.mockResolvedValue({ data: [{ id: 7, name: 'Existing event', date: '2026-11-01' }] });
  for (const Page of [AIDynamicPricingPage, AISchedulingOptimizerPage, AIRevenueForecastPage, AIMarketingCampaignPage, AIArtistAudienceMatchPage, SeatRecommendPage]) {
    await act(async () => root.render(<Page />));
    const presets = [...host.querySelectorAll('button')].filter(b => b.textContent.includes('Demo AI'));
    expect(presets).toHaveLength(3);
    for (const [index, preset] of presets.entries()) {
      act(() => preset.click());
      const inputs = [...host.querySelectorAll('input, textarea, select')].filter(input => input.dataset.aiField && input.dataset.aiField !== 'event_id');
      expect(inputs.filter(input => !input.value.trim()).map(input => `${Page.name}:${input.dataset.aiField}`)).toEqual([]);
      if (Page === SeatRecommendPage) expect(host.querySelector('[data-ai-field="event_id"]').value).toBe('7');
      else if (host.querySelector('[data-ai-field="event_id"]')) expect(host.querySelector('[data-ai-field="event_id"]').value).toBe('');
      if (Page === AIDynamicPricingPage) expect(host.querySelector('[data-ai-field="event_name"]').value).toBe(['Friday Jazz Quartet', 'Saturday Stand-up Showcase', 'Sunday Family Concert'][index]);
      expect(api.post).not.toHaveBeenCalled();
    }
  }
});
test('saved history opens a structured report detail without a model request', async () => {
  const originalFetch = global.fetch;
  const saved = { id: 17, input: { goal: 'Review sales' }, created_at: '2026-10-10T12:00:00Z', model: 'fixture', result_json: { ready: false, ticketsSold: 0, notes: '', tiers: [{ name: 'Balcony', price: 35 }] } };
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items: [saved] }) }));
  try {
    await act(async () => { root.render(<AIWorkspace feature={{ id: 'fixture', title: 'Revenue review', description: 'Fixture' }} token="fixture-token" />); });
    expect(host.querySelector('.ai-history-row')).not.toBeNull();
    act(() => host.querySelector('.ai-history-row').click());
    const detail = document.querySelector('[role="dialog"]');
    expect(detail.textContent).toContain('Ready');
    expect(detail.textContent).toContain('No');
    expect(detail.textContent).toContain('Tickets Sold');
    expect(detail.textContent).toContain('Empty string');
    expect(detail.querySelector('table')).not.toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  } finally { global.fetch = originalFetch; }
});
test('workspace presets fill every required and optional field without a run request', async () => {
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ items: [] }) }));
  try {
    await act(async () => root.render(<AIWorkspace feature={{ id: 'fixture', title: 'Venue report', description: 'Fixture' }} token="fixture-token" />));
    const presets = [...host.querySelectorAll('.ai-preset-bar button')];
    expect(presets).toHaveLength(3);
    for (const preset of presets) {
      act(() => preset.click());
      expect([...host.querySelectorAll('.ai-form-grid input, .ai-form-grid textarea, .ai-form-grid select')].every(field => field.value.trim())).toBe(true);
    }
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('/runs?');
  } finally { global.fetch = originalFetch; }
});
test('saved seat recommendation history opens the complete structured result', async () => {
  localStorage.setItem('seatRecommendHistory', JSON.stringify([{ timestamp: '2026-10-10T12:00:00Z', event_name: 'Existing event', party_size: 2, budget_max: 0, result: { approved: false, total_cost: 0, note: '', recommended_seats: [{ section: 'Balcony', price: 0 }] } }]));
  api.get.mockResolvedValue({ data: [] });
  try {
    await act(async () => root.render(<SeatRecommendPage />));
    act(() => [...host.querySelectorAll('button')].find(button => button.textContent === 'View report').click());
    expect(host.textContent).toContain('Approved');
    expect(host.textContent).toContain('No');
    expect(host.textContent).toContain('Empty string');
    expect(host.querySelector('table.ai-report-table')).not.toBeNull();
  } finally { localStorage.removeItem('seatRecommendHistory'); }
});
