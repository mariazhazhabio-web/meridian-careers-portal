import { lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import PublicLayout from './components/layout/PublicLayout.jsx';
import AdminLayout, { RequireAdmin } from './components/layout/AdminLayout.jsx';
import CareersPage from './pages/CareersPage.jsx';
import { JobsPage, JobDetailPage } from './pages/JobPages.jsx';
import ApplyPage from './pages/ApplyPage.jsx';
import ConfirmationPage from './pages/ConfirmationPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import LoginPage from './pages/admin/LoginPage.jsx';
import { ToastProvider, EmptyState, PageLoader } from './components/ui/index.jsx';
import { AuthProvider } from './lib/hooks.js';
import { ROUTER } from './lib/config.js';

// Admin and case-study bundles load on demand so candidates download less JavaScript.
const OverviewPage = lazy(() => import('./pages/admin/OverviewPage.jsx'));
const ApplicationsPage = lazy(() => import('./pages/admin/ApplicationsPage.jsx'));
const JobsAdminPage = lazy(() => import('./pages/admin/JobsAdminPage.jsx'));
const EmailsPage = lazy(() => import('./pages/admin/EmailsPage.jsx'));
const CaseStudyPage = lazy(() => import('./pages/CaseStudyPage.jsx'));

const Router = ROUTER === 'browser' ? BrowserRouter : HashRouter;

function NotFound() {
  return (
    <div className="container-x py-20">
      <EmptyState icon={Compass} title="Page not found" action={<Link to="/" className="btn-primary">Go to careers home</Link>}>
        The page you are looking for doesn't exist or has moved.
      </EmptyState>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<CareersPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/:slug" element={<JobDetailPage />} />
                <Route path="apply" element={<ApplyPage />} />
                <Route path="apply/:slug" element={<ApplyPage />} />
                <Route path="application-submitted/:reference" element={<ConfirmationPage />} />
                <Route path="privacy" element={<PrivacyPage />} />
                <Route path="case-study" element={<CaseStudyPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="admin/login" element={<LoginPage />} />
              <Route
                path="admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<OverviewPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="applications/:id" element={<ApplicationsPage />} />
                <Route path="jobs" element={<JobsAdminPage />} />
                <Route path="emails" element={<EmailsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
