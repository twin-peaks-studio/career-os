'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Briefcase, Plus } from 'lucide-react';
import { EmploymentType } from '@/types';

interface SearchFormProps {
  onSubmit: (data: { query: string; location: string; employmentType: EmploymentType }) => void;
  isLoading?: boolean;
}

const employmentOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

export function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSubmit({ query: query.trim(), location: location.trim(), employmentType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Job Title Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Job title, keywords, or company"
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)]
                     focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]
                     outline-none transition-all text-[var(--color-text)]
                     placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="flex gap-3">
        {/* Location Input */}
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (or 'Remote')"
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[var(--color-border)]
                       focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]
                       outline-none transition-all text-[var(--color-text)]
                       placeholder:text-[var(--color-text-muted)]"
          />
        </div>

        {/* Employment Type Select */}
        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] z-10" />
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
            className="appearance-none pl-12 pr-10 py-3 rounded-xl border border-[var(--color-border)]
                       focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]
                       outline-none transition-all text-[var(--color-text)]
                       bg-white cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.25em 1.25em',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {employmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!query.trim() || isLoading}
        size="lg"
        className="w-full"
      >
        <Plus className="w-5 h-5 mr-2" />
        {isLoading ? 'Creating...' : 'Create Tracked Search'}
      </Button>
    </form>
  );
}
