#!/bin/bash

echo "Do you want to re-install docker-CE, erasing podman and other previous docker installations? [N/y]"
read answer

if [ "$answer" == "y" ]; then

    echo "AGAIN, Do you want to re-install docker-CE, erasing podman and other previous docker installations? [N/y]"
    read answer
    if [ "$answer" == "y" ]; then

        dnf remove docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        dnf remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine
        dnf -y uninstall podman
        dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
    fi
fi