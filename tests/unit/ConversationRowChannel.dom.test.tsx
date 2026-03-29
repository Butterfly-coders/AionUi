/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for ConversationRow channel icon changes (S2: Channels Area Redesign)
 *
 * Written SPEC-FIRST against tech-design.md Acceptance Criteria.
 * Target component:
 *   src/renderer/pages/conversation/GroupedHistory/ConversationRow.tsx
 *
 * Covered ACs:
 *   AC-1  — Dispatch conversations show # (Pound) icon; NOT People icon; NOT emoji avatar
 *   AC-5  — Unread indicator dot is visible for dispatch conversations that have
 *            hasCompletionUnread === true and are not selected
 *   AC-5  — Unread dot disappears when the conversation is selected (selected === true)
 *   AC-4  — Child task count badge renders when childTaskCount > 0
 *
 * Regression checks (non-dispatch should be unaffected):
 *   REG  — Non-dispatch conversations still show avatar / logo, not the Pound icon
 *   REG  — Non-dispatch conversations: unread dot behaviour remains unchanged
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ----------------------------------------------------------------- //

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' },
  }),
}));

vi.mock('@icon-park/react', () => ({
  // S2 target: Pound (# symbol) — must appear for dispatch rows
  Pound: (props: Record<string, unknown>) => <span data-testid='icon-pound' {...props} />,
  // S1 / pre-S2 People icon — must NOT appear for dispatch rows after S2
  People: (props: Record<string, unknown>) => <span data-testid='icon-people' {...props} />,
  // Non-dispatch row icons
  MessageOne: (props: Record<string, unknown>) => <span data-testid='icon-message' {...props} />,
  DeleteOne: () => <span data-testid='icon-delete' />,
  EditOne: () => <span data-testid='icon-edit' />,
  Export: () => <span data-testid='icon-export' />,
  Pushpin: () => <span data-testid='icon-pushpin' />,
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Dropdown: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Menu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  };
});

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

vi.mock('@/renderer/hooks/agent/usePresetAssistantInfo', () => ({
  usePresetAssistantInfo: () => ({ info: null }),
}));

vi.mock('@/renderer/pages/cron', () => ({
  CronJobIndicator: () => null,
}));

vi.mock('@/renderer/utils/model/agentLogo', () => ({
  getAgentLogo: () => null,
}));

vi.mock('@/renderer/utils/ui/siderTooltip', () => ({
  cleanupSiderTooltips: vi.fn(),
  getSiderTooltipProps: () => ({}),
}));

