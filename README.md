<div align="center">

<h1>EyeQ Bot — Setup</h1>

<p>WhatsApp bot powered by Baileys · Node.js — Minimalistic & Powerful</p>

<a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-LTS-green?style=for-the-badge&logo=node.js" alt="Node.js"></a>
<a href="https://git-scm.com"><img src="https://img.shields.io/badge/Git-Latest-orange?style=for-the-badge&logo=git" alt="Git"></a>
<a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>

---

</div>

<h2>Prerequisites</h2>

<p>Before you start, ensure you have the following tools installed. These are essential for the bot to handle media and processing.</p>

| Tool | Purpose | Status |
| :--- | :--- | :--- |
| **Node.js** | Core Logic | Required |
| **Git** | Repository Management | Required |
| **FFmpeg** | Media Processing | Required |
| **libvips** | Image Optimization | Required |
| **Python** | Engine Support | Required |
| **yt-dlp** | YouTube Downloader | Required |

---

<h2>Android — Termux</h2>

<p><strong>1. Update environment & install tools</strong></p>
<pre><code>pkg update -y && pkg upgrade -y
pkg install -y nodejs git yarn python ffmpeg libvips
pip install yt-dlp</code></pre>

<p><strong>2. Clone the repository</strong></p>
<pre><code>git clone https://github.com/EyeQ-Root/wa-xl-bot.git
cd wa-xl-bot</code></pre>

<p><strong>3. Run setup & Start</strong></p>
<pre><code>chmod +x setup.sh
bash setup.sh
node .</code></pre>

---

<h2>macOS — Homebrew</h2>

<p><strong>1. Install Homebrew</strong> (Skip if already installed)</p>
<pre><code>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"</code></pre>

<p><strong>2. Install prerequisites</strong></p>
<pre><code>brew install node git ffmpeg libvips python yt-dlp
npm install -g yarn</code></pre>

<p><strong>3. Clone & Execute</strong></p>
<pre><code>git clone https://github.com/EyeQ-Root/wa-xl-bot.git
cd wa-xl-bot
chmod +x setup.sh
./setup.sh
node .</code></pre>

---

<h2>Linux — Ubuntu / Debian</h2>

<p><strong>1. Install System Dependencies</strong></p>
<pre><code>curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs git ffmpeg libvips-dev python3-pip
sudo npm install -g yarn
pip3 install yt-dlp</code></pre>

<p><strong>2. Clone & Setup</strong></p>
<pre><code>git clone https://github.com/EyeQ-Root/wa-xl-bot.git [Copy]
cd wa-xl-bot [Copy]
chmod +x setup.sh [Copy]
bash setup.sh [Copy]
node .</code></pre> [Copy]

---

<h2>Windows</h2>

<p><strong>1. Install Core Tools</strong></p>
<ul>
    <li><a href="https://nodejs.org/">Node.js LTS</a></li>
    <li><a href="https://git-scm.com/">Git for Windows</a></li>
    <li><a href="https://www.python.org/downloads/">Python 3</a> (Check <strong>"Add to PATH"</strong>)</li>
</ul>

<p><strong>2. Install FFmpeg & libvips</strong> (via <a href="https://scoop.sh/">Scoop</a>)</p>
<pre><code># Open PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop install ffmpeg vips</code></pre>

<p><strong>3. Additional Packages</strong></p>
<pre><code>npm install -g yarn
pip install yt-dlp</code></pre>

<p><strong>4. Final Steps</strong></p>
<pre><code>git clone https://github.com/EyeQ-Root/wa-xl-bot.git
cd wa-xl-bot
yarn install
node .</code></pre>

---

<h2>Contact & Support</h2>

<p>Need help? Connect with us through any of these platforms:</p>

<div align="left">
    <a href="https://www.instagram.com/z.xrqr"><img src="https://img.shields.io/badge/Instagram-%23E4405F.svg?style=for-the-badge&logo=Instagram&logoColor=white" alt="Instagram"></a>
    <a href="https://t.me/x81sq"><img src="https://img.shields.io/badge/Telegram-%2326A8ED.svg?style=for-the-badge&logo=Telegram&logoColor=white" alt="Telegram"></a>
    <a href="https://wa.me/201006741515"><img src="https://img.shields.io/badge/WhatsApp-%2325D366.svg?style=for-the-badge&logo=WhatsApp&logoColor=white" alt="WhatsApp"></a>
</div>

---

<div align="center">
    <p>Developed by <a href="https://github.com/EyeQ-Root">EyeQ-Root</a></p>
</div>


