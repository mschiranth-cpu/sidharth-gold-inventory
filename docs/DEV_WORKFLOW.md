# Development Workflow - Ativa Jewels

Complete guide for developing on a separate machine and deploying fixes to the
production PC over SSH (via Cloudflare Tunnel).

Production PC details:

| Item | Value |
|---|---|
| SSH host alias | `ativa` |
| Hostname | `ssh.ativa-jewels.com` (via Cloudflare Tunnel) |
| User | `pc` |
| Project path | `D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site` |
| Git remote | `https://github.com/mschiranth-cpu/sidharth-gold-inventory.git` |
| Public URL | `https://ativa-jewels.com` |
| Backend service | NSSM `AtivaGoldInventoryBackend` on port 3000 |

---

## One-time setup on your dev machine

### 1. Install prerequisites

| Tool | Windows | macOS | Linux |
|---|---|---|---|
| Node.js 20+ | `winget install OpenJS.NodeJS` | `brew install node` | `sudo apt install nodejs npm` |
| Git | `winget install Git.Git` | `brew install git` | `sudo apt install git` |
| cloudflared | `winget install Cloudflare.cloudflared` | `brew install cloudflared` | see [cloudflared docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) |
| VS Code or Cursor | pick one | pick one | pick one |
| PostgreSQL 16 (optional, local dev only) | `winget install PostgreSQL.PostgreSQL.16` | `brew install postgresql@16` | `sudo apt install postgresql-16` |

Verify: `node -v`, `git --version`, `cloudflared --version`.

### 2. Install the SSH key from the production PC

You need the **private key** that matches the public key registered on the prod PC
(`C:\ProgramData\ssh\administrators_authorized_keys`). The easiest way to get it is
to SSH into the prod PC once in person (or ask an admin to copy it for you) from:

```
C:\Users\pc\.ssh\id_ed25519       <- private key (keep secret)
C:\Users\pc\.ssh\id_ed25519.pub   <- public key
```

**Windows dev machine:**

```powershell
New-Item -ItemType Directory -Path $HOME\.ssh -Force | Out-Null
Copy-Item .\id_ed25519     $HOME\.ssh\id_ed25519
Copy-Item .\id_ed25519.pub $HOME\.ssh\id_ed25519.pub
icacls "$HOME\.ssh\id_ed25519" /inheritance:r /grant:r "$($env:USERNAME):(F)"
```

**macOS / Linux dev machine:**

```bash
mkdir -p ~/.ssh
cp id_ed25519     ~/.ssh/id_ed25519
cp id_ed25519.pub ~/.ssh/id_ed25519.pub
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### 3. Add the SSH host alias

Append this to `~/.ssh/config` (Windows: `C:\Users\<you>\.ssh\config`):

```
Host ativa
    HostName ssh.ativa-jewels.com
    User pc
    IdentityFile ~/.ssh/id_ed25519
    ProxyCommand cloudflared access ssh --hostname %h
    ServerAliveInterval 30
    ServerAliveCountMax 3
```

Test it:

```bash
ssh ativa "hostname"
```

You should see `DESKTOP-H0F3IQO` (or whatever the prod machine reports).

---

## Getting the project code

### Option 1 - Clone from GitHub (recommended)

```bash
git clone https://github.com/mschiranth-cpu/sidharth-gold-inventory.git
cd sidharth-gold-inventory
```

Install dependencies:

```bash
cd frontend && npm install && cd ..
cd backend  && npm install && cd ..
```

Copy env templates if you plan to run the app locally:

```bash
cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your local Postgres credentials, then:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm run dev          # starts backend on :3001
```

```bash
cd frontend
npm run dev          # starts Vite on :5173
```

### Option 2 - Clone directly from the production PC via SSH

If GitHub is not accessible, you can clone from the prod machine:

```bash
git clone ssh://ativa/D:/AI%20websites/Sidharth%20Gold%20Inventory%20Site/Sidharth%20Gold%20Inventory%20Site sidharth-gold-inventory
```

(The Cloudflare tunnel proxy is picked up from your `~/.ssh/config`.)

---

## Development workflows

Pick whichever fits you.

### Workflow A - Remote edit (simplest, zero local setup)

Use VS Code or Cursor's Remote-SSH extension to edit files **directly on the prod PC**.

1. Install the "Remote - SSH" extension in your editor.
2. `Ctrl+Shift+P` -> **Remote-SSH: Connect to Host** -> pick `ativa`.
3. When connected, open folder: `D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site`.
4. Edit files normally.
5. To deploy: open the VS Code terminal, then:

   ```powershell
   # This uses the scheduled-task trick so you don't need to be in an admin shell.
   schtasks /run /tn "AtivaDeploy"
   # Watch the log (use -Encoding Unicode - the log is a PS 5.1 transcript):
   Get-Content "C:\ProgramData\AtivaDeploy\deploy.log" -Encoding Unicode -Wait -Tail 40
   ```

   (See section "One-time: register the deploy task" below.)

**Pros:** no git push/pull, no sync. Changes are instant.
**Cons:** you need network connectivity to prod while editing.

### Workflow B - Local edit, push to GitHub, deploy on prod

Classic git flow.

```bash
# on your dev machine
git checkout -b fix/my-bug
# ... edit files ...
git commit -am "fix: describe the change"
git push origin fix/my-bug

# open a PR on GitHub, merge to main (or push directly to main if you own the repo)

# now deploy - one of these:
# (a) from your dev machine via remote-deploy helper:
./scripts/remote-deploy.ps1   # Windows dev
./scripts/remote-deploy.sh    # macOS/Linux dev

