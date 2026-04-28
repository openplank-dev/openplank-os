#!/bin/bash
# openPlank OS — live-build Configuration
# Run this inside iso/ to configure the build

lb config \
    --distribution bookworm \
    --architecture amd64 \
    --binary-images iso-hybrid \
    --memtest none \
    --apt-indices false \
    --apt-recommends false \
    --debconf-frontend noninteractive \
    --debian-installer live \
    --debian-installer-gui true \
    --bootappend-live "boot=live components quiet splash" \
    --iso-application "openPlank OS" \
    --iso-publisher "openPlank <https://openplank.dev>" \
    --iso-volume "openPlank OS 0.1.0" \
    --linux-packages "linux-image linux-headers"
