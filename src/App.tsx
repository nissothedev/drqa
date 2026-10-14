import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './layouts/AppShell';
import { Dashboard } from './pages/Dashboard';
import { NotFound } from './pages/NotFound';
import { LogoMark } from './components/brand/Logo';

// Modules are code-split so the dashboard loads fast.
const ApiDoctor = lazy(() => import('./modules/api-doctor/ApiDoctorPage'));
const RequestLab = lazy(() => import('./modules/api-request-lab/RequestLabPage'));
const DevTools = lazy(() => import('./modules/devtools/DevToolsPage'));
const ApiFlow = lazy(() => import('./modules/api-flow/ApiFlowPage'));
const ContractValidator = lazy(() => import('./modules/contract-validator/ContractValidatorPage'));
const JsonStudio = lazy(() => import('./modules/json-studio/JsonStudioPage'));
const TestDesigner = lazy(() => import('./modules/test-designer/TestDesignerPage'));
const BugReport = lazy(() => import('./modules/bug-report/BugReportPage'));
const Incident = lazy(() => import('./modules/incident-investigator/IncidentPage'));
const SqlHelper = lazy(() => import('./modules/sql-helper/SqlHelperPage'));
const Regression = lazy(() => import('./modules/regression-planner/RegressionPage'));
const Automation = lazy(() => import('./modules/automation-assistant/AutomationPage'));
const Environments = lazy(() => import('./modules/environment-checker/EnvironmentPage'));
const Knowledge = lazy(() => import('./modules/knowledge-base/KnowledgePage'));

function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-sm text-muted">
        <LogoMark className="size-12" animated />
        טוען מודול…
      </div>
    </div>
  );
}

/**
 * HashRouter is used deliberately: GitHub Pages has no server-side rewrites,
 * so /#/api-doctor style URLs keep refreshes and deep links working.
 */
export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppShell>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/api-doctor" element={<ApiDoctor />} />
              <Route path="/request-lab" element={<RequestLab />} />
              <Route path="/devtools" element={<DevTools />} />
              <Route path="/api-flow" element={<ApiFlow />} />
              <Route path="/contract-validator" element={<ContractValidator />} />
              <Route path="/json-studio" element={<JsonStudio />} />
              <Route path="/test-designer" element={<TestDesigner />} />
              <Route path="/bug-report" element={<BugReport />} />
              <Route path="/incident" element={<Incident />} />
              <Route path="/sql" element={<SqlHelper />} />
              <Route path="/regression" element={<Regression />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/environments" element={<Environments />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppShell>
      </HashRouter>
    </AppProvider>
  );
}
