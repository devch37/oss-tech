package com.oss.techradar.api

import com.oss.techradar.api.dto.RepositoryWithScoreDto
import com.oss.techradar.api.dto.TopLibraryDto
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class OverviewCalculatorTest {

    private var nextId = 1L

    private fun repo(
        name: String,
        domain: String,
        stars: Int,
        score: Double?,
        commits: Int? = 10,
        prs: Int? = 2,
        language: String? = "Kotlin",
    ) = RepositoryWithScoreDto(
        id = nextId++, owner = "o", name = name, fullName = "o/$name", domain = domain,
        stars = stars, forks = 0, language = language, score = score,
        commits30d = commits, prsMerged30d = prs, issuesClosed30d = 0,
    )

    private val order = listOf("frontend", "backend")

    @Test
    fun `등급 경계 - 50 이상 S, 20 이상 A, 5 이상 B, 나머지 C 이고 점수 없는 레포는 제외`() {
        val counts = OverviewCalculator.levelCounts(
            listOf(
                repo("a", "frontend", 1, 50.0), repo("b", "frontend", 1, 49.9),
                repo("c", "frontend", 1, 20.0), repo("d", "frontend", 1, 5.0),
                repo("e", "frontend", 1, 4.9), repo("f", "frontend", 1, null),
            ),
        )
        assertEquals(1, counts.s); assertEquals(2, counts.a); assertEquals(1, counts.b); assertEquals(1, counts.c)
    }

    @Test
    fun `도메인별 합계와 전체 합계`() {
        val repos = listOf(
            repo("a", "frontend", 100, 30.0, commits = 40, prs = 5),
            repo("b", "frontend", 200, 10.0, commits = 20, prs = 1),
            repo("c", "backend", 50, 60.0, commits = 100, prs = 9),
        )
        val result = OverviewCalculator.build(
            repos,
            mapOf("frontend" to DomainLibraries(12, TopLibraryDto("react", 9)), "backend" to DomainLibraries(5, null)),
            order,
            "2026-11",
        )
        val fe = result.domains.first { it.domain == "frontend" }
        assertEquals(2, fe.repositoryCount); assertEquals(300L, fe.totalStars)
        assertEquals(60, fe.commits30d); assertEquals(6, fe.prsMerged30d)
        assertEquals("a", fe.topRepository?.name)
        assertEquals("react", fe.topLibrary?.name)
        assertEquals(3, result.totals.repositories); assertEquals(350L, result.totals.stars)
        assertEquals(160, result.totals.commits30d); assertEquals(17, result.totals.libraries)
        assertEquals("2026-11", result.libraryMonth)
    }

    @Test
    fun `데이터가 없는 도메인도 0 으로 나온다`() {
        val result = OverviewCalculator.build(emptyList(), emptyMap(), order, null)
        assertEquals(2, result.domains.size)
        assertTrue(result.domains.all { it.repositoryCount == 0 && it.topRepository == null })
        assertNull(result.libraryMonth)
        assertEquals(0, result.totals.repositories)
    }

    @Test
    fun `숨은 보석 - 스타가 중앙값 이하이면서 활동 A 이상, 도메인당 2개까지`() {
        val repos = listOf(
            repo("giant", "frontend", 100_000, 90.0),     // 활발하지만 스타가 많다 → 제외
            repo("gem1", "frontend", 500, 70.0),            // 중앙값(500) 이하 → 포함
            repo("popular", "frontend", 600, 60.0),         // 중앙값보다 스타가 많다 → 제외
            repo("gem2", "frontend", 400, 55.0),
            repo("gem3", "frontend", 350, 52.0),            // 도메인당 2개 제한 → 제외
            repo("quiet", "frontend", 300, 3.0),            // 활동이 낮다 → 제외
            repo("x1", "backend", 10_000, 80.0), repo("x2", "backend", 20_000, 5.0),
            repo("x3", "backend", 30_000, 5.0), repo("x4", "backend", 40_000, 5.0),
        )
        val gems = OverviewCalculator.hiddenGems(repos.groupBy { it.domain }).map { it.name }

        assertEquals(listOf("x1", "gem1", "gem2"), gems)
    }

    @Test
    fun `표본이 4개 미만인 도메인에서는 숨은 보석을 만들지 않는다`() {
        val repos = listOf(repo("a", "frontend", 10, 80.0), repo("b", "frontend", 20, 70.0), repo("c", "frontend", 30, 60.0))
        assertTrue(OverviewCalculator.hiddenGems(repos.groupBy { it.domain }).isEmpty())
    }

    @Test
    fun `언어 분포 - 많은 순, 같으면 이름순, 언어 없는 레포는 제외`() {
        val langs = OverviewCalculator.languages(
            listOf(
                repo("a", "frontend", 1, 1.0, language = "Go"), repo("b", "frontend", 1, 1.0, language = "Rust"),
                repo("c", "frontend", 1, 1.0, language = "Go"), repo("d", "frontend", 1, 1.0, language = null),
                repo("e", "frontend", 1, 1.0, language = "  "),
            ),
        )
        assertEquals(listOf("Go" to 2, "Rust" to 1), langs.map { it.language to it.count })
    }

    @Test
    fun `상위 레포는 활동 점수 순이고 점수 0 이하는 제외`() {
        val result = OverviewCalculator.build(
            listOf(repo("low", "frontend", 1, 1.0), repo("zero", "frontend", 1, 0.0), repo("high", "backend", 1, 9.0)),
            emptyMap(), order, null,
        )
        assertEquals(listOf("high", "low"), result.topRepositories.map { it.name })
    }

    @Test
    fun `두 분야에 걸친 레포는 전체 합계와 순위에서 한 번만 센다`() {
        val shared1 = repo("expo", "frontend", 1000, 90.0, commits = 100).copy(owner = "expo", fullName = "expo/expo")
        val shared2 = repo("expo", "mobile", 1000, 80.0, commits = 100).copy(owner = "expo", fullName = "expo/expo")
        val other = repo("solo", "mobile", 500, 10.0, commits = 10)

        val result = OverviewCalculator.build(listOf(shared1, shared2, other), emptyMap(), listOf("frontend", "mobile"), null)

        assertEquals(2, result.totals.repositories)
        assertEquals(1500L, result.totals.stars)
        assertEquals(110, result.totals.commits30d)
        assertEquals(listOf("expo", "solo"), result.topRepositories.map { it.name })
        // 분야별 표에는 각 분야에서 따로 나온다
        assertEquals(1, result.domains.first { it.domain == "frontend" }.repositoryCount)
        assertEquals(2, result.domains.first { it.domain == "mobile" }.repositoryCount)
    }
}
