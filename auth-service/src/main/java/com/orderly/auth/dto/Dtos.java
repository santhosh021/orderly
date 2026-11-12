package com.orderly.auth.dto;

import com.orderly.auth.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request/response shapes (Java records = immutable data carriers). */
public final class Dtos {

    private Dtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 100) String name,
            @NotBlank @Email @Size(max = 150) String email,
            @NotBlank @Size(min = 6, max = 100) String password) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record UserInfo(Long id, String name, String email, Role role) {
    }

    public record AuthResponse(String token, UserInfo user) {
    }
}
