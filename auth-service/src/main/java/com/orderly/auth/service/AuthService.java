package com.orderly.auth.service;

import com.orderly.auth.dto.Dtos.AuthResponse;
import com.orderly.auth.dto.Dtos.LoginRequest;
import com.orderly.auth.dto.Dtos.RegisterRequest;
import com.orderly.auth.dto.Dtos.UserInfo;
import com.orderly.auth.exception.ApiException;
import com.orderly.auth.model.Role;
import com.orderly.auth.model.User;
import com.orderly.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("Email is already registered");
        }
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER); // self-registration can never create an admin
        userRepository.save(user);
        return toResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        return toResponse(user);
    }

    private AuthResponse toResponse(User user) {
        UserInfo info = new UserInfo(user.getId(), user.getName(), user.getEmail(), user.getRole());
        return new AuthResponse(jwtService.generateToken(user), info);
    }
}
