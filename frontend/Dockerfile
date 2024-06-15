# Step 1: Build the Vue.js application
FROM node:16 AS build-stage
WORKDIR /app
COPY package*.json ./

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"


# Install nginx
RUN apt-get update && apt-get install -y nginx


RUN bun install
COPY . .
RUN bun run build

# Step 2: Serve the application from Nginx
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80



# Optionally customize the default Nginx configuration
# For example, to handle SPA routing:




COPY nginx.conf /etc/nginx/nginx.conf 

EXPOSE 80
