import { ipcBridge } from '@/common';
import { Message } from '@arco-design/web-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExternalSource, SkillInfo } from '../types';

export const useSkillsHub = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<SkillInfo[]>([]);
  const [skillPaths, setSkillPaths] = useState<{ userSkillsDir: string; builtinSkillsDir: string } | null>(null);
  const [externalSources, setExternalSources] = useState<ExternalSource[]>([]);
  const [activeSourceTab, setActiveSourceTab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExternalQuery, setSearchExternalQuery] = useState('');
  const [showAddPathModal, setShowAddPathModal] = useState(false);
  const [customPathName, setCustomPathName] = useState('');
  const [customPathValue, setCustomPathValue] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return availableSkills;
    const lowerQuery = searchQuery.toLowerCase();
    return availableSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) || (s.description && s.description.toLowerCase().includes(lowerQuery))
    );
  }, [availableSkills, searchQuery]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const skills = await ipcBridge.fs.listAvailableSkills.invoke();
      setAvailableSkills(skills);

      const external = await ipcBridge.fs.detectAndCountExternalSkills.invoke();
      if (external.success && external.data) {
        setExternalSources(external.data);
        if (external.data.length > 0 && !activeSourceTab) {
          setActiveSourceTab(external.data[0].source);
        }
      }

      const paths = await ipcBridge.fs.getSkillPaths.invoke();
      setSkillPaths(paths);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      Message.error(t('settings.skillsHub.fetchError', { defaultValue: 'Failed to fetch skills' }));
    } finally {
      setLoading(false);
    }
  }, [t, activeSourceTab]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleImport = useCallback(
    async (skillPath: string) => {
      try {
        const result = await ipcBridge.fs.importSkillWithSymlink.invoke({ skillPath });
        if (result.success) {
          Message.success(
            result.msg || t('settings.skillsHub.importSuccess', { defaultValue: 'Skill imported successfully' })
          );
          void fetchData();
        } else {
          Message.error(result.msg || t('settings.skillsHub.importFailed', { defaultValue: 'Failed to import skill' }));
        }
      } catch (error) {
        console.error('Failed to import skill:', error);
        Message.error(t('settings.skillsHub.importError', { defaultValue: 'Error importing skill' }));
      }
    },
    [t, fetchData]
  );

  const handleImportAll = useCallback(
    async (skills: Array<{ name: string; path: string }>) => {
      let successCount = 0;
      for (const skill of skills) {
        try {
          const result = await ipcBridge.fs.importSkillWithSymlink.invoke({ skillPath: skill.path });
          if (result.success) successCount++;
        } catch {
          // continue
        }
      }
      if (successCount > 0) {
        Message.success(
          t('settings.skillsHub.importAllSuccess', {
            count: successCount,
            defaultValue: `${successCount} skills imported`,
          })
        );
        void fetchData();
      }
    },
    [t, fetchData]
  );

  const handleDelete = useCallback(
    async (skillName: string) => {
      try {
        const result = await ipcBridge.fs.deleteSkill.invoke({ skillName });
        if (result.success) {
          Message.success(result.msg || t('settings.skillsHub.deleteSuccess', { defaultValue: 'Skill deleted' }));
          void fetchData();
        } else {
          Message.error(result.msg || t('settings.skillsHub.deleteFailed', { defaultValue: 'Failed to delete skill' }));
        }
      } catch (error) {
        console.error('Failed to delete skill:', error);
        Message.error(t('settings.skillsHub.deleteError', { defaultValue: 'Error deleting skill' }));
      }
    },
    [t, fetchData]
  );

  const handleManualImport = useCallback(async () => {
    try {
      const result = await ipcBridge.dialog.showOpen.invoke({
        properties: ['openDirectory'],
      });
      if (result && result.length > 0) {
        await handleImport(result[0]);
      }
    } catch (error) {
      console.error('Failed to open directory dialog:', error);
    }
  }, [handleImport]);

  const handleRefreshExternal = useCallback(async () => {
    setRefreshing(true);
    try {
      const external = await ipcBridge.fs.detectAndCountExternalSkills.invoke();
      if (external.success && external.data) {
        setExternalSources(external.data);
        if (external.data.length > 0 && !external.data.find((s) => s.source === activeSourceTab)) {
          setActiveSourceTab(external.data[0].source);
        }
      }
      Message.success(t('common.refreshSuccess', { defaultValue: 'Refreshed' }));
    } catch (error) {
      console.error('Failed to refresh external skills:', error);
    } finally {
      setRefreshing(false);
    }
  }, [t, activeSourceTab]);

  const handleAddCustomPath = useCallback(async () => {
    if (!customPathName.trim() || !customPathValue.trim()) return;
    try {
      const result = await ipcBridge.fs.addCustomExternalPath.invoke({
        name: customPathName.trim(),
        path: customPathValue.trim(),
      });
      if (result.success) {
        setShowAddPathModal(false);
        setCustomPathName('');
        setCustomPathValue('');
        void handleRefreshExternal();
      } else {
        Message.error(result.msg || 'Failed to add path');
      }
    } catch (_error) {
      Message.error('Failed to add custom path');
    }
  }, [customPathName, customPathValue, handleRefreshExternal]);

  const totalExternal = externalSources.reduce((sum, src) => sum + src.skills.length, 0);
  const activeSource = externalSources.find((s) => s.source === activeSourceTab);

  const filteredExternalSkills = useMemo(() => {
    if (!activeSource) return [];
    if (!searchExternalQuery.trim()) return activeSource.skills;
    const lowerQuery = searchExternalQuery.toLowerCase();
    return activeSource.skills.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) || (s.description && s.description.toLowerCase().includes(lowerQuery))
    );
  }, [activeSource, searchExternalQuery]);

  return {
    loading,
    refreshing,
    availableSkills,
    filteredSkills,
    skillPaths,
    externalSources,
    activeSourceTab,
    setActiveSourceTab,
    searchQuery,
    setSearchQuery,
    searchExternalQuery,
    setSearchExternalQuery,
    showAddPathModal,
    setShowAddPathModal,
    customPathName,
    setCustomPathName,
    customPathValue,
    setCustomPathValue,
    totalExternal,
    activeSource,
    filteredExternalSkills,
    fetchData,
    handleImport,
    handleImportAll,
    handleDelete,
    handleManualImport,
    handleRefreshExternal,
    handleAddCustomPath,
  };
};
