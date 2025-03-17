# Deploying IWC on Raspberry Pi 5

This guide covers the specific steps and considerations for deploying IWC on a Raspberry Pi 5.

## Prerequisites

- Raspberry Pi 5 with at least 4GB RAM
- 64-bit Raspberry Pi OS installed
- Docker and Docker Compose installed
- External storage for database persistence (recommended)
- Proper cooling solution for the Raspberry Pi

## Installation

### 1. Install Docker and Docker Compose

```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -sSL https://get.docker.com | sh

# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in for the group changes to take effect

# Install Docker Compose
sudo apt install -y python3-pip
sudo pip3 install docker-compose
```

### 2. Configure External Storage (Recommended)

For better performance and reliability, it's recommended to use external storage (SSD/HDD) for database files:

```bash
# Assuming external storage is mounted at /mnt/external
sudo mkdir -p /mnt/external/iwc/db
sudo mkdir -p /mnt/external/iwc/uploads
sudo chown -R $USER:$USER /mnt/external/iwc
```

### 3. Configure Environment Variables

Create a `.env` file in your deployment directory:

```bash
# Create deployment directory
mkdir -p ~/iwc
cd ~/iwc

# Create .env file
cat > .env << EOF
DOCKER_REGISTRY=your-registry
TAG=latest
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=iwc_db
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
EXTERNAL_STORAGE_PATH=/mnt/external/iwc/db
UPLOADS_PATH=/mnt/external/iwc/uploads
EOF
```

### 4. Configure Docker Compose

Download the docker-compose.yml file to your deployment directory:

```bash
# Still in the ~/iwc directory
curl -o docker-compose.yml https://raw.githubusercontent.com/your-organization/iwc/main/docker-compose.yml
```

### 5. Start the Services

```bash
docker-compose up -d
```

## Monitoring and Maintenance

### Checking Logs

```bash
# Check logs for all services
docker-compose logs

# Check logs for a specific service
docker-compose logs server
docker-compose logs client
docker-compose logs db
```

### Monitoring Resources

Monitor the resource usage to ensure your Raspberry Pi isn't overloaded:

```bash
# Install Glances for monitoring
sudo apt install -y glances

# Run Glances
glances
```

### Automatic Startup

To ensure the services start automatically after a reboot:

```bash
# Create a system service
sudo nano /etc/systemd/system/iwc.service
```

Add the following content:

```
[Unit]
Description=IWC Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/your-username/iwc
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable iwc.service
sudo systemctl start iwc.service
```

## Performance Considerations

### Swap Configuration

Increase the swap size to help with memory constraints:

```bash
# Check current swap
free -h

# Increase swap to 2GB
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Overclocking (Advanced Users Only)

For advanced users, you can consider mild overclocking to improve performance:

```bash
sudo nano /boot/config.txt
```

Add:
```
# Mild overclocking
over_voltage=2
arm_freq=2200
```

## Backup Strategy

Regular backups are essential:

```bash
# Create a backup script
cat > ~/backup-iwc.sh << EOF
#!/bin/bash
DATE=\$(date +%Y-%m-%d)
BACKUP_DIR=~/backups/\$DATE

mkdir -p \$BACKUP_DIR

# Backup database
docker exec iwc_db pg_dump -U postgres iwc_db > \$BACKUP_DIR/db_backup.sql

# Backup uploads
rsync -av /mnt/external/iwc/uploads/ \$BACKUP_DIR/uploads/

# Compress backup
tar -czf \$BACKUP_DIR.tar.gz \$BACKUP_DIR
rm -rf \$BACKUP_DIR
EOF

chmod +x ~/backup-iwc.sh

# Add to crontab to run daily
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-iwc.sh") | crontab -
```

## Troubleshooting

### Service Fails to Start

Check the logs:
```bash
docker-compose logs
```

### Performance Issues

If experiencing performance issues:
1. Check resource usage with `glances` or `htop`
2. Consider reducing the resource limits in docker-compose.yml
3. Make sure the Raspberry Pi has adequate cooling

### Database Issues

If the database fails to start:
```bash
# Check database logs
docker-compose logs db

# Repair permissions if needed
sudo chown -R $USER:$USER /mnt/external/iwc/db
``` 