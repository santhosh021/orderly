package com.orderly.order.client;

import com.orderly.order.dto.Dtos.ReservedItem;
import com.orderly.order.dto.Dtos.StockRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Declarative HTTP client. Spring generates the implementation at runtime.
 * "product-service" is looked up in Eureka (no hard-coded host or port).
 * If the call fails, the circuit breaker calls the fallback factory.
 */
@FeignClient(name = "product-service", fallbackFactory = ProductClientFallbackFactory.class)
public interface ProductClient {

    @PostMapping("/internal/products/reserve")
    List<ReservedItem> reserve(@RequestBody StockRequest request);

    @PostMapping("/internal/products/release")
    void release(@RequestBody StockRequest request);
}
