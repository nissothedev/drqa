import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { StatusBadge } from '../components/ui/Badges';

export function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl gradient-border">
          <Compass className="size-8 text-accent" aria-hidden />
        </div>
        <StatusBadge code={404} size="lg" />
        <h1 className="mt-4 text-2xl font-bold text-fg">העמוד לא נמצא</h1>
        <p className="mt-2 text-sm text-muted">
          אירוני, נכון? לפני שמדווחים באג – בדקו את ה-URL. ייתכן שהנתיב שגוי, ולא שהעמוד "נעלם".
        </p>
        <Link to="/" className="btn btn-primary mt-6">
          חזרה ללוח הבקרה
        </Link>
      </div>
    </div>
  );
}
