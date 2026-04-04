#!/bin/bash

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

echo "Starting Bot Setup..."
echo "-----------------------------------"

WORK_DIR=$(pwd)
echo "Current directory detected: $WORK_DIR"
echo ""

if command -v pkg &> /dev/null; then
    echo -n "Updating packages (Termux)... "
    (pkg update -y && pkg upgrade -y) >/dev/null 2>&1 &
    spinner $!
    echo "Done"

    echo -n "Installing dependencies (git, nodejs, nodejs-lts, yarn)... "
    (pkg install git nodejs nodejs-lts yarn -y) >/dev/null 2>&1 &
    spinner $!
    echo "Done"
elif command -v apt-get &> /dev/null; then
    echo -n "Updating packages (Linux)... "
    (sudo apt-get update -y) >/dev/null 2>&1 &
    spinner $!
    echo "Done"

    echo -n "Installing dependencies... "
    (sudo apt-get install git nodejs npm -y && sudo npm install -g yarn) >/dev/null 2>&1 &
    spinner $!
    echo "Done"
else
    echo "No supported package manager found (pkg/apt). Skipping system dependencies installation..."
fi

echo -n "Running yarn install in $WORK_DIR... "
(cd "$WORK_DIR" && yarn install) >/dev/null 2>&1 &
spinner $!
echo "Done"

echo -n "Configuring @whiskeysockets... "
(
    MODULES_WS="$WORK_DIR/node_modules/@whiskeysockets"
    BUNDLED_WS="$WORK_DIR/@whiskeysockets"

    if [ -d "$MODULES_WS" ]; then
        rm -rf "$MODULES_WS"
    fi

    mkdir -p "$WORK_DIR/node_modules"


    if [ -d "$BUNDLED_WS" ]; then
        mv "$BUNDLED_WS" "$MODULES_WS"
    fi
) >/dev/null 2>&1 &
spinner $!
echo "Done"

echo ""
echo "Setup completed successfully."
echo "To start the bot, run: node ."
echo "node ."