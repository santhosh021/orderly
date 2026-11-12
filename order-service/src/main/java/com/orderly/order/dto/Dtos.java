package com.orderly.order.dto;

import com.orderly.order.model.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class Dtos {

    private Dtos() {
    }

    // ---- public API ----

    public record OrderItemRequest(@NotNull Long productId, @NotNull @Min(1) Integer quantity) {
    }

    public record CreateOrderRequest(@NotEmpty List<@Valid OrderItemRequest> items) {
    }

    public record UpdateStatusRequest(@NotNull OrderStatus status) {
    }

    public record OrderItemResponse(Long productId, String productName, BigDecimal unitPrice,
                                    int quantity, BigDecimal subtotal) {
    }

    public record OrderResponse(Long id, Long userId, String userEmail, OrderStatus status,
                                BigDecimal totalAmount, LocalDateTime createdAt,
                                List<OrderItemResponse> items) {
    }

    // ---- contract of product-service's internal API (used by the Feign client) ----

    public record StockItem(Long productId, int quantity) {
    }

    public record StockRequest(List<StockItem> items) {
    }

    public record ReservedItem(Long productId, String productName, BigDecimal unitPrice, int quantity) {
    }
}
