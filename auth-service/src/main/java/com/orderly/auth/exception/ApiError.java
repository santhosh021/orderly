package com.orderly.auth.exception;

import java.time.LocalDateTime;

/** JSON body returned for every error. */
public record ApiError(int status, String error, String message, LocalDateTime timestamp) {
}
