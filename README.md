# EyeQ Bot Setup

This guide explains how to install and run the bot on different platforms (Linux, Termux, Windows).

A setup script (`setup.sh`) is included to automate the installation process for Linux and Termux users. It will automatically detect your environment, install the necessary dependencies (`nodejs`, `yarn`, `git`), configure the `@whiskeysockets` module, and prepare the bot to run.

---

## 📱 Termux (Android)

1. Open the Termux app and navigate to the bot's folder:
   ```bash
   cd /sdcard/wa-xl-bot
   ```
2. Give execution permission to the setup script:
   ```bash
   chmod +x setup.sh
   ```
3. Run the setup script:
   ```bash
   bash setup.sh
   ```
4. Start the bot:
   ```bash
   node .
   ```

---

## 🐧 Linux (Ubuntu/Debian)

1. Open your terminal and navigate to the bot's directory:
   ```bash
   cd /path/to/wa-xl-bot
   ```
2. Make the script executable:
   ```bash
   chmod +x setup.sh
   ```
3. Run the setup script (it may prompt for your sudo password to install packages):
   ```bash
   bash setup.sh
   ```
4. Start the bot:
   ```bash
   node .
   ```

---

## 🪟 Windows

On Windows, the `setup.sh` script won't run natively in the standard command prompt, so you'll need to do the steps manually:

1. **Install Node.js & Git:**
   - Download and install [Node.js](https://nodejs.org/) (LTS recommended).
   - Download and install [Git for Windows](https://git-scm.com/).

2. **Install Yarn:**
   Open Command Prompt (CMD) or PowerShell as Administrator and run:
   ```cmd
   npm install -g yarn
   ```

3. **Install Dependencies:**
   Navigate to the bot's folder and run `yarn install`:
   ```cmd
   cd C:\path\to\wa-xl-bot
   yarn install
   ```

4. **Configure @whiskeysockets:**
   - Go to the bot's folder using File Explorer.
   - You will find a folder named `@whiskeysockets` inside the bot's main directory.
   - Go into `node_modules` and delete any existing `@whiskeysockets` folder if there is one.
   - Move or copy the ready-made `@whiskeysockets` folder from the main directory directly into the `node_modules` folder.

5. **Start the bot:**
   ```cmd
   node .
   ```
