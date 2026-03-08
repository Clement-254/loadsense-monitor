import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Share, MoreVertical, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm space-y-6">
        <div className="p-4 rounded-2xl bg-primary/10 inline-block">
          <Smartphone size={48} className="text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Install SLMRS</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Install the Smart Load Monitoring and Reporting System on your device for the best experience.
          </p>
        </div>

        {isInstalled ? (
          <div className="bg-primary/10 border border-primary rounded-xl p-4">
            <p className="text-sm font-medium text-primary">✓ App is already installed!</p>
            <p className="text-xs text-muted-foreground mt-1">Open it from your home screen.</p>
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="w-full gap-2">
            <Download size={18} />
            Install Now
          </Button>
        ) : isIOS ? (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-left">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">How to install on iOS</p>
            <div className="flex items-center gap-3">
              <Share size={18} className="text-primary shrink-0" />
              <p className="text-sm text-foreground">Tap the <strong>Share</strong> button in Safari</p>
            </div>
            <div className="flex items-center gap-3">
              <Plus size={18} className="text-primary shrink-0" />
              <p className="text-sm text-foreground">Select <strong>"Add to Home Screen"</strong></p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-left">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">How to install</p>
            <div className="flex items-center gap-3">
              <MoreVertical size={18} className="text-primary shrink-0" />
              <p className="text-sm text-foreground">Tap the <strong>browser menu</strong> (⋮)</p>
            </div>
            <div className="flex items-center gap-3">
              <Download size={18} className="text-primary shrink-0" />
              <p className="text-sm text-foreground">Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong></p>
            </div>
          </div>
        )}

        <a href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors inline-block">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
