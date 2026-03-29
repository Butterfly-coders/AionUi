/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for ChannelSection component (S2: Channels Area Redesign)
 *
 * Written SPEC-FIRST against tech-design.md Acceptance Criteria.
 * Component lives at:
 *   src/renderer/pages/conversation/GroupedHistory/ChannelSection.tsx
 *
 * Covered ACs:
 *   AC-2  — Section header shows "Channels" label (i18n key)
 *   AC-3  — "+" button triggers onCreateChannel callback
 *   AC-6  — Collapsed sidebar shows icon only (no section text / no + button)
 *   AC-7  — Collapse / expand chevron toggle works, default state is expanded
 *   AC-12 — No hardcoded English strings (all text via t())
 *   AC-19 — Empty state: header always visible, no channel rows, empty-state message
 *   AC-4  — Active task count badge is rendered by the row (via renderConversation render-prop)
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
  Down: (props: Record<string, unknown>) => <span data-testid='icon-down' {...props} />,
  Right: (props: Record<string, unknown>) => <span data-testid='icon-right' {...props} />,
  Plus: (props: Record<string, unknown>) => <span data-testid='icon-plus' {...props} />,
  Add: (props: Record<string, unknown>) => <span data-testid='icon-add' {...props} />,
}));

vi.mock('@arco-design/web-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@arco-design/web-react')>();
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// The component does not import any CSS Module, but guard against it anyway.
vi.mock('@/renderer/pages/conversation/GroupedHistory/ChannelSection.module.css', () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}));

import type { TChatConversation } from '@/common/config/storage';
import ChannelSection from '@/renderer/pages/conversation/GroupedHistory/ChannelSection';
import type { ChannelSectionProps } from '@/renderer/pages/conversation/GroupedHistory/types';

// --- Fixtures -------------------------------------------------------------- //

const makeConversation = (id: string, name: string): TChatConversation =>
  ({
    id,
    name,
    type: 'dispatch',
    createTime: Date.now(),
    modifyTime: Date.now(),
    extra: { dispatchSessionType: 'dispatcher' },
    model: { id: 'gemini', useModel: 'gemini-2.0-flash' },
  }) as unknown as TChatConversation;

/** Minimal render prop: renders a div with data-testid='channel-row-{id}' */
const makeRenderConversation =
  () =>
  (conversation: TChatConversation): React.ReactNode => (
    <div key={conversation.id} data-testid={`channel-row-${conversation.id}`}>
      {conversation.name}
    </div>
  );

const defaultProps = (): ChannelSectionProps => ({
  conversations: [makeConversation('ch-1', 'Design Review'), makeConversation('ch-2', 'Backend Sprint')],
  childTaskCounts: new Map([['ch-1', 2]]),
  collapsed: false,
  tooltipEnabled: false,
  batchMode: false,
  selectedConversationId: undefined,
  onCreateChannel: vi.fn(),
  renderConversation: makeRenderConversation(),
});

// --- Tests ----------------------------------------------------------------- //

