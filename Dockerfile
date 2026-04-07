# ============================================
# Dockerfile para TurnoYa API
# Optimizado para .NET 8.0
# Para deployment en Caprover
# ============================================

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restaurar dependencias primero (optimiza cache)
COPY TurnoYaAPI/TurnoYa.API/*.csproj ./TurnoYaAPI/TurnoYa.API/
COPY TurnoYaAPI/TurnoYa.Application/*.csproj ./TurnoYaAPI/TurnoYa.Application/
COPY TurnoYaAPI/TurnoYa.Infrastructure/*.csproj ./TurnoYaAPI/TurnoYa.Infrastructure/
COPY TurnoYaAPI/TurnoYa.Core/*.csproj ./TurnoYaAPI/TurnoYa.Core/

RUN dotnet restore TurnoYaAPI/TurnoYa.API/TurnoYa.API.csproj

# Copiar todo el código fuente
COPY . .

# Build de la aplicación
WORKDIR /src/TurnoYaAPI/TurnoYa.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Instalar curl para health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copiar archivos publicados
COPY --from=build /app/publish .

# Puerto HTTP (estándar para contenedores)
EXPOSE 8080

# Variables de entorno
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check - usa endpoint de negocio o raíz
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/business || curl -f http://localhost:8080/ || exit 1

ENTRYPOINT ["dotnet", "TurnoYa.API.dll"]