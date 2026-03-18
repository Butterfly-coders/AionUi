import { Search } from '@icon-park/react';
import React from 'react';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, className = '' }) => (
  <div className={`relative group shrink-0 ${className}`}>
    <div className='absolute left-12px top-1/2 -translate-y-1/2 text-t-tertiary group-focus-within:text-primary-6 flex pointer-events-none transition-colors'>
      <Search size={15} />
    </div>
    <input
      type='text'
      className='w-full bg-fill-1 hover:bg-fill-2 border border-border-1 focus:border-primary-5 focus:bg-base outline-none rd-8px py-6px pl-36px pr-12px text-13px text-t-primary placeholder:text-t-tertiary transition-all shadow-sm box-border m-0'
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default SearchInput;
