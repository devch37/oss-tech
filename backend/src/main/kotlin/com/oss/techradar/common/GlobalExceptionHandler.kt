package com.oss.techradar.common

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.reactive.function.client.WebClientResponseException

@RestControllerAdvice
class GlobalExceptionHandler {

    private val log = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(NoSuchElementException::class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    fun handleNotFound(e: NoSuchElementException): ApiResponse<Nothing> =
        ApiResponse.error("NOT_FOUND", e.message ?: "Resource not found")

    @ExceptionHandler(IllegalArgumentException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleBadRequest(e: IllegalArgumentException): ApiResponse<Nothing> =
        ApiResponse.error("BAD_REQUEST", e.message ?: "Invalid request parameter")

    @ExceptionHandler(MissingServletRequestParameterException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleMissingParam(e: MissingServletRequestParameterException): ApiResponse<Nothing> =
        ApiResponse.error("MISSING_PARAMETER", "Required parameter '${e.parameterName}' is missing")

    @ExceptionHandler(WebClientResponseException::class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    fun handleExternalApiError(e: WebClientResponseException): ApiResponse<Nothing> {
        log.error("External API error: ${e.statusCode} — ${e.message}")
        return ApiResponse.error("EXTERNAL_API_ERROR", "External API call failed: ${e.statusCode}")
    }

    @ExceptionHandler(Exception::class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    fun handleGeneral(e: Exception): ApiResponse<Nothing> {
        log.error("Unexpected error", e)
        return ApiResponse.error("INTERNAL_ERROR", "Internal server error")
    }
}
