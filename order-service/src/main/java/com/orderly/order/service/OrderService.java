package com.orderly.order.service;

import com.orderly.order.client.ProductClient;
import com.orderly.order.dto.Dtos.CreateOrderRequest;
import com.orderly.order.dto.Dtos.OrderItemResponse;
import com.orderly.order.dto.Dtos.OrderResponse;
import com.orderly.order.dto.Dtos.ReservedItem;
import com.orderly.order.dto.Dtos.StockItem;
import com.orderly.order.dto.Dtos.StockRequest;
import com.orderly.order.exception.ApiException;
import com.orderly.order.model.Order;
import com.orderly.order.model.OrderItem;
import com.orderly.order.model.OrderStatus;
import com.orderly.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    /** Allowed status changes (a tiny state machine). */
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(
            OrderStatus.PLACED, EnumSet.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, EnumSet.of(OrderStatus.SHIPPED, OrderStatus.CANCELLED),
            OrderStatus.SHIPPED, EnumSet.of(OrderStatus.DELIVERED),
            OrderStatus.DELIVERED, EnumSet.noneOf(OrderStatus.class),
            OrderStatus.CANCELLED, EnumSet.noneOf(OrderStatus.class));

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final TransactionTemplate transactionTemplate;

    public OrderService(OrderRepository orderRepository,
                        ProductClient productClient,
                        TransactionTemplate transactionTemplate) {
        this.orderRepository = orderRepository;
        this.productClient = productClient;
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Place an order. Two databases are involved, so one local DB transaction is not enough.
     * We use a small saga with compensation:
     *   1. reserve stock in product-service (its own transaction)
     *   2. save the order in our own transaction
     *   3. if step 2 fails, release the reserved stock (compensating action)
     * No @Transactional on this method on purpose: we do not want to hold a database
     * transaction open while waiting for another service.
     */
    public OrderResponse createOrder(Long userId, String userEmail, CreateOrderRequest request) {
        StockRequest stockRequest = new StockRequest(request.items().stream()
                .map(i -> new StockItem(i.productId(), i.quantity()))
                .toList());

        List<ReservedItem> reserved = productClient.reserve(stockRequest);   // step 1

        try {
            return transactionTemplate.execute(status -> {                    // step 2
                Order order = new Order();
                order.setUserId(userId);
                order.setUserEmail(userEmail);
                order.setStatus(OrderStatus.PLACED);

                BigDecimal total = BigDecimal.ZERO;
                for (ReservedItem r : reserved) {
                    OrderItem item = new OrderItem();
                    item.setProductId(r.productId());
                    item.setProductName(r.productName());
                    item.setUnitPrice(r.unitPrice());
                    item.setQuantity(r.quantity());
                    order.addItem(item);
                    total = total.add(r.unitPrice().multiply(BigDecimal.valueOf(r.quantity())));
                }
                order.setTotalAmount(total);
                return toResponse(orderRepository.save(order));
            });
        } catch (RuntimeException ex) {
            log.error("Saving the order failed, releasing reserved stock", ex);
            releaseQuietly(stockRequest);                                       // step 3
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> myOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(OrderService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> allOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(OrderService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId, Long userId, boolean admin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> ApiException.notFound("Order not found: " + orderId));
        if (!admin && !order.getUserId().equals(userId)) {
            throw ApiException.forbidden("You can only view your own orders");
        }
        return toResponse(order);
    }

    /**
     * Moves an order to a new status (cancel, ship, deliver ...). Owners may only cancel their own
     * orders (checked in the controller for other targets). Cancelling gives the stock back.
     */
    public OrderResponse changeStatus(Long orderId, OrderStatus target, Long actorId, boolean admin) {
        OrderResponse updated = transactionTemplate.execute(status -> {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> ApiException.notFound("Order not found: " + orderId));
            if (!admin && !order.getUserId().equals(actorId)) {
                throw ApiException.forbidden("You can only change your own orders");
            }
            if (!ALLOWED.get(order.getStatus()).contains(target)) {
                throw ApiException.conflict("Cannot change status from " + order.getStatus() + " to " + target);
            }
            order.setStatus(target); // managed entity: saved automatically on commit
            return toResponse(order);
        });

        if (target == OrderStatus.CANCELLED && updated != null) {
            releaseQuietly(new StockRequest(updated.items().stream()
                    .map(i -> new StockItem(i.productId(), i.quantity()))
                    .toList()));
        }
        return updated;
    }

    private void releaseQuietly(StockRequest request) {
        try {
            productClient.release(request);
        } catch (Exception e) {
            // In production this would go to a retry queue / outbox. Here we log it loudly.
            log.error("COMPENSATION FAILED - stock could not be released: {}", request, e);
        }
    }

    private static OrderResponse toResponse(Order o) {
        List<OrderItemResponse> items = o.getItems().stream()
                .map(i -> new OrderItemResponse(i.getProductId(), i.getProductName(), i.getUnitPrice(),
                        i.getQuantity(), i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity()))))
                .toList();
        return new OrderResponse(o.getId(), o.getUserId(), o.getUserEmail(), o.getStatus(),
                o.getTotalAmount(), o.getCreatedAt(), items);
    }
}
