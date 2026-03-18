import React from 'react';

type SkillCardProps = {
  name: string;
  description?: string;
  avatar: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
};

const SkillCard: React.FC<SkillCardProps> = ({ name, description, avatar, actions, badge, onClick }) => (
  <div
    className='group flex flex-col sm:flex-row gap-16px p-16px bg-base border border-transparent hover:border-border-1 hover:bg-fill-1 hover:shadow-sm rd-12px transition-all duration-200 cursor-pointer'
    onClick={onClick}
  >
    <div className='shrink-0 flex items-start sm:mt-2px'>{avatar}</div>
    <div className='flex-1 min-w-0 flex flex-col justify-center gap-6px'>
      <div className='flex items-center gap-10px flex-wrap'>
        <h3 className='text-14px font-semibold text-t-primary/90 truncate m-0'>{name}</h3>
        {badge}
      </div>
      {description && (
        <p className='text-13px text-t-secondary leading-relaxed line-clamp-2 m-0' title={description}>
          {description}
        </p>
      )}
    </div>
    {actions && (
      <div className='shrink-0 sm:self-center flex items-center justify-end gap-6px mt-12px sm:mt-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity pl-4px'>
        {actions}
      </div>
    )}
  </div>
);

export default SkillCard;
