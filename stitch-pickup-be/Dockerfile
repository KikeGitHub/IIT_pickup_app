# ═══════════════════════════════════════════════════════════════════
#  STITCH PICKUP — Backend Dockerfile (Multi-stage Build)
# ═══════════════════════════════════════════════════════════════════

# Stage 1: Build Spring Boot JAR
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compile and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root system user for security and prepare uploads directory
RUN addgroup -S spring && adduser -S spring -G spring && \
    mkdir -p /app/uploads && chown -R spring:spring /app

USER spring:spring

COPY --from=build --chown=spring:spring /app/target/stitch-pickup-be-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080

# Tuned for 4GB RAM VPS (Heap 1.5GB, fast G1GC)
ENTRYPOINT ["java", "-Xmx1500m", "-Xms500m", "-XX:+UseG1GC", "-XX:+UseStringDeduplication", "-jar", "app.jar"]
