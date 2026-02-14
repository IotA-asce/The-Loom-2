import { ErrorBoundary } from '@/components/error-boundary';
import { ToastContainer } from '@/components/toast';
import { DevConsole } from '@/components/dev-console';
import { SettingsScreen } from '@/components/settings';

function App() {
  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        {/* Settings Screen */}
        <SettingsScreen />
        
        {/* Toast notifications */}
        <ToastContainer />
        
        {/* Developer console (hidden by default) */}
        <DevConsole />
      </div>
    </ErrorBoundary>
  );
}

export default App;
