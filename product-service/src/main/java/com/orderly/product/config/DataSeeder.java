package com.orderly.product.config;

import com.orderly.product.model.Product;
import com.orderly.product.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Demo catalog. On an empty table it inserts the products; on an existing database it only fills in
 * the category and picture of the demo products that do not have them yet (nothing is overwritten
 * and deleted products are not re-created). Photos are free-to-use images from Pexels.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private record Seed(String name, String description, String category, String price, int stock, long photoId) {
    }

    private static final List<Seed> SEEDS = List.of(
            new Seed("Wireless Mouse", "2.4 GHz wireless mouse with silent clicks", "Accessories", "799.00", 50, 31915115L),
            new Seed("Mechanical Keyboard", "Tenkeyless keyboard with blue switches", "Accessories", "3499.00", 30, 3829226L),
            new Seed("USB-C Hub", "7-in-1 hub with HDMI, USB 3.0 and card reader", "Accessories", "1499.00", 40, 30708285L),
            new Seed("27-inch Monitor", "Full HD IPS monitor, 75 Hz", "Displays", "15999.00", 15, 9559669L),
            new Seed("Laptop Stand", "Adjustable aluminium laptop stand", "Office", "1299.00", 60, 4792712L),
            new Seed("1080p Webcam", "Full HD webcam with built-in microphone", "Accessories", "2499.00", 25, 7172701L),
            new Seed("Noise-Cancelling Headphones", "Over-ear Bluetooth headphones", "Audio", "5999.00", 20, 3945667L),
            new Seed("Portable SSD 1TB", "USB 3.2 portable solid state drive", "Storage", "6499.00", 18, 13595075L),
            new Seed("Desk Lamp", "LED desk lamp with 3 brightness levels", "Office", "899.00", 45, 1112598L),
            new Seed("Ergonomic Chair", "Mesh back chair with lumbar support", "Office", "12999.00", 8, 31726674L));

    private final ProductRepository productRepository;

    public DataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            List<Product> products = new ArrayList<>();
            for (Seed seed : SEEDS) {
                Product p = new Product();
                p.setName(seed.name());
                p.setDescription(seed.description());
                p.setCategory(seed.category());
                p.setImageUrl(imageUrl(seed.photoId()));
                p.setPrice(new BigDecimal(seed.price()));
                p.setStock(seed.stock());
                products.add(p);
            }
            productRepository.saveAll(products);
            return;
        }

        List<Product> changed = new ArrayList<>();
        for (Product existing : productRepository.findAll()) {
            for (Seed seed : SEEDS) {
                if (!seed.name().equals(existing.getName())) {
                    continue;
                }
                boolean updated = false;
                if (existing.getCategory() == null) {
                    existing.setCategory(seed.category());
                    updated = true;
                }
                if (existing.getImageUrl() == null) {
                    existing.setImageUrl(imageUrl(seed.photoId()));
                    updated = true;
                }
                if (updated) {
                    changed.add(existing);
                }
            }
        }
        if (!changed.isEmpty()) {
            productRepository.saveAll(changed);
        }
    }

    private static String imageUrl(long photoId) {
        return "https://images.pexels.com/photos/" + photoId + "/pexels-photo-" + photoId
                + ".jpeg?auto=compress&cs=tinysrgb&w=800";
    }
}
