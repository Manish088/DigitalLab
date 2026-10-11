# ========================================================
# DIGITLAB BACKEND - ASP.NET Core 10 Web API
# Multi-stage Dockerfile
# ========================================================

# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files for optimized Docker layer caching
COPY ["src/Lab.Domain/Lab.Domain.csproj", "src/Lab.Domain/"]
COPY ["src/Lab.Application/Lab.Application.csproj", "src/Lab.Application/"]
COPY ["src/Lab.Infrastructure/Lab.Infrastructure.csproj", "src/Lab.Infrastructure/"]
COPY ["src/Lab.Api/Lab.Api.csproj", "src/Lab.Api/"]

# Restore NuGet dependencies
RUN dotnet restore "src/Lab.Api/Lab.Api.csproj"

# Copy full source and publish
COPY src/ src/
WORKDIR "/src/src/Lab.Api"
RUN dotnet publish "Lab.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Ensure data directory exists for SQLite / temp files
RUN mkdir -p /app/data

EXPOSE 5000

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Lab.Api.dll"]
