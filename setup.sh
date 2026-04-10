#!/bin/bash

# --- EyeQ xl-Boot Elite Setup ---

# Colors for terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

echo -e "${BLUE}-----------------------------------${NC}"
echo -e "${GREEN}    EyeQ xl-Bot Setup       ${NC}"
echo -e "${BLUE}-----------------------------------${NC}"

WORK_DIR=$(pwd)
echo -e "Directory: ${BLUE}$WORK_DIR${NC}\n"

# 1. Environment Detection & Package Installation
if command -v pkg &> /dev/null; then
    echo -e "${BLUE}[1/4]${NC} Environment: ${GREEN}Termux${NC}"
    echo -n "Updating & Installing dependencies... "
    (pkg update -y && pkg upgrade -y && pkg install git nodejs-lts ffmpeg python libvips -y && pip install yt-dlp) >/dev/null 2>&1 &
    spinner $!
    echo -e "${GREEN}Done${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}[1/4]${NC} Environment: ${GREEN}macOS${NC}"
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}Homebrew not found. Please install it first: https://brew.sh${NC}"
        exit 1
    fi
    echo -n "Installing dependencies via Homebrew... "
    (brew install node ffmpeg python libvips yt-dlp) >/dev/null 2>&1 &
    spinner $!
    echo -e "${GREEN}Done${NC}"
elif command -v apt-get &> /dev/null; then
    echo -e "${BLUE}[1/4]${NC} Environment: ${GREEN}Linux (APT)${NC}"
    echo -n "Updating & Installing dependencies... "
    (sudo apt-get update -y && sudo apt-get install git nodejs npm ffmpeg python3-pip libvips-dev -y && pip3 install yt-dlp) >/dev/null 2>&1 &
    spinner $!
    echo -e "${GREEN}Done${NC}"
else
    echo -e "${RED}[!] Unsupported environment for auto-install. Please install Node.js, FFmpeg, and Python manually.${NC}"
fi

# 2. Node Modules Installation
echo -n -e "${BLUE}[2/4]${NC} Installing Node modules... "
(cd "$WORK_DIR" && npm install) >/dev/null 2>&1 &
spinner $!
echo -e "${GREEN}Done${NC}"

# 3. Baileys Configuration
echo -n -e "${BLUE}[3/4]${NC} Configuring Core Kernel... "
(
    MODULES_WS="$WORK_DIR/node_modules/@whiskeysockets"
    BUNDLED_WS="$WORK_DIR/@whiskeysockets"
    if [ -d "$BUNDLED_WS" ]; then
        rm -rf "$MODULES_WS"
        mkdir -p "$WORK_DIR/node_modules"
        mv "$BUNDLED_WS" "$MODULES_WS"
    fi
) >/dev/null 2>&1 &
spinner $!
echo -e "${GREEN}Done${NC}"

# 4. Finalizing
echo -e "\n${GREEN}Setup successfully finalized.${NC}"
echo -e "Run the following command to start:"
echo -e "${BLUE}node .${NC}\n"
