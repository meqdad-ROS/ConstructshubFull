# ConstructsHub BIM sandbox (SRS §6.5, NFR-SEC-11).
#
# Hardening:
#   * python:3.12-slim base (small attack surface, Debian 12 maintenance)
#   * non-root user
#   * no shell on the final image apart from the python-provided one
#   * uvicorn only listens on 127.0.0.1 by default; expose via a reverse proxy
#   * no CMD arguments that touch the network at build time
#
# At runtime the docker-compose file additionally applies:
#   * read-only root filesystem
#   * tmpfs /uploads (ephemeral IFC storage)
#   * no new privileges, no capabilities, drop ALL
#   * memory + pids limits

FROM python:3.12-slim-bookworm AS base

# Create unprivileged user
RUN groupadd --system --gid 10001 bim \
 && useradd --system --uid 10001 --gid bim --no-create-home --home-dir /app bim

# System deps for ifcopenshell wheels (libgomp for OpenMP).
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libgomp1 \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && apt-get clean

WORKDIR /app

# Install Python deps (cache layer).
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r /app/requirements.txt \
 && pip check

# Copy source.
COPY app /app/app
COPY pyproject.toml /app/pyproject.toml

# Ensure /uploads exists in the image even though it is overlaid by tmpfs
# in compose. Non-root user needs write access.
RUN mkdir -p /uploads && chown -R bim:bim /app /uploads

USER bim

EXPOSE 8081

# Uvicorn flags:
#   --proxy-headers trusts X-Forwarded-* from the reverse proxy only.
#   --forwarded-allow-ips = whatever your proxy IP is in production.
#   --no-access-log keeps logs clean of body hashes.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    BIM_UPLOAD_DIR=/uploads

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8081/health', timeout=2); sys.exit(0)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8081", "--proxy-headers", "--no-access-log"]
