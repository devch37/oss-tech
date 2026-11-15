package com.oss.techradar.config

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

class WebClientConfigTest {

    @Test
    fun `githubAuthorization - 토큰이 있으면 Bearer 헤더 값을 만든다`() {
        assertEquals("Bearer ghp_example", WebClientConfig.githubAuthorization("ghp_example"))
    }

    @Test
    fun `githubAuthorization - 앞뒤 공백은 제거한다`() {
        assertEquals("Bearer ghp_example", WebClientConfig.githubAuthorization("  ghp_example \n"))
    }

    @Test
    fun `githubAuthorization - 자리표시자는 토큰 없음으로 취급한다 (그대로 보내면 401)`() {
        listOf("ghp_xxxx", "GHP_XXXX", "github_pat_xxxx", "xxxx", "your_token_here", "changeme", "<token>")
            .forEach { assertNull(WebClientConfig.githubAuthorization(it), "자리표시자로 판정돼야 함: $it") }
    }

    @Test
    fun `githubAuthorization - 실제 토큰 형식은 자리표시자로 오인하지 않는다`() {
        assertEquals("Bearer ghp_abcDEF123456xyz789", WebClientConfig.githubAuthorization("ghp_abcDEF123456xyz789"))
        assertEquals("Bearer github_pat_fixture", WebClientConfig.githubAuthorization("github_pat_fixture"))
    }

    @Test
    fun `githubAuthorization - 비어 있거나 공백이면 헤더를 보내지 않는다 (빈 Bearer 는 401)`() {
        assertNull(WebClientConfig.githubAuthorization(""))
        assertNull(WebClientConfig.githubAuthorization("   "))
    }
}
