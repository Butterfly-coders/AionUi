import { ipcBridge } from '@/common';
import { Dropdown, Menu, Message, Modal } from '@arco-design/web-react';
import { Delete, FolderOpen, Refresh } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ExternalSource, SkillInfo } from '../types';
import SearchInput from './SearchInput';
import SkillCard from './SkillCard';

const AVATAR_COLORS = [
  'bg-[#165DFF] text-white',
  'bg-[#00B42A] text-white',
  'bg-[#722ED1] text-white',
  'bg-[#F5319D] text-white',
  'bg-[#F77234] text-white',
  'bg-[#14C9C9] text-white',
];

const getAvatarColorClass = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

type MySkillsSectionProps = {
  loading: boolean;
  availableSkills: SkillInfo[];
  filteredSkills: SkillInfo[];
  skillPaths: { userSkillsDir: string; builtinSkillsDir: string } | null;
  externalSources: ExternalSource[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh: () => Promise<void>;
  onDelete: (skillName: string) => void;
  onManualImport: () => void;
};

const MySkillsSection: React.FC<MySkillsSectionProps> = ({
  loading,
  availableSkills,
  filteredSkills,
  skillPaths,
  externalSources,
  searchQuery,
  setSearchQuery,
  onRefresh,
  onDelete,
  onManualImport,
}) => {
  const { t } = useTranslation();

  const handleExport = async (skill: SkillInfo, source: ExternalSource) => {
    const hide = Message.loading({
      content: t('common.processing', { defaultValue: 'Processing...' }),
      duration: 0,
    });
    try {
      const skillPath = skill.location.replace(/[\\/]SKILL\.md$/, '');
      const result = await Promise.race([
        ipcBridge.fs.exportSkillWithSymlink.invoke({
          skillPath,
          targetDir: source.path,
        }),
        new Promise<{ success: boolean; msg: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Export timed out.')), 8000)
        ),
      ]);
      hide();
      if (result.success) {
        Message.success(t('settings.skillsHub.exportSuccess', { defaultValue: '导出成功' }));
      } else {
        Message.error(result.msg || t('settings.skillsHub.exportFailed', { defaultValue: '导出失败' }));
      }
    } catch (error) {
      hide();
      console.error('[SkillsHub] Export error:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      Message.error(errMsg);
    }
  };

  return (
    <div className='px-[16px] md:px-[32px] py-32px bg-base rd-16px md:rd-24px shadow-sm border border-b-base relative overflow-hidden transition-all'>
      {/* Toolbar */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-16px mb-24px relative z-10'>
        <div className='flex items-center gap-10px shrink-0'>
          <span className='text-16px md:text-18px text-t-primary font-bold tracking-tight'>
            {t('settings.skillsHub.mySkillsTitle', { defaultValue: '我的技能' })}
          </span>
          <span className='bg-[rgba(var(--primary-6),0.08)] text-primary-6 text-12px px-10px py-2px rd-[100px] font-medium ml-4px'>
            {availableSkills.length}
          </span>
          <button
            className='outline-none border-none bg-transparent cursor-pointer p-6px text-t-tertiary hover:text-primary-6 transition-colors rd-full hover:bg-fill-2 ml-4px'
            onClick={async () => {
              await onRefresh();
              Message.success(t('common.refreshSuccess', { defaultValue: '已刷新' }));
            }}
            title={t('common.refresh', { defaultValue: 'Refresh' })}
          >
            <Refresh theme='outline' size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-12px w-full lg:w-auto shrink-0'>
          <SearchInput
            className='w-full sm:w-[200px] lg:w-[240px]'
            placeholder={t('settings.skillsHub.searchPlaceholder', { defaultValue: 'Search skills...' })}
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <button
            className='flex items-center justify-center gap-6px px-16px py-6px bg-base border border-border-1 hover:border-border-2 hover:bg-fill-1 text-t-primary rd-8px shadow-sm transition-all focus:outline-none shrink-0 cursor-pointer whitespace-nowrap'
            onClick={onManualImport}
          >
            <FolderOpen size={15} className='text-t-secondary' />
            <span className='text-13px font-medium'>
              {t('settings.skillsHub.manualImport', { defaultValue: '从文件夹导入' })}
            </span>
          </button>
        </div>
      </div>

      {/* Path Display */}
      {skillPaths && (
        <div className='flex items-center gap-8px text-12px text-t-tertiary font-mono bg-transparent py-4px mb-16px relative z-10 pt-4px border-t border-t-transparent'>
          <FolderOpen size={16} className='shrink-0' />
          <span className='truncate' title={skillPaths.userSkillsDir}>
            {skillPaths.userSkillsDir}
          </span>
        </div>
      )}

      {/* Skills List */}
      {availableSkills.length > 0 ? (
        <div className='w-full flex flex-col gap-6px relative z-10'>
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.name}
              name={skill.name}
              description={skill.description}
              avatar={
                <div
                  className={`w-40px h-40px rd-10px flex items-center justify-center font-bold text-16px shadow-sm text-transform-uppercase ${getAvatarColorClass(skill.name)}`}
                >
                  {skill.name.charAt(0).toUpperCase()}
                </div>
              }
              badge={
                skill.isCustom ? (
                  <span className='bg-[rgba(var(--orange-6),0.08)] text-orange-6 border border-[rgba(var(--orange-6),0.2)] text-11px px-6px py-1px rd-4px font-medium'>
                    {t('settings.skillsHub.custom', { defaultValue: '自定义' })}
                  </span>
                ) : (
                  <span className='bg-[rgba(var(--blue-6),0.08)] text-blue-6 border border-[rgba(var(--blue-6),0.2)] text-11px px-6px py-1px rd-4px font-medium'>
                    {t('settings.skillsHub.builtin', { defaultValue: '内置' })}
                  </span>
                )
              }
              actions={
                <>
                  {externalSources.length > 0 && (
                    <Dropdown
                      trigger='click'
                      position='bl'
                      droplist={
                        <Menu>
                          {externalSources.map((source) => (
                            <Menu.Item
                              key={source.source}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleExport(skill, source);
                              }}
                            >
                              {source.name}
                            </Menu.Item>
                          ))}
                        </Menu>
                      }
                    >
                      <button
                        className='p-8px hover:bg-fill-2 text-t-tertiary hover:text-t-secondary rd-6px outline-none flex items-center justify-center border border-transparent cursor-pointer transition-colors shadow-sm bg-base sm:bg-transparent sm:shadow-none'
                        title={t('settings.skillsHub.exportTo', { defaultValue: '导出到...' })}
                      >
                        <span className='text-12px font-medium'>
                          {t('settings.skillsHub.exportTo', { defaultValue: '导出' })}
                        </span>
                      </button>
                    </Dropdown>
                  )}
                  {skill.isCustom && (
                    <button
                      className='p-8px hover:bg-danger-1 hover:text-danger-6 text-t-tertiary rd-6px outline-none flex items-center justify-center border border-transparent cursor-pointer transition-colors shadow-sm bg-base sm:bg-transparent sm:shadow-none'
                      onClick={() => {
                        Modal.confirm({
                          title: t('settings.skillsHub.deleteConfirmTitle', { defaultValue: '确认删除技能' }),
                          content: t('settings.skillsHub.deleteConfirmContent', {
                            name: skill.name,
                            defaultValue: `确定要删除 "${skill.name}" 吗？`,
                          }),
                          okButtonProps: { status: 'danger' },
                          onOk: () => void onDelete(skill.name),
                        });
                      }}
                      title={t('common.delete', { defaultValue: '删除' })}
                    >
                      <Delete size={16} />
                    </button>
                  )}
                </>
              }
            />
          ))}
        </div>
      ) : (
        <div className='text-center text-t-secondary text-13px py-40px bg-fill-1 rd-12px border border-b-base border-dashed relative z-10'>
          {loading
            ? t('common.loading', { defaultValue: '加载中...' })
            : t('settings.skillsHub.noSkills', { defaultValue: '未找到技能。导入一些来开始使用吧。' })}
        </div>
      )}
    </div>
  );
};

export default MySkillsSection;
