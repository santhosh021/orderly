package com.orderly.product.service;

import com.orderly.product.dto.Dtos.ProductRequest;
import com.orderly.product.dto.Dtos.ProductResponse;
import com.orderly.product.dto.Dtos.ReservedItem;
import com.orderly.product.dto.Dtos.StockItem;
import com.orderly.product.dto.Dtos.StockRequest;
import com.orderly.product.exception.ApiException;
import com.orderly.product.model.Product;
import com.orderly.product.repository.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list(String query) {
        List<Product> products = (query == null || query.isBlank())
                ? productRepository.findAll(Sort.by("id"))
                : productRepository.findByNameContainingIgnoreCase(query.trim());
        return products.stream().map(ProductService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse get(Long id) {
        return toResponse(find(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = new Product();
        apply(product, request);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = find(id);
        apply(product, request);
        return toResponse(product); // managed entity: changes are saved automatically on commit
    }

    @Transactional
    public void delete(Long id) {
        productRepository.delete(find(id));
    }

    /**
     * All-or-nothing stock reservation for an order. Rows are locked, every item is checked,
     * then stock is reduced. Any failure throws, and the transaction rolls back everything.
     */
    @Transactional
    public List<ReservedItem> reserve(StockRequest request) {
        Map<Long, Integer> wanted = merge(request);
        Map<Long, Product> products = productRepository.findAllByIdForUpdate(wanted.keySet()).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<ReservedItem> reserved = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : wanted.entrySet()) {
            Product product = products.get(entry.getKey());
            if (product == null) {
                throw ApiException.notFound("Product not found: " + entry.getKey());
            }
            if (product.getStock() < entry.getValue()) {
                throw ApiException.conflict("Insufficient stock for '" + product.getName()
                        + "'. Available: " + product.getStock() + ", requested: " + entry.getValue());
            }
            product.setStock(product.getStock() - entry.getValue());
            reserved.add(new ReservedItem(product.getId(), product.getName(), product.getPrice(), entry.getValue()));
        }
        return reserved;
    }

    /** Compensation: puts reserved stock back (order failed or was cancelled). */
    @Transactional
    public void release(StockRequest request) {
        Map<Long, Integer> items = merge(request);
        for (Product product : productRepository.findAllByIdForUpdate(items.keySet())) {
            product.setStock(product.getStock() + items.get(product.getId()));
        }
    }

    /** Sums quantities if the same product appears twice. TreeMap keeps ids sorted. */
    private static Map<Long, Integer> merge(StockRequest request) {
        Map<Long, Integer> merged = new TreeMap<>();
        for (StockItem item : request.items()) {
            merged.merge(item.productId(), item.quantity(), Integer::sum);
        }
        return merged;
    }

    private Product find(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found: " + id));
    }

    private static void apply(Product product, ProductRequest request) {
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
    }

    private static ProductResponse toResponse(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getStock());
    }
}
