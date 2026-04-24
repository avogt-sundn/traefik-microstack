# greeting/spring Application


## API

app-two:8080/api/api-two/greet

## Inner loop

- start the postgres database as docker container:

    ```sh
    docker compose \
        -f /workspaces/traefik-microstack/greeting/spring/docker-compose.yaml \
        up -d  postgres
    ```

- select the right postgres instance by setting the environment variable `DB_HOST`, then run Spring with Maven:


    ```sh
    mvn spring-boot:run
    ```

- test it with curl

    ```sh
    curl localhost:8080/api/two/greet -H "Content-Type: text/plain" -d 'Armin'
    #{"id":4,"name":"Armin","message":"Hello, Armin!"}%
    ```
## Outer loop

 - building and running as container and testing

    ```sh
    # cleanup
    docker compose \
        -f /workspaces/traefik-microstack/greeting/spring/docker-compose.yaml \
        down --remove-orphans
    # start
    docker compose \
        -f /workspaces/traefik-microstack/greeting/spring/docker-compose.yaml \
        up -d --build
    ```
 - test im devcontainer

    ```sh
    curl app-two:8080/api/two/greet -H "Content-Type: text/plain" -d 'Armin'
    # {"id":1,"name":"Armin","message":"Hello, Armin!"}%
    ````

## Simple Spring Boot REST API

This project is a simple Spring Boot REST API application. It includes a basic structure to get started with developing RESTful services using Spring Boot.