/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tooltip } from '@arco-design/web-react';
import { Down, Plus, Right } from '@icon-park/react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { ChannelSectionProps } from './types';

const ChannelSection: React.FC<ChannelSectionProps> = ({
  conversations,
  collapsed,
  onCreateChannel,
  renderConversation,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (collapsed) {
    // In collapsed sidebar, just render the channel rows directly
    return <div className='min-w-0'>{conversations.map((conversation) => renderConversation(conversation))}</div>;
  }

  return (
    <div className='min-w-0'>
      {/* Section header with collapse toggle and + button */}
      <div className='chat-history__section px-12px py-8px text-13px text-t-secondary font-bold flex items-center justify-between'>
        <div className='flex items-center gap-4px cursor-pointer' onClick={handleToggle}>
          <span className='flex-shrink-0 text-t-secondary w-12px flex-center'>
            {expanded ? <Down theme='outline' size='10' /> : <Right theme='outline' size='10' />}
          </span>
          <span>{t('dispatch.sidebar.channelsSection')}</span>
        </div>
        <Tooltip content={t('dispatch.sidebar.newGroupChat')} position='top' mini>
          <span
            className='flex-center cursor-pointer hover:bg-fill-2 rd-4px p-2px transition-colors'
            onClick={onCreateChannel}
          >
            <Plus theme='outline' size='14' />
          </span>
        </Tooltip>
      </div>

      {/* Channel list */}
      {expanded && (
        <div className='min-w-0'>
          {conversations.length === 0 ? (
            <div className='px-12px py-4px text-12px text-t-secondary'>{t('dispatch.sidebar.noChannels')}</div>
          ) : (
            conversations.map((conversation) => renderConversation(conversation))
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelSection;
