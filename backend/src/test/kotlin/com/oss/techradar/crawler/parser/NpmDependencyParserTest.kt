package com.oss.techradar.crawler.parser

import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class NpmDependencyParserTest {

    private val parser = NpmDependencyParser(ObjectMapper())

    @Test
    fun `parse - dependencies와 devDependencies 키를 모두 추출`() {
        val content = """
            {
              "name": "my-app",
              "dependencies": {
                "react": "^18.2.0",
                "next": "14.2.0"
              },
              "devDependencies": {
                "typescript": "^5.4.0"
              }
            }
        """.trimIndent()

        val result = parser.parse(content)

        assertEquals(setOf("react", "next", "typescript"), result.toSet())
    }

    @Test
    fun `parse - dependencies 필드가 없으면 빈 리스트`() {
        val result = parser.parse("""{"name": "empty-pkg"}""")
        assertEquals(emptyList<String>(), result)
    }

    @Test
    fun `parse - 잘못된 JSON이면 예외 대신 빈 리스트`() {
        val result = parser.parse("not valid json")
        assertEquals(emptyList<String>(), result)
    }
}
