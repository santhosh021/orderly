package com.orderly.product.service;

import com.orderly.product.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/** Saves uploaded product images on disk (a Docker volume in production). */
@Service
public class ImageStorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp",
            "image/gif", "gif");

    private static final Map<String, String> CONTENT_TYPES = Map.of(
            "jpg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "gif", "image/gif");

    /** Only names we generated ourselves are accepted when reading (blocks path tricks like ../). */
    private static final Pattern SAFE_NAME = Pattern.compile("^[0-9a-f\\-]{36}\\.(jpg|png|webp|gif)$");

    private final Path directory;

    public ImageStorageService(@Value("${app.upload-dir}") String uploadDir) {
        this.directory = Path.of(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(directory);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create upload directory " + directory, e);
        }
    }

    /** Stores the file under a random name and returns that file name. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Please choose an image file");
        }
        String extension = EXTENSIONS.get(file.getContentType());
        if (extension == null) {
            throw ApiException.badRequest("Only JPG, PNG, WEBP or GIF images are allowed");
        }
        String filename = UUID.randomUUID() + "." + extension;
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, directory.resolve(filename));
        } catch (IOException e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR, "Could not save the image");
        }
        return filename;
    }

    public byte[] read(String filename) {
        Path file = resolve(filename);
        try {
            return Files.readAllBytes(file);
        } catch (IOException e) {
            throw ApiException.notFound("Image not found");
        }
    }

    public String contentType(String filename) {
        resolve(filename);
        String extension = filename.substring(filename.lastIndexOf('.') + 1);
        return CONTENT_TYPES.get(extension);
    }

    private Path resolve(String filename) {
        if (!SAFE_NAME.matcher(filename).matches()) {
            throw ApiException.notFound("Image not found");
        }
        Path file = directory.resolve(filename).normalize();
        if (!file.startsWith(directory) || !Files.isRegularFile(file)) {
            throw ApiException.notFound("Image not found");
        }
        return file;
    }
}
