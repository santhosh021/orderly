package com.orderly.product.controller;

import com.orderly.product.dto.Dtos.ProductRequest;
import com.orderly.product.dto.Dtos.ProductResponse;
import com.orderly.product.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public API (reached through the gateway). Reading needs login, writing needs ADMIN. */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> list(@RequestParam(name = "q", required = false) String query) {
        return productService.list(query);
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@RequestHeader(name = "X-User-Role", required = false) String role,
                                  @Valid @RequestBody ProductRequest request) {
        RoleGuard.requireAdmin(role);
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@RequestHeader(name = "X-User-Role", required = false) String role,
                                  @PathVariable Long id,
                                  @Valid @RequestBody ProductRequest request) {
        RoleGuard.requireAdmin(role);
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader(name = "X-User-Role", required = false) String role,
                       @PathVariable Long id) {
        RoleGuard.requireAdmin(role);
        productService.delete(id);
    }
}
