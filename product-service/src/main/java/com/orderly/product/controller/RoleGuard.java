package com.orderly.product.controller;

import com.orderly.product.exception.ApiException;

/** Authorization: the gateway puts the verified role in X-User-Role; write operations need ADMIN. */
final class RoleGuard {

    private RoleGuard() {
    }

    static void requireAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw ApiException.forbidden("Admin access required");
        }
    }
}
