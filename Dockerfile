# ── Vamshi Fitness Frontend ──
FROM nginx:alpine

# Copy frontend file
COPY index.html /usr/share/nginx/html/index.html

# Copy Nginx config — proxies /api/* to backend:5000
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
