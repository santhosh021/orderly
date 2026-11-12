package com.orderly.product.controller;

import com.orderly.product.dto.Dtos.ReservedItem;
import com.orderly.product.dto.Dtos.StockRequest;
import com.orderly.product.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Service-to-service API called by order-service (through Feign).
 * The gateway has no route for /internal/**, so it cannot be called from outside.
 */
@RestController
@RequestMapping("/internal/products")
public class InternalProductController {

    private final ProductService productService;

    public InternalProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping("/reserve")
    public List<ReservedItem> reserve(@Valid @RequestBody StockRequest request) {
        return productService.reserve(request);
    }

    @PostMapping("/release")
    public void release(@Valid @RequestBody StockRequest request) {
        productService.release(request);
    }
}
