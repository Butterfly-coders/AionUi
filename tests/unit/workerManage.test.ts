/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const releaseConversationMessageCache = vi.fn();

vi.mock('../../src/process/initStorage', () => ({
  ProcessChat: {
    get: vi.fn(async () => []),
  },
}));

vi.mock('../../src/process/database/export', () => ({
  getDatabase: vi.fn(() => ({
    getConversation: vi.fn(() => ({ success: false })),
  })),
}));

vi.mock('../../src/process/message', () => ({
  releaseConversationMessageCache,
}));

vi.mock('../../src/process/services/cron/CronBusyGuard', () => ({
  cronBusyGuard: {
    isProcessing: vi.fn(() => false),
  },
}));

vi.mock('../../src/process/task/AcpAgentManager', () => ({
  default: class AcpAgentManager {},
}));

vi.mock('../../src/process/task/GeminiAgentManager', () => ({
  GeminiAgentManager: class GeminiAgentManager {},
}));

vi.mock('../../src/process/task/NanoBotAgentManager', () => ({
  default: class NanoBotAgentManager {},
}));

vi.mock('../../src/process/task/OpenClawAgentManager', () => ({
  default: class OpenClawAgentManager {},
}));

vi.mock('../../src/agent/codex', () => ({
  CodexAgentManager: class CodexAgentManager {},
}));

describe('WorkerManage.pruneIdleTasks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T00:00:00.000Z'));
    releaseConversationMessageCache.mockReset();
    vi.resetModules();
  });

  afterEach(async () => {
    const { default: WorkerManage } = await import('../../src/process/WorkerManage');
    WorkerManage.clear();
    vi.useRealTimers();
  });

  it('evicts finished idle tasks but keeps running tasks and legacy codex tasks', async () => {
    const { default: WorkerManage } = await import('../../src/process/WorkerManage');

    const finishedTask = {
      type: 'gemini',
      status: 'finished',
      getConfirmations: () => [],
      kill: vi.fn(),
    } as any;
    const runningTask = {
      type: 'gemini',
      status: 'running',
      getConfirmations: () => [],
      kill: vi.fn(),
    } as any;
    const codexTask = {
      type: 'codex',
      status: 'finished',
      getConfirmations: () => [],
      kill: vi.fn(),
    } as any;

    WorkerManage.addTask('finished-1', finishedTask);
    WorkerManage.addTask('running-1', runningTask);
    WorkerManage.addTask('codex-1', codexTask);

    vi.advanceTimersByTime(2 * 60 * 1000 + 1000);
    WorkerManage.pruneIdleTasks(Date.now());

    expect(finishedTask.kill).toHaveBeenCalledTimes(1);
    expect(WorkerManage.getTaskById('finished-1')).toBeUndefined();
    expect(WorkerManage.getTaskById('running-1')).toBe(runningTask);
    expect(WorkerManage.getTaskById('codex-1')).toBe(codexTask);
    expect(releaseConversationMessageCache).toHaveBeenCalledWith('finished-1');
  });
});
