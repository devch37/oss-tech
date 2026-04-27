package com.oss.techradar.claude.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class ClaudeResponse(
    val id: String,
    val type: String,
    val role: String,
    val content: List<ContentBlock>,
    val model: String,
    @JsonProperty("stop_reason") val stopReason: String? = null,
    val usage: Usage? = null,
) {
    data class ContentBlock(
        val type: String,           // "text" | "tool_use"
        val text: String? = null,
    )

    data class Usage(
        @JsonProperty("input_tokens") val inputTokens: Int,
        @JsonProperty("output_tokens") val outputTokens: Int,
    )

    /** content 배열에서 text 타입만 추출해 합침 */
    fun extractText(): String =
        content.filter { it.type == "text" }
            .mapNotNull { it.text }
            .joinToString("\n")
}
