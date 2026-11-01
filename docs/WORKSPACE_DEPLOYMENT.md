# Deploy this workspace to the production folder

This workspace is the master copy for application changes. The Windows service runs from:

```text
D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site
```

Use `scripts/deploy-workspace.ps1` to deploy between these folders on this machine. It does not commit, pull, or switch Git branches. Do not combine this workflow with the older `deploy.ps1`, `remote-deploy.ps1`, or `AtivaDeploy` scheduled task: those helpers follow a different deployment process and may run Git or database operations.

Production serves compiled `backend/dist` and `frontend/dist` files. Copying source alone does not update the running application.

## Setup, preview, and validation

Run commands from this repository root in PowerShell:

```powershell
Set-Location 'D:\Main Core Coding files - Websites\ativa-dev-setup\ativa-dev-setup\sidharth-gold-inventory'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1
```

The default is a preview. Review the production path, changed files, required builds, and any blockers before applying. Preview does not deploy files or restart the service.

One-time setup records a verified baseline of production source and compiled output:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1 -Initialize
```

The initial setup found source line-ending differences and backend/root dependency lockfile differences. Production lockfiles were adopted in the workspace; no packages were installed and source formatting was preserved. Original metadata is retained in `.deployments/setup-backup-20261022-153958`.

To build both applications in an isolated staging directory without writing production files:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1 -Validate
```

Frontend validation uses the existing Vite build pipeline, not a full TypeScript typecheck. Backend compilation uses TypeScript with `noEmitOnError`.

## Apply

After checking the change and its preview:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1 -Apply
```

Use an elevated PowerShell session when the deployment needs to control the backend service. The helper checks production source and compiled output against its baseline, blocking unexpected production drift before writes. It uses a machine-wide target lock and a workspace lock to prevent concurrent deployments. Source comparisons ignore LF/CRLF differences; binary files are compared exactly.

The helper builds staged output before changing production and saves previous affected files plus a JSON manifest under `.deployments`. For backend source/configuration changes, it stops `AtivaGoldInventoryBackend` only after builds and backup succeed, copies files, then starts the service and checks readiness. Frontend-only or documentation changes do not restart it. Keep the printed deployment ID for recovery.

Vite reads production frontend environment settings programmatically without copying `.env`. Old hashed frontend assets are retained for already-open browser tabs. Verification checks readiness, the served frontend entry point and assets, and matching file content. Also check the changed business workflow in the live application; build and HTTP checks do not establish that every business workflow is correct.

An alternate production root can be specified explicitly, including for a preview:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1 -ProductionRoot 'D:\path\to\production'
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1 -ProductionRoot 'D:\path\to\production' -Apply
```

## Deployment scope

The helper uses an explicit allowlist for application source, frontend public files, supported manifests/configuration, and project scripts/documentation. It does not mirror the entire repository. Secrets, `.env` files, databases, uploaded files, runtime logs, dependencies, and Git metadata remain outside source syncing.

Changed package manifests, lockfiles, or any Prisma files block this routine deployment. Handle dependency or database changes separately, with the appropriate backup and review, before retrying. This helper does not install dependencies, regenerate Prisma, apply database migrations, or run application test suites. Do not run database-writing test suites against production.

Make future code changes in this workspace and deploy them through the helper. Avoid independent production edits, which the next deployment could overwrite.

## Recovery

If applying or verifying a deployment fails after production files have changed, the helper attempts to restore the affected source and build files from that deployment's snapshot. Check its recovery result and the running application before retrying.

Only the latest successful deployment can be rolled back. Preview using its printed ID:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1 -Rollback '<deployment-id>'
```

Apply it after reviewing the preview:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\deploy-workspace.ps1 -Rollback '<deployment-id>' -Apply
```

Rollback restores the production files recorded in the snapshot. If rollback health verification fails, the helper also attempts to restore the deployed state. Check the recovery result before retrying.

Rollback leaves workspace source current, so its changes remain pending for deployment. Correct or revert those changes before deploying again. Rollback does not restore business data. Keep `.deployments` available until the release is verified; these local snapshots are not database or off-machine backups.
