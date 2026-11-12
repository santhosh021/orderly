package com.orderly.order.controller;

import com.orderly.order.dto.Dtos.CreateOrderRequest;
import com.orderly.order.dto.Dtos.OrderResponse;
import com.orderly.order.dto.Dtos.UpdateStatusRequest;
import com.orderly.order.exception.ApiException;
import com.orderly.order.model.OrderStatus;
import com.orderly.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Who is calling? The gateway verified the JWT and passed the identity in headers:
 * X-User-Id, X-User-Email, X-User-Role.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final String ADMIN = "ADMIN";

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@RequestHeader("X-User-Id") Long userId,
                                @RequestHeader(name = "X-User-Email", required = false) String email,
                                @Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(userId, email, request);
    }

    @GetMapping
    public List<OrderResponse> myOrders(@RequestHeader("X-User-Id") Long userId) {
        return orderService.myOrders(userId);
    }

    @GetMapping("/all")
    public List<OrderResponse> allOrders(@RequestHeader(name = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        return orderService.allOrders();
    }

    @GetMapping("/{id}")
    public OrderResponse get(@RequestHeader("X-User-Id") Long userId,
                             @RequestHeader(name = "X-User-Role", required = false) String role,
                             @PathVariable Long id) {
        return orderService.getOrder(id, userId, ADMIN.equals(role));
    }

    @PatchMapping("/{id}/cancel")
    public OrderResponse cancel(@RequestHeader("X-User-Id") Long userId,
                                @RequestHeader(name = "X-User-Role", required = false) String role,
                                @PathVariable Long id) {
        return orderService.changeStatus(id, OrderStatus.CANCELLED, userId, ADMIN.equals(role));
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@RequestHeader("X-User-Id") Long userId,
                                      @RequestHeader(name = "X-User-Role", required = false) String role,
                                      @PathVariable Long id,
                                      @Valid @RequestBody UpdateStatusRequest request) {
        requireAdmin(role);
        return orderService.changeStatus(id, request.status(), userId, true);
    }

    private static void requireAdmin(String role) {
        if (!ADMIN.equals(role)) {
            throw ApiException.forbidden("Admin access required");
        }
    }
}
