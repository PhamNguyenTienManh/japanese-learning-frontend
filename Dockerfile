# syntax=docker/dockerfile:1.7

# Build the React app with Node. Keeping this as a separate stage means the
# final image only contains static files and Nginx.
FROM node:22-alpine AS build

WORKDIR /app

# CRA reads REACT_APP_* at build time, so Railway/local Docker must pass them
# as build args before npm run build.
ARG REACT_APP_API_URL
ARG REACT_APP_FURIGANA_API_URL
ARG REACT_APP_VOICE_ASSESS_API_URL

ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_FURIGANA_API_URL=${REACT_APP_FURIGANA_API_URL}
ENV REACT_APP_VOICE_ASSESS_API_URL=${REACT_APP_VOICE_ASSESS_API_URL}
ENV GENERATE_SOURCEMAP=false

# Copy only package metadata first so npm ci can be cached between source edits.
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy source after dependencies and build the production artifact.
COPY . .
RUN npm run build

# Runtime image: Nginx serves only the compiled React build.
FROM nginx:1.27-alpine AS runtime

# Railway injects PORT. Defaulting to 8080 keeps local docker run simple.
ENV PORT=8080

# Official nginx image renders templates in /etc/nginx/templates with envsubst.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 8080

# Railway can target /health, and this also catches broken Nginx startup locally.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["nginx", "-g", "daemon off;"]
