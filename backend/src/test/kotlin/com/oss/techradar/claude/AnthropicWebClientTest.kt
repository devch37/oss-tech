package com.oss.techradar.claude

import com.oss.techradar.claude.dto.ClaudeRequest
import com.oss.techradar.claude.dto.ClaudeResponse
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.web.reactive.function.client.WebClientResponseException
import reactor.core.publisher.Mono

class AnthropicWebClientTest {

    private lateinit var webClient: WebClient
    private lateinit var requestBodyUriSpec: WebClient.RequestBodyUriSpec
    private lateinit var requestBodySpec: WebClient.RequestBodySpec
    private lateinit var responseSpec: WebClient.ResponseSpec
    private lateinit var anthropicWebClient: AnthropicWebClient

    private val sampleRequest = ClaudeRequest(
        model = "claude-sonnet-4-6",
        system = "테스트 시스템 프롬프트",
        messages = listOf(ClaudeRequest.Message(role = "user", content = "안녕하세요")),
    )

    private val sampleResponse = ClaudeResponse(
        id = "msg_test",
        type = "message",
        role = "assistant",
        content = listOf(ClaudeResponse.ContentBlock(type = "text", text = "안녕하세요!")),
        model = "claude-sonnet-4-6",
        stopReason = "end_turn",
        usage = ClaudeResponse.Usage(inputTokens = 10, outputTokens = 5),
    )

    @BeforeEach
    fun setUp() {
        webClient = mockk()
        requestBodyUriSpec = mockk()
        requestBodySpec = mockk()
        responseSpec = mockk()

        every { webClient.post() } returns requestBodyUriSpec
        every { requestBodyUriSpec.uri(any<String>()) } returns requestBodySpec
        every { requestBodySpec.bodyValue(any()) } returns requestBodySpec
        every { requestBodySpec.retrieve() } returns responseSpec
        every { responseSpec.onStatus(any(), any()) } returns responseSpec

        anthropicWebClient = AnthropicWebClient(webClient)
    }

    @Test
    fun `sendMessage - 성공 응답 시 ClaudeResponse 반환`() = runTest {
        // given
        every {
            responseSpec.bodyToMono(ClaudeResponse::class.java)
        } returns Mono.just(sampleResponse)

        // when
        val result = anthropicWebClient.sendMessage(sampleRequest)

        // then
        assertEquals("msg_test", result.id)
        assertEquals("안녕하세요!", result.extractText())
        coVerify(exactly = 1) { requestBodySpec.bodyValue(any()) }
    }

    @Test
    fun `sendMessage - 첫 호출 실패 후 재시도 성공`() = runTest {
        // given: 첫 번째 호출은 429, 두 번째는 성공
        val exception = WebClientResponseException.create(
            HttpStatus.TOO_MANY_REQUESTS.value(),
            "Too Many Requests",
            HttpHeaders.EMPTY,
            byteArrayOf(),
            Charsets.UTF_8,
        )
        every {
            responseSpec.bodyToMono(ClaudeResponse::class.java)
        } returnsMany listOf(
            Mono.error(exception),
            Mono.just(sampleResponse),
        )

        // when
        val result = anthropicWebClient.sendMessage(sampleRequest)

        // then: 재시도 후 성공
        assertEquals("msg_test", result.id)
        coVerify(exactly = 2) { requestBodySpec.retrieve() }
    }

    @Test
    fun `sendMessage - 재시도도 실패하면 예외 전파`() = runTest {
        // given: 두 번 모두 500 에러
        val exception = WebClientResponseException.create(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            HttpHeaders.EMPTY,
            byteArrayOf(),
            Charsets.UTF_8,
        )
        every {
            responseSpec.bodyToMono(ClaudeResponse::class.java)
        } returns Mono.error(exception)

        // then: WebClientResponseException 전파
        assertThrows(WebClientResponseException::class.java) {
            kotlinx.coroutines.runBlocking { anthropicWebClient.sendMessage(sampleRequest) }
        }
        coVerify(exactly = 2) { requestBodySpec.retrieve() }
    }

    @Test
    fun `ClaudeResponse extractText - text 타입만 추출`() {
        // given
        val response = ClaudeResponse(
            id = "msg_1",
            type = "message",
            role = "assistant",
            content = listOf(
                ClaudeResponse.ContentBlock(type = "text", text = "첫 번째 텍스트"),
                ClaudeResponse.ContentBlock(type = "tool_use", text = null),
                ClaudeResponse.ContentBlock(type = "text", text = "두 번째 텍스트"),
            ),
            model = "claude-sonnet-4-6",
        )

        // when
        val text = response.extractText()

        // then
        assertEquals("첫 번째 텍스트\n두 번째 텍스트", text)
    }
}
