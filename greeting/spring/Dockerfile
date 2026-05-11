# Stage 1: Build the application using Maven
FROM maven:3-eclipse-temurin-25-alpine AS build

RUN mkdir -p $HOME/.m2 && cat > $HOME/.m2/settings.xml <<EOF

<settings>
  <mirrors>
    <mirror>
      <id>dockerized-mirror</id>
      <name>Local Mirror Repository</name>
      <url>http://localhost:8008/central</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
</settings>
EOF

WORKDIR /app
ENV DIR=/root/.m2/repository
#RUN mvn -X
# Copy Maven project files
COPY pom.xml .
COPY --chmod=755 mvnw  .
COPY .mvn .mvn/

RUN --mount=type=cache,target=$DIR mkdir -p $DIR && echo "cached .m2 size: " $(du -sh $DIR)
RUN --mount=type=cache,target=$DIR ./mvnw -B org.apache.maven.plugins:maven-dependency-plugin:go-offline
COPY src ./src
# Build the project, deactivate 'dev' profile and skip tests for speed
RUN --mount=type=cache,target=$DIR ./mvnw -B package -P'!dev' -DskipTests

# Stage 2: Run the application with a lightweight JRE
FROM eclipse-temurin:25-jre-alpine

# for healthcheck is using curl
RUN apk update && apk add curl && apk upgrade

WORKDIR /app

# Copy the built JAR from the previous stage
COPY --from=build /app/target/*.jar app.jar

# Expose application port (adjust if your app uses a different one)
EXPOSE 443

# Run the application on port 443 (HTTPS)
ENTRYPOINT ["java", "-jar", "/app/app.jar", "--server.port=443","--spring.devtools.restart.enabled=false"]