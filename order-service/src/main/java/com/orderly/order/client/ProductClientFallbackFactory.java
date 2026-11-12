package com.orderly.order.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orderly.order.dto.Dtos.ReservedItem;
import com.orderly.order.dto.Dtos.StockRequest;
import com.orderly.order.exception.ApiException;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FallbackFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Runs when a call to product-service fails. It receives the real cause:
 *  - 4xx answer from product-service (e.g. 409 "Insufficient stock"): a business error,
 *    so we pass the same status and message on to the user;
 *  - anything else (service down, timeout, circuit open): answer 503 with a friendly message.
 */
@Component
public class ProductClientFallbackFactory implements FallbackFactory<ProductClient> {

    private static final Logger log = LoggerFactory.getLogger(ProductClientFallbackFactory.class);

    private final ObjectMapper objectMapper;

    public ProductClientFallbackFactory(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public ProductClient create(Throwable cause) {
        return new ProductClient() {
            @Override
            public List<ReservedItem> reserve(StockRequest request) {
                throw toApiException(cause);
            }

            @Override
            public void release(StockRequest request) {
                throw toApiException(cause);
            }
        };
    }

    private ApiException toApiException(Throwable cause) {
        if (cause instanceof FeignException.FeignClientException fe) {
            HttpStatus status = HttpStatus.resolve(fe.status());
            return new ApiException(status != null ? status : HttpStatus.BAD_REQUEST, extractMessage(fe));
        }
        log.warn("product-service call failed: {}", cause.toString());
        return ApiException.serviceUnavailable("Product service is unavailable right now. Please try again shortly.");
    }

    private String extractMessage(FeignException fe) {
        try {
            String message = objectMapper.readTree(fe.contentUTF8()).path("message").asText();
            return message.isBlank() ? "Request rejected by product service" : message;
        } catch (Exception e) {
            return "Request rejected by product service";
        }
    }
}
