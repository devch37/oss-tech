package com.oss.techradar.llm

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.oss.techradar.config.WebClientConfig
import com.oss.techradar.config.WebClientProperties
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpServer
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.net.InetSocketAddress
import java.util.concurrent.CopyOnWriteArrayList

/**
 * mock 대신 실제 로컬 HTTP 서버를 띄워, 클라이언트가 **실제로 보내는 요청**(경로·헤더·본문)과
 * 응답 처리·재시도를 검증한다.
 */
class OpenAiReportLlmTest {

    private class Captured(val path: String, val authorization: String?, val body: JsonNode)

    private val mapper = ObjectMapper()
    private lateinit var server: HttpServer
    private val requests = CopyOnWriteArrayList<Captured>()

    /** 요청 순서대로 (상태코드, 본문) 을 돌려준다. 모자라면 마지막 응답을 반복한다. */
    private var responses: List<Pair<Int, String>> = emptyList()

    @BeforeEach
    fun startServer() {
        server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/") { ex -> handle(ex) }
        server.start()
    }

    @AfterEach
    fun stopServer() = server.stop(0)

    private fun handle(ex: HttpExchange) {
        val body = ex.requestBody.readBytes().toString(Charsets.UTF_8)
        requests += Captured(ex.requestURI.path, ex.requestHeaders.getFirst("Authorization"), mapper.readTree(body))
        val (code, payload) = responses.getOrElse(requests.size - 1) { responses.last() }
        val bytes = payload.toByteArray(Charsets.UTF_8)
        ex.responseHeaders.add("Content-Type", "application/json")
        ex.sendResponseHeaders(code, bytes.size.toLong())
        ex.responseBody.use { it.write(bytes) }
    }

    private fun client(
        apiKey: String = "sk-test-abc123",
        reasoningEffort: String = "",
        maxOutputTokens: Int = 1234,
    ): OpenAiReportLlm {
        val props = WebClientProperties(
            openai = WebClientProperties.OpenAiConfig(
                baseUrl = "http://127.0.0.1:${server.address.port}",
                apiKey = apiKey,
                model = "gpt-5-mini",
                maxOutputTokens = maxOutputTokens,
                reasoningEffort = reasoningEffort,
                retryDelayMs = 10,
            ),
        )
        // 실제 빈 생성 코드를 그대로 써서 Authorization 헤더 설정까지 함께 검증한다
        return OpenAiReportLlm(WebClientConfig(props).openAiWebClient(), props)
    }

    private val okBody = """
        {"id":"resp_1","status":"completed","output":[
          {"type":"reasoning","summary":[]},
          {"type":"message","role":"assistant","content":[{"type":"output_text","text":"# Report\nHello"}]}
        ],"usage":{"output_tokens_details":{"reasoning_tokens":10}}}
    """.trimIndent()

    @Test
    fun `정상 응답 - 본문을 추출하고 올바른 요청을 보낸다`() = runBlocking {
        responses = listOf(200 to okBody)

        val text = client().generate(system = "SYS", user = "USER")

        assertEquals("# Report\nHello", text)
        val req = requests.single()
        assertEquals("/v1/responses", req.path)
        assertEquals("Bearer sk-test-abc123", req.authorization)
        assertEquals("gpt-5-mini", req.body["model"].asText())
        assertEquals("SYS", req.body["instructions"].asText())
        assertEquals("USER", req.body["input"].asText())
        assertEquals(1234, req.body["max_output_tokens"].asInt())
    }

    @Test
    fun `reasoning effort 를 비우면 reasoning 필드를 아예 보내지 않는다`() = runBlocking {
        responses = listOf(200 to okBody)
        client(reasoningEffort = "").generate("s", "u")
        assertFalse(requests.single().body.has("reasoning"), "모델이 지원하지 않는 값으로 400 이 나지 않도록 생략")
    }

    @Test
    fun `reasoning effort 를 지정하면 그대로 보낸다`() = runBlocking {
        responses = listOf(200 to okBody)
        client(reasoningEffort = "low").generate("s", "u")
        assertEquals("low", requests.single().body["reasoning"]["effort"].asText())
    }

    @Test
    fun `응답이 incomplete 이면 한도를 늘리라고 안내한다`() {
        responses = listOf(200 to """{"status":"incomplete","incomplete_details":{"reason":"max_output_tokens"},"output":[{"type":"reasoning"}]}""")

        val e = assertThrows(IllegalStateException::class.java) { runBlocking { client().generate("s", "u") } }

        assertTrue(e.message!!.contains("OPENAI_MAX_OUTPUT_TOKENS"), e.message)
    }

    @Test
    fun `429 rate limit 은 1회 재시도 후 성공한다`() = runBlocking {
        responses = listOf(
            429 to """{"error":{"type":"rate_limit_error","code":"slow_down","message":"slow down"}}""",
            200 to okBody,
        )

        assertEquals("# Report\nHello", client().generate("s", "u"))
        assertEquals(2, requests.size)
    }

    @Test
    fun `크레딧 소진은 재시도하지 않고 충전 방법을 안내한다`() {
        responses = listOf(429 to """{"error":{"type":"insufficient_quota","code":"credit_balance_exhausted","message":"no credit"}}""")

        val e = assertThrows(LlmUnavailableException::class.java) { runBlocking { client().generate("s", "u") } }

        assertEquals(1, requests.size, "결제 오류는 재시도해도 복구되지 않음")
        assertTrue(e.message!!.contains("크레딧"), e.message)
        assertTrue(e.message!!.contains("platform.openai.com/settings/organization/billing"))
    }

    @Test
    fun `401 은 키 확인을 안내한다`() {
        responses = listOf(401 to """{"error":{"message":"Incorrect API key","type":"invalid_request_error","code":"invalid_api_key"}}""")

        val e = assertThrows(LlmUnavailableException::class.java) { runBlocking { client().generate("s", "u") } }

        assertTrue(e.message!!.contains("OPENAI_API_KEY"))
        assertEquals(1, requests.size)
    }

    @Test
    fun `키가 비어 있거나 자리표시자면 호출 전에 설정 안내를 던진다`() {
        listOf("", "   ", "sk-xxxx", "sk-proj-xxxx").forEach { key ->
            val e = assertThrows(
                LlmUnavailableException::class.java,
                { runBlocking { client(apiKey = key).generate("s", "u") } },
                "key='$key'",
            )
            assertTrue(e.message!!.contains("OPENAI_API_KEY"))
        }
        assertEquals(0, requests.size, "서버로 요청이 나가면 안 됨")
    }

    @Test
    fun `apiKeyOrNull - 실제 키 형식은 자리표시자로 오인하지 않는다`() {
        assertEquals("sk-proj-AbC123xyz", WebClientConfig.apiKeyOrNull("sk-proj-AbC123xyz"))
        assertEquals("sk-AbC123xyz", WebClientConfig.apiKeyOrNull(" sk-AbC123xyz "))
        assertNull(WebClientConfig.apiKeyOrNull("sk-ant-xxxx"))
    }
}
