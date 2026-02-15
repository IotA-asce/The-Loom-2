import { ErrorBoundary } from '@/components/error-boundary';
import { ToastProvider } from '@/components/ui';
import { DevConsole } from '@/components/dev-console';
import { SettingsScreen } from '@/components/settings';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
          {/* Settings Screen */}
          <SettingsScreen />
          
          {/* Developer console (hidden by default) */}
          <DevConsole />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