# (b) or SSH in and run manually:
ssh ativa
cd "D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site"
git pull
schtasks /run /tn "AtivaDeploy"   # triggers elevated deploy
```

### Workflow C - One-command deploy (from dev laptop)

After doing Workflow B's edit + push, just run:

```powershell
# from the repo root on your dev machine
.\scripts\remote-deploy.ps1
```

This script will:
1. SSH into `ativa`.
2. `git pull` on the prod PC.
3. Trigger the `AtivaDeploy` scheduled task (elevated).
4. Stream the deploy log back to your terminal.
5. Hit `https://ativa-jewels.com/health` from your machine to confirm.

macOS/Linux equivalent: `./scripts/remote-deploy.sh`.

---

## One-time: register the deploy task (on the prod PC)

The `deploy.ps1` script needs admin rights. SSH sessions on Windows run with a
filtered (non-elevated) token by default. To work around this cleanly, register
a scheduled task once on the prod PC that can be triggered from any SSH session:

1. RDP or physically access the prod PC.
2. Open **PowerShell as Administrator**.
3. Run:

   ```powershell
   cd "D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site"
   .\scripts\register-deploy-task.ps1
   ```

This creates a scheduled task named `AtivaDeploy` that:
- Runs `deploy.ps1` with highest privileges (no UAC prompt)
- Logs every run to `C:\ProgramData\AtivaDeploy\deploy.log`
- Is on-demand only (not scheduled - triggered by `schtasks /run`)

From that point on, any SSH session can do:

```powershell
schtasks /run /tn "AtivaDeploy"
```

...and the full deploy (build + Prisma + restart services) runs elevated.

---

## Branching conventions

| Branch | Purpose |
|---|---|
| `main` | Production. Every commit here should deploy cleanly. |
| `feature/*` | New features. Merge into `main` when done. |
| `fix/*` | Bug fixes. |
| `hosting-setup` | Historical branch - ignore. |

Rule of thumb: never commit directly to `main` for anything risky - open a PR.

---

## Local dev server vs production service

| | Local dev | Production |
|---|---|---|
| Backend port | `3001` | `3000` |
| Frontend | `http://localhost:5173` (Vite) | served by backend from `frontend/dist/` |
| Database | your local Postgres | prod Postgres on the Ativa PC |
| Service | `npm run dev` in two terminals | `AtivaGoldInventoryBackend` NSSM service |

This separation means you can run a dev server **on the prod PC** (via Remote-SSH)
without affecting the live site - just use port 3001 and Vite's 5173.

---

## Common tasks cheat-sheet

All of these assume you are connected via `ssh ativa`.

```powershell
# Trigger a full deploy (elevated via scheduled task)
schtasks /run /tn "AtivaDeploy"

# Tail the deploy log (PS 5.1 transcript - read as Unicode)
Get-Content C:\ProgramData\AtivaDeploy\deploy.log -Encoding Unicode -Wait -Tail 50

# Check service health
nssm status AtivaGoldInventoryBackend
Get-Service sshd, Cloudflared | Format-Table Name, Status, StartType

# Pull latest code (no admin needed)
cd "D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site"
git pull

# Quick health check without running the full deploy
Invoke-WebRequest http://localhost:3000/health
Invoke-WebRequest https://ativa-jewels.com/health

# Check tunnel connectivity
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel info ativa-jewels-inventory
```

---

## Troubleshooting

### `ssh ativa` times out
Tunnel service is probably down on the prod PC. Either:
- Get someone at the prod PC to run `Start-Service Cloudflared` as admin
- Or run `.\scripts\fix-tunnel.ps1` on the prod PC (was shipped in the original `ativa-dev-access` bundle)

### `Permission denied (publickey)`
Your private key isn't in place or has wrong permissions - redo step 2 above.

### `schtasks /run /tn "AtivaDeploy"` returns "ERROR: The system cannot find the file specified"
The task hasn't been registered yet - run `scripts\register-deploy-task.ps1` once on the prod PC as admin.

### `git pull` fails with "not a git repository"
The SSH session might have landed somewhere unexpected. Confirm with `pwd` and `cd` into the project path manually.

### Deploy runs but public URL is 502
Backend crashed during restart. Check:

```powershell
Get-Content "D:\AI websites\Sidharth Gold Inventory Site\Sidharth Gold Inventory Site\backend\logs\*.log" -Tail 100
```

### Deploy runs but public URL is 1033
Cloudflare Tunnel lost its edge connection. Restart:

```powershell
schtasks /run /tn "AtivaDeploy"   # deploy.ps1 now self-heals the tunnel
# or manually:
Restart-Service Cloudflared
```

---

## File map

```
project root/
├── backend/                    <- Express API (port 3000 prod, 3001 dev)
├── frontend/                   <- Vite + React
├── scripts/
│   ├── deploy.ps1              <- Main deploy (elevated)
│   ├── register-deploy-task.ps1 <- One-time task setup (run on prod as admin)
│   ├── remote-deploy.ps1       <- Run from dev laptop
│   ├── remote-deploy.sh        <- Run from dev laptop (mac/linux)
│   ├── setup-ssh.ps1           <- One-time SSH server setup on prod
│   └── ...
├── prisma/                     <- DB schema & migrations
├── docs/
│   ├── DEV_WORKFLOW.md         <- You are here
│   ├── DEPLOYMENT.md
│   └── ...
└── ativa-dev-access/           <- SSH key bundle (lives outside repo)
```