describe('ChannelSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CS-001: AC-2 — Section header contains the i18n key for "Channels"
  it('CS-001 (AC-2): section header displays the i18n key dispatch.sidebar.channelsSection', () => {
    render(<ChannelSection {...defaultProps()} />);

    // The mock t() returns the key itself, so if the text is hardcoded the test fails.
    expect(screen.getByText('dispatch.sidebar.channelsSection')).toBeInTheDocument();
  });

  // CS-002: AC-3 — "+" button calls onCreateChannel callback
  it('CS-002 (AC-3): clicking the "+" button triggers onCreateChannel', () => {
    const onCreateChannel = vi.fn();
    render(<ChannelSection {...defaultProps()} onCreateChannel={onCreateChannel} />);

    // The + button may be rendered as a button element or a clickable span; locate it by testid or role.
    // The component is expected to render a button/clickable with data-testid='create-channel-btn'
    // or with role='button'. We try testid first, then query role (not getAll which throws when empty).
    const createBtn =
      screen.queryByTestId('create-channel-btn') ??
      screen
        .queryAllByRole('button')
        .find(
          (el) => el.getAttribute('data-testid') === 'create-channel-btn' || el.getAttribute('aria-label') !== null
        );

    // If no explicit testid/role, fall back: look for the plus icon container that is clickable.
    // The component renders a clickable <span> wrapping the plus icon.
    const plusIcon = screen.queryByTestId('icon-plus') ?? screen.queryByTestId('icon-add');
    const target = createBtn ?? plusIcon?.closest('[role="button"]') ?? plusIcon?.parentElement;

    expect(target).not.toBeNull();
    fireEvent.click(target!);

    expect(onCreateChannel).toHaveBeenCalledTimes(1);
  });

  // CS-003: AC-7 — Default state is expanded: channel rows are visible
  it('CS-003 (AC-7): channel rows are visible in default (expanded) state', () => {
    render(<ChannelSection {...defaultProps()} />);

    expect(screen.getByTestId('channel-row-ch-1')).toBeInTheDocument();
    expect(screen.getByTestId('channel-row-ch-2')).toBeInTheDocument();
  });

  // CS-004: AC-7 — Clicking the chevron toggle collapses the channel list
  it('CS-004 (AC-7): clicking the chevron hides channel rows', () => {
    render(<ChannelSection {...defaultProps()} />);

    // The header row acts as a toggle; find it via the down chevron or a dedicated toggle area.
    // Look for icon-down (expanded state) first.
    const chevron = screen.queryByTestId('icon-down');
    expect(chevron).not.toBeNull();

    const toggleTarget = chevron!.closest('[role="button"]') ?? chevron!.parentElement!;
    fireEvent.click(toggleTarget);

    // After collapsing, the rows should be hidden from DOM (or display:none).
    // Using queryByTestId so we don't throw if absent.
    expect(screen.queryByTestId('channel-row-ch-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('channel-row-ch-2')).not.toBeInTheDocument();
  });

  // CS-005: AC-7 — Clicking chevron a second time re-expands the list
  it('CS-005 (AC-7): clicking chevron twice restores the expanded channel list', () => {
    render(<ChannelSection {...defaultProps()} />);

    const chevron = screen.getByTestId('icon-down');
    const toggleTarget = chevron.closest('[role="button"]') ?? chevron.parentElement!;

    // Collapse
    fireEvent.click(toggleTarget);
    // Re-expand: now the right chevron should be shown
    const rightChevron = screen.getByTestId('icon-right');
    const expandTarget = rightChevron.closest('[role="button"]') ?? rightChevron.parentElement!;
    fireEvent.click(expandTarget);

    expect(screen.getByTestId('channel-row-ch-1')).toBeInTheDocument();
  });

  // CS-006: AC-6 — Collapsed sidebar: section label and "+" button are not visible
  it('CS-006 (AC-6): when sidebar is collapsed, section label and + button are not visible', () => {
    render(<ChannelSection {...defaultProps()} collapsed={true} />);

    expect(screen.queryByText('dispatch.sidebar.channelsSection')).not.toBeInTheDocument();
    expect(screen.queryByTestId('create-channel-btn')).not.toBeInTheDocument();
  });

  // CS-007: AC-6 — Collapsed sidebar still renders (no crash)
  it('CS-007 (AC-6): renders without error when sidebar is collapsed', () => {
    expect(() => render(<ChannelSection {...defaultProps()} collapsed={true} />)).not.toThrow();
  });

  // CS-008: AC-19 — Empty conversations: header still renders
  it('CS-008 (AC-19): section header still renders when conversations array is empty', () => {
    render(<ChannelSection {...defaultProps()} conversations={[]} />);

    expect(screen.getByText('dispatch.sidebar.channelsSection')).toBeInTheDocument();
  });

  // CS-009: AC-19 — Empty conversations: no channel rows rendered
  it('CS-009 (AC-19): no channel rows are rendered when conversations is empty', () => {
    render(<ChannelSection {...defaultProps()} conversations={[]} />);

    expect(screen.queryByTestId('channel-row-ch-1')).not.toBeInTheDocument();
  });

  // CS-010: AC-19 — Empty conversations: empty-state message rendered using i18n key
  it('CS-010 (AC-19): empty-state message uses i18n key dispatch.sidebar.noChannels', () => {
    render(<ChannelSection {...defaultProps()} conversations={[]} />);

    // The mock t() returns the key itself — hardcoded English would NOT match the key.
    expect(screen.getByText('dispatch.sidebar.noChannels')).toBeInTheDocument();
  });

  // CS-011: AC-3 — "+" button NOT rendered in empty state when sidebar is collapsed
  it('CS-011 (AC-6/AC-19): collapsed sidebar with empty conversations shows no + button', () => {
    render(<ChannelSection {...defaultProps()} conversations={[]} collapsed={true} />);

    expect(screen.queryByTestId('create-channel-btn')).not.toBeInTheDocument();
  });

  // CS-012: AC-4 — renderConversation render-prop is called for each conversation
  it('CS-012 (AC-4): renderConversation is invoked for each conversation', () => {
    const renderSpy = vi.fn((conv: TChatConversation) => (
      <div key={conv.id} data-testid={`spy-row-${conv.id}`}>
        {conv.name}
      </div>
    ));

    render(<ChannelSection {...defaultProps()} renderConversation={renderSpy} />);

    // Both conversations must be rendered
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(renderSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'ch-1' }));
    expect(renderSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'ch-2' }));
  });

  // CS-013: AC-12 — No hardcoded "Channels" English string outside of i18n (regression guard)
  it('CS-013 (AC-12): section label is not the literal hardcoded string "Channels"', () => {
    render(<ChannelSection {...defaultProps()} />);

    // The mock t() returns keys, so the literal string "Channels" should NOT appear
    // unless the developer bypassed i18n.
    expect(screen.queryByText('Channels')).not.toBeInTheDocument();
  });

  // CS-014: AC-12 — No hardcoded "No channels yet" English string
  it('CS-014 (AC-12): empty-state text is not the hardcoded English string', () => {
    render(<ChannelSection {...defaultProps()} conversations={[]} />);

    expect(screen.queryByText('No channels yet')).not.toBeInTheDocument();
  });

  // CS-015: AC-7 — Chevron shows "Down" icon in expanded state (visual parity with AgentDMGroup)
  it('CS-015 (AC-7): shows Down chevron icon in default (expanded) state', () => {
    render(<ChannelSection {...defaultProps()} />);

    expect(screen.getByTestId('icon-down')).toBeInTheDocument();
  });

  // CS-016: AC-7 — Chevron shows "Right" icon after collapsing
  it('CS-016 (AC-7): shows Right chevron icon after collapsing the section', () => {
    render(<ChannelSection {...defaultProps()} />);

    const chevron = screen.getByTestId('icon-down');
    const toggleTarget = chevron.closest('[role="button"]') ?? chevron.parentElement!;
    fireEvent.click(toggleTarget);

    expect(screen.getByTestId('icon-right')).toBeInTheDocument();
    expect(screen.queryByTestId('icon-down')).not.toBeInTheDocument();
  });

  // CS-017: Failure path — renderConversation is NOT called when list is collapsed
  it('CS-017: renderConversation is not called when the section is collapsed by toggle', () => {
    const renderSpy = vi.fn((conv: TChatConversation) => <div key={conv.id} data-testid={`spy-row-${conv.id}`} />);

    render(<ChannelSection {...defaultProps()} renderConversation={renderSpy} />);

    // First render: called for each conversation (expanded default)
    expect(renderSpy).toHaveBeenCalledTimes(2);
    renderSpy.mockClear();

    // Collapse
    const chevron = screen.getByTestId('icon-down');
    const toggleTarget = chevron.closest('[role="button"]') ?? chevron.parentElement!;
    fireEvent.click(toggleTarget);

    // After collapse, no additional render calls for conversation rows
    expect(renderSpy).not.toHaveBeenCalled();
  });

  // CS-018: Failure path — onCreateChannel is NOT called when + button is not clicked
  it('CS-018: onCreateChannel is not triggered without a click', () => {
    const onCreateChannel = vi.fn();
    render(<ChannelSection {...defaultProps()} onCreateChannel={onCreateChannel} />);

    expect(onCreateChannel).not.toHaveBeenCalled();
  });
});
