// Bulletproof cross-origin downloader for installers and binary payloads
// Solves Chrome/Edge cross-origin download attribute restrictions and Supabase Storage attachments

export interface DownloadProgressState {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progress?: number; // 0 - 100
  filename?: string;
  errorMessage?: string;
}

export const getInstallerDownloadUrl = (installerName: string): string => {
  return `https://wgxxitydatuoyjnxuvqw.supabase.co/storage/v1/object/public/installers/${installerName}?download=${encodeURIComponent(installerName)}&v=${Date.now()}`;
};

export const downloadInstaller = async (
  installerName: string,
  onStateChange?: (state: DownloadProgressState) => void
): Promise<void> => {
  const url = getInstallerDownloadUrl(installerName);

  if (onStateChange) {
    onStateChange({ status: 'downloading', filename: installerName, progress: 10 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    if (onStateChange) {
      onStateChange({ status: 'downloading', filename: installerName, progress: 60 });
    }

    const blob = await response.blob();
    // Wrap in standard application/octet-stream so Windows / browser saves it as executable binary
    const fileBlob = new Blob([blob], { type: 'application/octet-stream' });
    const blobUrl = window.URL.createObjectURL(fileBlob);

    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = installerName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Clean up memory after browser captures download stream
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 15000);

    if (onStateChange) {
      onStateChange({ status: 'completed', filename: installerName, progress: 100 });
      setTimeout(() => {
        onStateChange({ status: 'idle' });
      }, 3500);
    }
  } catch (err: any) {
    console.warn('[Downloader] Fetch blob failed, falling back to direct location assign:', err);
    
    // Direct location navigation fallback
    try {
      const fallbackAnchor = document.createElement('a');
      fallbackAnchor.href = url;
      fallbackAnchor.download = installerName;
      fallbackAnchor.target = '_blank';
      fallbackAnchor.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackAnchor);
      fallbackAnchor.click();
      document.body.removeChild(fallbackAnchor);

      if (onStateChange) {
        onStateChange({ status: 'completed', filename: installerName });
        setTimeout(() => onStateChange({ status: 'idle' }), 3000);
      }
    } catch (fallbackErr: any) {
      if (onStateChange) {
        onStateChange({ 
          status: 'error', 
          filename: installerName, 
          errorMessage: fallbackErr?.message || 'Download failed to initialize.' 
        });
      }
      // Absolute last resort
      window.location.assign(url);
    }
  }
};