vi.mock('@/renderer/components/layout/FlexFullContainer', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import ConversationRow from '@/renderer/pages/conversation/GroupedHistory/ConversationRow';
import type { ConversationRowProps } from '@/renderer/pages/conversation/GroupedHistory/types';
import type { TChatConversation } from '@/common/config/storage';

// --- Fixtures -------------------------------------------------------------- //

const makeDispatchConversation = (overrides: Partial<TChatConversation> = {}): TChatConversation =>
  ({
    id: 'dispatch-ch-1',
    name: 'Design Review',
    type: 'dispatch',
    createTime: Date.now(),
    modifyTime: Date.now(),
    extra: {
      dispatchSessionType: 'dispatcher',
    },
    model: { id: 'gemini', useModel: 'gemini-2.0-flash' },
    ...overrides,
  }) as unknown as TChatConversation;

const makeNonDispatchConversation = (overrides: Partial<TChatConversation> = {}): TChatConversation =>
  ({
    id: 'conv-1',
    name: 'Regular Chat',
    type: 'gemini',
    createTime: Date.now(),
    modifyTime: Date.now(),
    extra: {},
    model: { id: 'gemini', useModel: 'gemini-2.0-flash' },
    ...overrides,
  }) as unknown as TChatConversation;

const makeProps = (overrides: Partial<ConversationRowProps> = {}): ConversationRowProps => ({
  conversation: makeDispatchConversation(),
  isGenerating: false,
  hasCompletionUnread: false,
  collapsed: false,
  tooltipEnabled: false,
  batchMode: false,
  checked: false,
  selected: false,
  menuVisible: false,
  childTaskCount: undefined,
  onToggleChecked: vi.fn(),
  onConversationClick: vi.fn(),
  onOpenMenu: vi.fn(),
  onMenuVisibleChange: vi.fn(),
  onEditStart: vi.fn(),
  onDelete: vi.fn(),
  onExport: vi.fn(),
  onTogglePin: vi.fn(),
  onForkToDispatch: vi.fn(),
  getJobStatus: () => 'none',
  ...overrides,
});

// --- Tests ----------------------------------------------------------------- //

describe('ConversationRow - Channel Icon (S2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── AC-1: Dispatch rows show Pound (#) icon ─────────────────────────────── //

  // CRC-001: AC-1 — Pound icon present for dispatch conversation
  it('CRC-001 (AC-1): renders Pound icon for a dispatch conversation', () => {
    render(<ConversationRow {...makeProps()} />);

    expect(screen.getByTestId('icon-pound')).toBeInTheDocument();
  });

  // CRC-002: AC-1 — People icon is NOT rendered for dispatch conversation after S2
  it('CRC-002 (AC-1): does NOT render People icon for dispatch conversation', () => {
    render(<ConversationRow {...makeProps()} />);

    expect(screen.queryByTestId('icon-people')).not.toBeInTheDocument();
  });

  // CRC-003: AC-1 — Dispatch conversation with an avatar emoji still shows Pound, not the emoji
  it('CRC-003 (AC-1): dispatch conversation with teammateConfig avatar shows Pound icon, not emoji', () => {
    const conv = makeDispatchConversation({
      extra: {
        dispatchSessionType: 'dispatcher',
        teammateConfig: { avatar: '🎯' },
      },
    });
    render(<ConversationRow {...makeProps({ conversation: conv })} />);

    expect(screen.getByTestId('icon-pound')).toBeInTheDocument();
    expect(screen.queryByText('🎯')).not.toBeInTheDocument();
  });

  // CRC-004: AC-1 — Pound icon has the expected secondary text color class
  it('CRC-004 (AC-1): Pound icon carries text-t-secondary class', () => {
    render(<ConversationRow {...makeProps()} />);

    const poundIcon = screen.getByTestId('icon-pound');
    // The spec says: className='line-height-0 flex-shrink-0 text-t-secondary'
    expect(poundIcon.className).toContain('text-t-secondary');
  });

  // ── AC-5: Unread indicator dot for dispatch conversations ────────────────── //

  // CRC-005: AC-5 — Unread dot appears for dispatch conversation with hasCompletionUnread=true
  it('CRC-005 (AC-5): unread indicator dot is visible for a dispatch conversation with unread state', () => {
    render(<ConversationRow {...makeProps({ hasCompletionUnread: true, selected: false })} />);

    // The unread dot is a bg-#2C7FFF span; locate by its unique colour class
    const { container } = render(<ConversationRow {...makeProps({ hasCompletionUnread: true, selected: false })} />);
    const dot = container.querySelector('.bg-\\#2C7FFF');
    expect(dot).not.toBeNull();
  });

  // CRC-006: AC-5 — Unread dot is NOT shown when dispatch conversation is selected
  it('CRC-006 (AC-5): unread dot is absent when dispatch conversation is selected', () => {
    const { container } = render(<ConversationRow {...makeProps({ hasCompletionUnread: true, selected: true })} />);

    // selected === true means the selected styling applies; per spec the dot also hides
    // The renderCompletionUnreadDot returns null when... selected is not explicitly checked,
    // but in this context the dot should not appear while selected.
    // Primary check: the unread dot element is absent.
    const dot = container.querySelector('.bg-\\#2C7FFF');
    // If selected row suppresses the dot the element will be null.
    // If the implementation does not suppress it yet, this test will catch the regression.
    expect(dot).toBeNull();
  });

  // CRC-007: AC-5 — Unread dot is NOT shown when isGenerating is true
  it('CRC-007 (AC-5): unread dot is hidden while dispatch conversation is generating', () => {
    const { container } = render(<ConversationRow {...makeProps({ hasCompletionUnread: true, isGenerating: true })} />);

    const dot = container.querySelector('.bg-\\#2C7FFF');
    expect(dot).toBeNull();
  });

  // CRC-008: AC-5 — Unread dot is NOT shown in batchMode (matches renderCompletionUnreadDot guard)
  it('CRC-008 (AC-5): unread dot is hidden for dispatch conversation in batch mode', () => {
    const { container } = render(<ConversationRow {...makeProps({ hasCompletionUnread: true, batchMode: true })} />);

    const dot = container.querySelector('.bg-\\#2C7FFF');
    expect(dot).toBeNull();
  });

  // CRC-009: AC-5 — Unread dot absent when hasCompletionUnread is false
  it('CRC-009 (AC-5): unread dot does not appear when hasCompletionUnread is false', () => {
    const { container } = render(<ConversationRow {...makeProps({ hasCompletionUnread: false })} />);

    const dot = container.querySelector('.bg-\\#2C7FFF');
    expect(dot).toBeNull();
  });

  // ── AC-4: Child task count badge ─────────────────────────────────────────── //

  // CRC-010: AC-4 — Count badge shown when childTaskCount > 0
  it('CRC-010 (AC-4): child task count badge renders with correct number', () => {
    render(<ConversationRow {...makeProps({ childTaskCount: 5 })} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  // CRC-011: AC-4 — Count badge NOT shown when childTaskCount is 0
  it('CRC-011 (AC-4): child task count badge is absent when count is 0', () => {
    render(<ConversationRow {...makeProps({ childTaskCount: 0 })} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  // CRC-012: AC-4 — Count badge NOT shown when childTaskCount is undefined
  it('CRC-012 (AC-4): child task count badge is absent when childTaskCount is undefined', () => {
    render(<ConversationRow {...makeProps({ childTaskCount: undefined })} />);

    // No numeric badge text should appear
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });
});

// ── Regression: non-dispatch conversations are unaffected ────────────────── //

describe('ConversationRow - Regression: non-dispatch conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CRC-REG-001: Non-dispatch conversations do NOT show the Pound icon
  it('CRC-REG-001: non-dispatch conversation does NOT render Pound icon', () => {
    render(<ConversationRow {...makeProps({ conversation: makeNonDispatchConversation() })} />);

    expect(screen.queryByTestId('icon-pound')).not.toBeInTheDocument();
  });

  // CRC-REG-002: Non-dispatch conversations show MessageOne (fallback icon) when no agent logo
  it('CRC-REG-002: non-dispatch conversation without logo shows MessageOne fallback icon', () => {
    render(<ConversationRow {...makeProps({ conversation: makeNonDispatchConversation() })} />);

    expect(screen.getByTestId('icon-message')).toBeInTheDocument();
  });

  // CRC-REG-003: Non-dispatch unread dot still appears (guard !isDispatchConversation removed in S2)
  it('CRC-REG-003: unread dot still renders for non-dispatch conversation with unread state', () => {
    const { container } = render(
      <ConversationRow
        {...makeProps({
          conversation: makeNonDispatchConversation(),
          hasCompletionUnread: true,
          selected: false,
        })}
      />
    );

    const dot = container.querySelector('.bg-\\#2C7FFF');
    expect(dot).not.toBeNull();
  });

  // CRC-REG-004: Child task count badge is NOT rendered for non-dispatch conversations
  it('CRC-REG-004: child task count badge is absent for non-dispatch conversations', () => {
    render(
      <ConversationRow
        {...makeProps({
          conversation: makeNonDispatchConversation(),
          childTaskCount: 3,
        })}
      />
    );

    // Non-dispatch: badge only renders when isDispatchConversation === true
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });
});
