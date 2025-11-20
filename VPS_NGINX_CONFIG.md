# Nginx Configuration for VPS

Add these settings to your Nginx configuration file on the VPS to fix 504 Gateway Timeout errors.

## File Location
`/etc/nginx/sites-available/jobs.jaiveeru.site`

## Configuration to Add

```nginx
server {
    server_name jobs.jaiveeru.site;
    
    location / {
        proxy_pass http://localhost:3000;  # or your Node.js port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # IMPORTANT: Increase timeouts to prevent 504 errors
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        send_timeout 120s;
        
        # Increase buffer sizes for large file uploads
        client_max_body_size 50M;
        client_body_buffer_size 128k;
        proxy_buffer_size 4k;
        proxy_buffers 4 32k;
        proxy_busy_buffers_size 64k;
    }
    
    # Serve static files directly from Nginx (faster)
    location /uploads {
        alias /home/jaiveeru-jobs/htdocs/jobs.jaiveeru.site/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
```

## Commands to Apply

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/jobs.jaiveeru.site

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

## Alternative: Update Global Nginx Settings

If you want to apply timeouts globally, edit:
```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:
```nginx
http {
    # ... existing config ...
    
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
    client_max_body_size 50M;
}
```

Then reload:
```bash
sudo systemctl reload nginx
```
