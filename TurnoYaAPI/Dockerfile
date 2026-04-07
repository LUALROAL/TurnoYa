# ============================================
# Dockerfile para TurnoYa API
# Optimizado para .NET 8.0
# ============================================

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restaurar dependencias primero (optimiza cache)
COPY TurnoYa.API/*.csproj ./TurnoYa.API/
COPY TurnoYa.Application/*.csproj ./TurnoYa.Application/
COPY TurnoYa.Infrastructure/*.csproj ./TurnoYa.Infrastructure/
COPY TurnoYa.Core/*.csproj ./TurnoYa.Core/

RUN dotnet restore TurnoYa.API/TurnoYa.API.csproj

# Copiar todo el código fuente
COPY . .

# Build de la aplicación
WORKDIR /src/TurnoYa.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Instalar curl para health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copiar archivos publicados
COPY --from=build /app/publish .

# Crear directorio para logs
RUN mkdir -p /app/logs

# Puerto HTTP (estándar para contenedores)
EXPOSE 8080
EXPOSE 443

# Variables de entorno
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Usuario no root (recomendado para seguridad)
RUN groupadd -r turnoya && useradd -r -g turnoya turnoya
RUN chown -R turnoya:turnoya /app
USER turnoya

ENTRYPOINT ["dotnet", "TurnoYa.API.dll"]