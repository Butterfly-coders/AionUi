import { Button, Typography } from '@arco-design/web-react';
import { FolderOpen, Plus, Refresh } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ExternalSource } from '../types';
import SearchInput from './SearchInput';
import SkillCard from './SkillCard';

type ExternalSkillsSectionProps = {
  totalExternal: number;
  externalSources: ExternalSource[];
  activeSourceTab: string;
  setActiveSourceTab: (tab: string) => void;
  activeSource: ExternalSource | undefined;
  filteredExternalSkills: Array<{ name: string; description: string; path: string }>;
  searchExternalQuery: string;
  setSearchExternalQuery: (query: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onImport: (skillPath: string) => void;
  onImportAll: (skills: Array<{ name: string; path: string }>) => void;
  onShowAddPathModal: () => void;
};

const ExternalSkillsSection: React.FC<ExternalSkillsSectionProps> = ({
  totalExternal,
  externalSources,
  activeSourceTab,
  setActiveSourceTab,
  activeSource,
  filteredExternalSkills,
  searchExternalQuery,
  setSearchExternalQuery,
  refreshing,
  onRefresh,
  onImport,
  onImportAll,
  onShowAddPathModal,
}) => {
  const { t } = useTranslation();

  if (totalExternal <= 0) return null;

  return (
    <div className='px-[16px] md:px-[32px] py-32px bg-base rd-16px md:rd-24px mb-16px shadow-sm border border-b-base relative overflow-hidden transition-all'>
      {/* Section Header */}
      <div className='flex flex-col lg:flex-row lg:items-start justify-between gap-16px mb-24px relative z-10 w-full'>
        <div className='flex flex-col'>
          <div className='flex items-center gap-10px mb-8px'>
            <span className='text-16px md:text-18px text-t-primary font-bold tracking-tight'>
              {t('settings.skillsHub.discoveredTitle', { defaultValue: '发现外部技能' })}
            </span>
            <span className='bg-[rgba(var(--primary-6),0.08)] text-primary-6 text-12px px-10px py-2px rd-[100px] font-medium ml-4px'>
              {totalExternal}
            </span>
            <button
              className='outline-none border-none bg-transparent cursor-pointer p-6px text-t-tertiary hover:text-primary-6 transition-colors rd-full hover:bg-fill-2 ml-4px'
              onClick={onRefresh}
              title={t('common.refresh', { defaultValue: 'Refresh' })}
            >
              <Refresh theme='outline' size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          <Typography.Text className='text-13px text-t-secondary block max-w-xl leading-relaxed'>
            {t('settings.skillsHub.discoveryAlert', {
              defaultValue: '检测到来自 CLI 工具的技能。导入后即可在 AionUi 中使用。',
            })}
          </Typography.Text>
        </div>

        <SearchInput
          className='w-full lg:w-[240px]'
          placeholder={t('settings.skillsHub.searchPlaceholder', { defaultValue: 'Search skills...' })}
          value={searchExternalQuery}
          onChange={setSearchExternalQuery}
        />
      </div>

      {/* Source Tabs */}
      <div className='flex flex-wrap items-center gap-8px mb-20px relative z-10 w-full'>
        {externalSources.map((source) => {
          const isActive = activeSourceTab === source.source;
          return (
            <button
              key={source.source}
              type='button'
              className={`outline-none cursor-pointer px-16px py-6px text-13px rd-[100px] transition-all duration-300 flex items-center gap-6px border ${isActive ? 'bg-primary-6 border-primary-6 text-white shadow-md font-medium' : 'bg-base border-border-1 text-t-secondary hover:bg-fill-1 hover:text-t-primary'}`}
              onClick={() => setActiveSourceTab(source.source)}
            >
              {source.name}
              <span
                className={`px-6px py-1px rd-[100px] text-11px flex items-center justify-center transition-colors ${isActive ? 'bg-white/20 text-white font-medium' : 'bg-fill-2 text-t-secondary border border-transparent'}`}
              >
                {source.skills.length}
              </span>
            </button>
          );
        })}
        <button
          type='button'
          className='outline-none border border-dashed border-border-1 hover:border-primary-4 cursor-pointer w-28px h-28px ml-4px text-t-tertiary hover:text-primary-6 hover:bg-primary-1 rd-full transition-all duration-300 flex items-center justify-center bg-transparent shrink-0'
          onClick={onShowAddPathModal}
          title={t('common.add', { defaultValue: 'Add' })}
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Active Source Content */}
      {activeSource && (
        <div className='flex flex-col'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-12px py-8px mb-4px'>
            <div className='flex items-center gap-8px text-12px text-t-tertiary font-mono min-w-0 bg-transparent py-4px'>
              <FolderOpen size={16} className='shrink-0' />
              <span className='truncate' title={activeSource.path}>
                {activeSource.path}
              </span>
            </div>
            <button
              className='flex items-center gap-6px text-13px font-medium text-primary-6 hover:text-primary-5 transition-colors bg-transparent border-none outline-none cursor-pointer whitespace-nowrap'
              onClick={() => onImportAll(activeSource.skills)}
            >
              {t('settings.skillsHub.importAll', { defaultValue: '全部导入' })}
            </button>
          </div>

          <div className='max-h-[360px] overflow-y-auto custom-scrollbar flex flex-col gap-6px pr-4px'>
            {filteredExternalSkills.map((skill) => (
              <SkillCard
                key={skill.path}
                name={skill.name}
                description={skill.description}
                avatar={
                  <div className='w-40px h-40px rd-full bg-base border border-border-1 flex items-center justify-center font-bold text-16px text-t-primary shadow-sm transition-all text-transform-uppercase'>
                    {skill.name.charAt(0)}
                  </div>
                }
                onClick={() => onImport(skill.path)}
                actions={
                  <Button
                    size='small'
                    type='primary'
                    status='default'
                    onClick={(e) => {
                      e.stopPropagation();
                      onImport(skill.path);
                    }}
                    className='rd-[100px] shadow-sm px-16px'
                  >
                    {t('common.import', { defaultValue: '导入' })}
                  </Button>
                }
              />
            ))}
            {filteredExternalSkills.length === 0 && (
              <div className='text-center text-t-secondary text-13px py-40px bg-fill-1 rd-12px border border-b-base border-dashed'>
                {t('settings.skillsHub.noSearchResults', { defaultValue: '未找到相关技能' })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalSkillsSection;
