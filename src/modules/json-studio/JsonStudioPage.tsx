import { useSearchParams } from 'react-router-dom';
import { Braces, Columns2, Crosshair, Sparkles } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { FormatTab } from './FormatTab';
import { DiffTab } from './DiffTab';
import { ExploreTab } from './ExploreTab';

type Tab = 'format' | 'diff' | 'explore';
const TABS: Tab[] = ['format', 'diff', 'explore'];

export default function JsonStudioPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab') as Tab | null;
  const tab: Tab = raw && TABS.includes(raw) ? raw : 'format';

  return (
    <div>
      <PageHeader
        icon={Braces}
        eyebrow="JSON Studio"
        title="JSON Studio"
        description="כלי JSON אמיתיים שרצים בדפדפן: בדיקת תחביר עם מיקום השגיאה, עיצוב וכיווץ, השוואה מבנית בין שני מסמכים וסיור בנתיבים. שום תוכן לא נשמר ולא נשלח."
      />
      <Tabs
        className="mb-5 w-fit"
        ariaLabel="כלי JSON Studio"
        value={tab}
        onChange={(t) => setParams(t === 'format' ? {} : { tab: t }, { replace: true })}
        tabs={[
          { id: 'format', label: 'אימות ועיצוב', icon: Sparkles },
          { id: 'diff', label: 'השוואה', icon: Columns2 },
          { id: 'explore', label: 'סייר נתיבים', icon: Crosshair },
        ]}
      />
      {tab === 'format' && <FormatTab />}
      {tab === 'diff' && <DiffTab />}
      {tab === 'explore' && <ExploreTab />}
    </div>
  );
}
