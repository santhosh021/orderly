package com.orderly.gateway;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Routing table. "lb://name" means: ask Eureka for a running instance of that service
 * and load-balance between instances. Only /api/** is routed, so the
 * /internal/** endpoints of the services are NOT reachable from outside.
 */
@Configuration
public class GatewayRoutes {

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", r -> r.path("/api/auth/**").uri("lb://auth-service"))
                .route("product-service", r -> r.path("/api/products/**").uri("lb://product-service"))
                .route("order-service", r -> r.path("/api/orders/**").uri("lb://order-service"))
                .build();
    }
}
