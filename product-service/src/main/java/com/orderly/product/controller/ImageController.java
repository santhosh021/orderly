package com.orderly.product.controller;

import com.orderly.product.service.ImageStorageService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/** Product image upload (admin only) and download (public, so plain img tags work). */
@RestController
@RequestMapping("/api/products/images")
public class ImageController {

    private final ImageStorageService storage;

    public ImageController(ImageStorageService storage) {
        this.storage = storage;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> upload(@RequestHeader(name = "X-User-Role", required = false) String role,
                                      @RequestParam("file") MultipartFile file) {
        RoleGuard.requireAdmin(role);
        String filename = storage.store(file);
        return Map.of("url", "/api/products/images/" + filename);
    }

    @GetMapping("/{filename}")
    public ResponseEntity<byte[]> get(@PathVariable String filename) {
        byte[] bytes = storage.read(filename);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(storage.contentType(filename)))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(bytes);
    }
}
