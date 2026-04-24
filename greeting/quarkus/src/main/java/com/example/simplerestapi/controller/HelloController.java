
package com.example.simplerestapi.controller;

import java.util.List;

import com.example.simplerestapi.model.Greeting;
import com.example.simplerestapi.service.GreetingService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Hello Controller - Quarkus version using JAX-RS (RESTEasy Reactive).
 *
 * Key differences from Spring @RestController:
 * - Uses @Path instead of @RequestMapping
 * - Uses @GET/@POST/@PUT/@DELETE instead of @GetMapping/@PostMapping
 * - Uses @Consumes/@Produces instead of consumes/produces parameters
 * - JAX-RS is a standardized API (unlike Spring proprietary annotations)
 * - RESTEasy Reactive provides reactive/non-blocking support out of the box
 * - Much faster startup time with Quarkus build-time optimizations
 */
@Path("/api/three")
public class HelloController {

    @Inject
    GreetingService greetingService;

    @GET
    @Path("/hello")
    @Produces(MediaType.TEXT_PLAIN)
    public String sayHello() {
        return "Hello, World!";
    }

    @POST
    @Path("/greet")
    @Consumes(MediaType.TEXT_PLAIN)
    @Produces(MediaType.APPLICATION_JSON)
    public Response greetUser(String name) {
        Greeting greeting = greetingService.saveGreeting(name);
        return Response.status(Response.Status.CREATED).entity(greeting).build();
    }

    @GET
    @Path("/greetings")
    @Produces(MediaType.APPLICATION_JSON)
    public List<Greeting> getAllGreetings() {
        return greetingService.getAllGreetings();
    }
}
