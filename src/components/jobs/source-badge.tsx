import { Badge } from '@/components/ui/badge';
import { Source } from '@/types';

const sourceLabels: Record<Source, string> = {
  google: 'Google',
  indeed: 'Indeed',
  linkedin: 'LinkedIn',
};

interface SourceBadgeProps {
  source: Source;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <Badge variant={source}>
      {sourceLabels[source]}
    </Badge>
  );
}

interface SourceBadgesProps {
  sources: Source[];
}

export function SourceBadges({ sources }: SourceBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {sources.map((source) => (
        <SourceBadge key={source} source={source} />
      ))}
    </div>
  );
}
