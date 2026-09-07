package com.oss.techradar.crawler.parser

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class PipDependencyParserTest {

    private val parser = PipDependencyParser()

    @Test
    fun `parse - 버전 지정자와 주석 행 제외하고 패키지명만 추출`() {
        val content = """
            # web framework
            fastapi==0.110.0
            uvicorn[standard]>=0.29.0

            requests~=2.31
            -r other-requirements.txt
            -e ./local-package
            numpy
        """.trimIndent()

        val result = parser.parse(content)

        assertEquals(
            listOf("fastapi", "uvicorn", "requests", "numpy"),
            result,
        )
    }

    @Test
    fun `parse - 빈 내용이면 빈 리스트`() {
        assertEquals(emptyList<String>(), parser.parse(""))
    }
}
