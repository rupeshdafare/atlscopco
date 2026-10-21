# Atlas Copco Industrial Desktop Suite (Angular + Electron)

A high-performance Windows desktop application built with modern **Angular**, **Angular Material**, **TypeScript**, and **Electron**, powered entirely by **in-memory reactive RxJS data services** (no backend server or external database required).

---

## 1. Architecture & Technology Stack

- **Angular (v22+)**: Standalone component architecture with signals and async animation providers.
- **Angular Material & CDK**: Modern industrial design using cards, tables, dialogs, forms, chips, toolbars, and snackbars.
- **Electron (v45+)**: Chromium & Node.js desktop wrapper configured securely with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- **RxJS**: Reactive state management via `BehaviorSubject` and derived metric streams.
- **Zero External Dependencies**: All CRUD operations, filtering, metrics, and search operate locally in-memory.

---

## 2. Project Structure

```text
angular-electron-app/
├── electron/
│   ├── main.js                  # Electron main process (window lifecycle, IPC handlers)
│   └── preload.js               # Secure contextBridge exposing window.electronAPI
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── equipment-dialog/ # Angular Material Modal Dialog (Create/Edit)
│   │   ├── data/
│   │   │   └── mock-equipment.data.ts # Local in-memory initial factory mock dataset
│   │   ├── models/
│   │   │   └── equipment.model.ts     # TypeScript data contracts & status types
│   │   ├── services/
│   │   │   ├── electron.service.ts    # Safe bridge detecting Desktop vs Web & IPC
│   │   │   └── equipment.service.ts   # Reactive in-memory CRUD & live summary stats
│   │   ├── app.config.ts        # App configuration with animations and routing
│   │   ├── app.html             # Industrial monitoring UI layout
│   │   ├── app.scss             # Custom modern desktop styles & dark toolbar
│   │   └── app.ts               # Root component controller
│   ├── index.html               # Base HTML with Material Icons & Roboto font
│   └── styles.scss              # Global design tokens and desktop scrollbar styling
├── angular.json                 # Configured with relative baseHref ("./") and dist output
├── package.json                 # Dev & desktop orchestration scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 3. Available npm Commands

Navigate to the project folder first:
```powershell
cd angular-electron-app
```

### Install Dependencies
```powershell
npm install
```

### 1. Launch Electron Desktop App (Development Mode)
Starts the Angular live-reload development server and launches Electron desktop window once port 4200 is ready:
```powershell
npm run electron:dev
```

### 2. Build Angular Application for Production
Compiles the production bundle to `dist/angular-electron-app/browser`:
```powershell
npm run build
# or
npm run build:prod
```

### 3. Launch Electron with Production Build
Opens the Electron desktop window pointing to the compiled distribution bundle (`index.html`):
```powershell
npm run electron:prod
```

### 4. Run Angular Standalone in Web Browser
Launches only the Angular web server accessible at `http://localhost:4200`:
```powershell
npm start
```

---

## 4. Key Security & Desktop Configurations

1. **Secure Preload (`electron/preload.js`)**:
   - `contextBridge.exposeInMainWorld('electronAPI', { ... })` selectively exposes safe APIs without granting full Node.js privileges to web views.
2. **Context Isolation (`electron/main.js`)**:
   - `contextIsolation: true`
   - `nodeIntegration: false`
   - `sandbox: true`
3. **Relative Base Path (`angular.json` & `index.html`)**:
   - Configured with `baseHref: "./"` to enable direct file system protocol loading (`file://`) required when running compiled Electron production binaries.
