'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/searches/search-form';
import { SearchCard } from '@/components/searches/search-card';
import { JobList } from '@/components/jobs/job-list';
import { useSearches, useCreateSearch, useDeleteSearch, useFetchJobs, useClearAllJobs } from '@/hooks/use-searches';
import { useJobs, useTodayJobs } from '@/hooks/use-jobs';
import { Briefcase, Plus, RefreshCw, Sparkles, X, Trash2, LogOut } from 'lucide-react';
import { EmploymentType } from '@/types';
import { useAuth } from '@/components/auth-provider';

type SourceFilter = 'all' | 'linkedin' | 'non-linkedin';

export default function Dashboard() {
  const [showNewSearch, setShowNewSearch] = useState(false);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [fetchingSearchId, setFetchingSearchId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const { user, signOut } = useAuth();

  // Data hooks
  const { data: searches = [], isLoading: searchesLoading } = useSearches();
  const { data: todayJobs = [], isLoading: todayLoading } = useTodayJobs();
  const { data: selectedJobs = [], isLoading: jobsLoading } = useJobs(selectedSearchId || undefined);

  // Mutation hooks
  const createSearch = useCreateSearch();
  const deleteSearch = useDeleteSearch();
  const fetchJobs = useFetchJobs();
  const clearAllJobs = useClearAllJobs();

  const handleCreateSearch = async (data: { query: string; location: string; employmentType: EmploymentType }) => {
    await createSearch.mutateAsync(data);
    setShowNewSearch(false);
  };

  const handleDeleteSearch = async (id: string) => {
    if (confirm('Are you sure you want to delete this search?')) {
      await deleteSearch.mutateAsync(id);
      if (selectedSearchId === id) {
        setSelectedSearchId(null);
      }
    }
  };

  const handleFetchJobs = async (searchId: string) => {
    setFetchingSearchId(searchId);
    try {
      await fetchJobs.mutateAsync(searchId);
    } finally {
      setFetchingSearchId(null);
    }
  };

  const handleFetchAll = async () => {
    setFetchingSearchId('all');
    try {
      await fetchJobs.mutateAsync(undefined);
    } finally {
      setFetchingSearchId(null);
    }
  };

  const handleClearAllJobs = async () => {
    if (confirm('Are you sure you want to clear all jobs? This cannot be undone.')) {
      await clearAllJobs.mutateAsync();
    }
  };

  const selectedSearch = selectedSearchId
    ? searches.find(s => s.id === selectedSearchId)
    : null;

  // Filter jobs based on source filter
  const filteredJobs = useMemo(() => {
    const jobsToFilter = selectedSearchId ? selectedJobs : todayJobs;

    if (sourceFilter === 'all') return jobsToFilter;

    return jobsToFilter.filter(job => {
      const hasLinkedIn = job.sources.includes('linkedin');
      if (sourceFilter === 'linkedin') return hasLinkedIn;
      if (sourceFilter === 'non-linkedin') return !hasLinkedIn;
      return true;
    });
  }, [selectedJobs, todayJobs, selectedSearchId, sourceFilter]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text)]">Job Hunt</h1>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {searches.length} tracked searches
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm text-[var(--color-text-muted)] hidden sm:inline">
                  {user.email}
                </span>
              )}
              <Button
                variant="ghost"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-[var(--color-border)]" />
              <Button
                variant="ghost"
                onClick={handleClearAllJobs}
                disabled={clearAllJobs.isPending}
                className="text-[var(--color-error)] hover:bg-red-50"
                title="Clear all jobs"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {searches.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={handleFetchAll}
                  disabled={fetchingSearchId === 'all'}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetchingSearchId === 'all' ? 'animate-spin' : ''}`} />
                  Fetch All
                </Button>
              )}
              <Button onClick={() => setShowNewSearch(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Tracked Searches */}
          <div className="lg:col-span-1 space-y-6">
            {/* New Search Form */}
            {showNewSearch && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <h2 className="font-semibold text-[var(--color-text)]">New Tracked Search</h2>
                  <button
                    onClick={() => setShowNewSearch(false)}
                    className="p-1 rounded-lg hover:bg-[var(--color-bg)] text-[var(--color-text-muted)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </CardHeader>
                <CardContent>
                  <SearchForm
                    onSubmit={handleCreateSearch}
                    isLoading={createSearch.isPending}
                  />
                </CardContent>
              </Card>
            )}

            {/* Searches List */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
                Your Tracked Searches
              </h2>

              {searchesLoading ? (
                <div className="text-center py-8 text-[var(--color-text-muted)]">
                  Loading searches...
                </div>
              ) : searches.length === 0 ? (
                <Card hover={false}>
                  <CardContent className="py-8 text-center">
                    <p className="text-[var(--color-text-muted)] mb-4">
                      No tracked searches yet
                    </p>
                    <Button onClick={() => setShowNewSearch(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {searches.map((search) => (
                    <SearchCard
                      key={search.id}
                      search={search}
                      onDelete={handleDeleteSearch}
                      onFetch={handleFetchJobs}
                      onView={setSelectedSearchId}
                      isFetching={fetchingSearchId === search.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Jobs */}
          <div className="lg:col-span-2">
            {selectedSearch ? (
              // Show jobs for selected search
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                      Jobs for "{selectedSearch.query}"
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {selectedSearch.location || 'Any location'} · {selectedSearch.employmentType === 'all' ? 'All types' : selectedSearch.employmentType}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedSearchId(null)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>

                {/* Source Filter */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-sm text-[var(--color-text-muted)]">Filter:</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSourceFilter('all')}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        sourceFilter === 'all'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                      }`}
                    >
                      All ({selectedJobs.length})
                    </button>
                    <button
                      onClick={() => setSourceFilter('linkedin')}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        sourceFilter === 'linkedin'
                          ? 'bg-[var(--color-linkedin)] text-white'
                          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                      }`}
                    >
                      LinkedIn ({selectedJobs.filter(j => j.sources.includes('linkedin')).length})
                    </button>
                    <button
                      onClick={() => setSourceFilter('non-linkedin')}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        sourceFilter === 'non-linkedin'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                      }`}
                    >
                      Other ({selectedJobs.filter(j => !j.sources.includes('linkedin')).length})
                    </button>
                  </div>
                </div>

                <JobList
                  jobs={filteredJobs}
                  isLoading={jobsLoading}
                  emptyMessage={`No jobs found for "${selectedSearch.query}". Try fetching new jobs.`}
                />
              </div>
            ) : (
              // Show today's jobs
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[var(--color-new-today)]" />
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Today's Jobs
                  </h2>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    ({todayJobs.length} new)
                  </span>
                </div>

                {/* Source Filter for Today's Jobs */}
                {todayJobs.length > 0 && (
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-sm text-[var(--color-text-muted)]">Filter:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSourceFilter('all')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          sourceFilter === 'all'
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                        }`}
                      >
                        All ({todayJobs.length})
                      </button>
                      <button
                        onClick={() => setSourceFilter('linkedin')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          sourceFilter === 'linkedin'
                            ? 'bg-[var(--color-linkedin)] text-white'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                        }`}
                      >
                        LinkedIn ({todayJobs.filter(j => j.sources.includes('linkedin')).length})
                      </button>
                      <button
                        onClick={() => setSourceFilter('non-linkedin')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          sourceFilter === 'non-linkedin'
                            ? 'bg-[var(--color-primary)] text-white'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                        }`}
                      >
                        Other ({todayJobs.filter(j => !j.sources.includes('linkedin')).length})
                      </button>
                    </div>
                  </div>
                )}

                <JobList
                  jobs={filteredJobs}
                  isLoading={todayLoading}
                  emptyMessage="No jobs posted today yet. Try fetching new jobs from your tracked searches."
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
