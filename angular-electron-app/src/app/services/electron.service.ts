import { Injectable } from '@angular/core';

export interface PlatformInfo {
  platform: string;
  arch: string;
  version: string;
}

declare global {
  interface Window {
    electronAPI?: {
      getVersion: () => Promise<string>;
      getPlatformInfo: () => Promise<PlatformInfo>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  public get isElectron(): boolean {
    return !!(window && window.electronAPI);
  }

  public async getAppVersion(): Promise<string> {
    if (this.isElectron && window.electronAPI) {
      return await window.electronAPI.getVersion();
    }
    return 'Web Preview (Angular standalone)';
  }

  public async getPlatformDetails(): Promise<PlatformInfo> {
    if (this.isElectron && window.electronAPI) {
      return await window.electronAPI.getPlatformInfo();
    }
    return {
      platform: 'browser',
      arch: navigator.userAgent.includes('x64') ? 'x64' : 'unknown',
      version: 'Web Client'
    };
  }
}
