package com.orderly.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class Dtos {

    private Dtos() {
    }

    public record ProductRequest(
            @NotBlank @Size(max = 150) String name,
            @Size(max = 1000) String description,
            @NotNull @DecimalMin("0.01") BigDecimal price,
            @NotNull @Min(0) Integer stock) {
    }

    public record ProductResponse(Long id, String name, String description, BigDecimal price, int stock) {
    }

    // ---- internal contract used by order-service (stock reservation) ----

    public record StockItem(@NotNull Long productId, @NotNull @Min(1) Integer quantity) {
    }

    public record StockRequest(@NotEmpty List<@Valid StockItem> items) {
    }

    public record ReservedItem(Long productId, String productName, BigDecimal unitPrice, int quantity) {
    }
}
