# syntax=docker/dockerfile:1
# One Dockerfile for all 5 Java services. Pick the service with --build-arg MODULE=<folder>.

# ---- Stage 1: build the jar with Maven (no Java/Maven needed on the server) ----
FROM maven:3.9-eclipse-temurin-17 AS build
ARG MODULE
WORKDIR /workspace
COPY . .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -pl ${MODULE} -am -DskipTests package

# ---- Stage 2: small runtime image with only a JRE ----
FROM eclipse-temurin:17-jre-alpine
ARG MODULE
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app \
    && mkdir -p /data/uploads && chown -R app:app /data
COPY --from=build /workspace/${MODULE}/target/${MODULE}.jar app.jar
USER app
ENTRYPOINT ["java", "-jar", "app.jar"]
