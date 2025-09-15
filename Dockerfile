FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app
COPY backend/*.csproj ./backend/
WORKDIR /app/backend
RUN dotnet restore
WORKDIR /app
COPY backend/ ./backend/
WORKDIR /app/backend
RUN dotnet publish -c Release -o out

FROM base AS final
WORKDIR /app
COPY --from=build /app/backend/out .
ENTRYPOINT ["dotnet", "MediChain.Api.dll"]