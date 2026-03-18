import { Info } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import SettingsPageWrapper from '../components/SettingsPageWrapper';
import AddPathModal from './components/AddPathModal';
import ExternalSkillsSection from './components/ExternalSkillsSection';
import MySkillsSection from './components/MySkillsSection';
import { useSkillsHub } from './hooks/useSkillsHub';

const SkillsHubSettings: React.FC = () => {
  const { t } = useTranslation();
  const hub = useSkillsHub();

  return (
    <>
      <SettingsPageWrapper>
        <div className='flex flex-col h-full w-full'>
          <div className='space-y-16px pb-24px'>
            <ExternalSkillsSection
              totalExternal={hub.totalExternal}
              externalSources={hub.externalSources}
              activeSourceTab={hub.activeSourceTab}
              setActiveSourceTab={hub.setActiveSourceTab}
              activeSource={hub.activeSource}
              filteredExternalSkills={hub.filteredExternalSkills}
              searchExternalQuery={hub.searchExternalQuery}
              setSearchExternalQuery={hub.setSearchExternalQuery}
              refreshing={hub.refreshing}
              onRefresh={() => void hub.handleRefreshExternal()}
              onImport={(path) => void hub.handleImport(path)}
              onImportAll={(skills) => void hub.handleImportAll(skills)}
              onShowAddPathModal={() => hub.setShowAddPathModal(true)}
            />

            <MySkillsSection
              loading={hub.loading}
              availableSkills={hub.availableSkills}
              filteredSkills={hub.filteredSkills}
              skillPaths={hub.skillPaths}
              externalSources={hub.externalSources}
              searchQuery={hub.searchQuery}
              setSearchQuery={hub.setSearchQuery}
              onRefresh={hub.fetchData}
              onDelete={(name) => void hub.handleDelete(name)}
              onManualImport={() => void hub.handleManualImport()}
            />

            {/* Usage Tip */}
            <div className='px-16px md:px-[24px] py-20px bg-base border border-b-base shadow-sm rd-16px flex items-start gap-12px text-t-secondary'>
              <Info size={18} className='text-primary-6 mt-2px shrink-0' />
              <div className='flex flex-col gap-4px'>
                <span className='font-bold text-t-primary text-14px'>
                  {t('settings.skillsHub.tipTitle', { defaultValue: '使用贴士：' })}
                </span>
                <span className='text-13px leading-relaxed'>{t('settings.skillsHub.tipContent')}</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsPageWrapper>

      <AddPathModal
        visible={hub.showAddPathModal}
        customPathName={hub.customPathName}
        customPathValue={hub.customPathValue}
        onCustomPathNameChange={hub.setCustomPathName}
        onCustomPathValueChange={hub.setCustomPathValue}
        onCancel={() => {
          hub.setShowAddPathModal(false);
          hub.setCustomPathName('');
          hub.setCustomPathValue('');
        }}
        onOk={() => void hub.handleAddCustomPath()}
      />
    </>
  );
};

export default SkillsHubSettings;
