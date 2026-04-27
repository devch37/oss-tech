package com.oss.techradar.claude.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class ClaudeRequest(
    val model: String,
    @JsonProperty("max_tokens") val maxTokens: Int = 4096,
    val system: String,
    val messages: List<Message>,
) {
    data class Message(
        val role: String,     // "user" | "assistant"
        val content: String,
    )
}
