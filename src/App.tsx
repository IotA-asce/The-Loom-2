import { ErrorBoundary } from '@/components/feedback';
import { ToastProvider } from '@/components/ui';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">The Loom 2</h1>
              <p className="text-muted-foreground">Manga branching narrative generator</p>
            </div>
          </div>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
