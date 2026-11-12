package com.orderly.product.config;

import com.orderly.product.model.Product;
import com.orderly.product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/** Inserts demo products the first time the service starts with an empty table. */
@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }
        productRepository.saveAll(List.of(
                product("Wireless Mouse", "2.4 GHz wireless mouse with silent clicks", "799.00", 50),
                product("Mechanical Keyboard", "Tenkeyless keyboard with blue switches", "3499.00", 30),
                product("USB-C Hub", "7-in-1 hub with HDMI, USB 3.0 and card reader", "1499.00", 40),
                product("27-inch Monitor", "Full HD IPS monitor, 75 Hz", "15999.00", 15),
                product("Laptop Stand", "Adjustable aluminium laptop stand", "1299.00", 60),
                product("1080p Webcam", "Full HD webcam with built-in microphone", "2499.00", 25),
                product("Noise-Cancelling Headphones", "Over-ear Bluetooth headphones", "5999.00", 20),
                product("Portable SSD 1TB", "USB 3.2 portable solid state drive", "6499.00", 18),
                product("Desk Lamp", "LED desk lamp with 3 brightness levels", "899.00", 45),
                product("Ergonomic Chair", "Mesh back chair with lumbar support", "12999.00", 8)));
    }

    private static Product product(String name, String description, String price, int stock) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(description);
        p.setPrice(new BigDecimal(price));
        p.setStock(stock);
        return p;
    }
}
