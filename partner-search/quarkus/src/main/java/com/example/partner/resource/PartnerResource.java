package com.example.partner.resource;

import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * Single partner lookup — owned by partner-edit domain (PARTNER-EDIT-001).
 * This resource is intentionally empty; the endpoint has moved to
 * /api/partner-edit/spring/{partnerNumber}.
 */
@Path("/api/partner/quarkus")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Partner", description = "Single partner operations")
public class PartnerResource {
}
