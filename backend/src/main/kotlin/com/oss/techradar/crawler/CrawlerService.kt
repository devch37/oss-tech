package com.oss.techradar.crawler

import com.oss.techradar.crawler.parser.DependencyParserRegistry
import com.oss.techradar.domain.ActiveLevelScore
import com.oss.techradar.domain.DependencySnapshot
import com.oss.techradar.domain.FileType
import com.oss.techradar.domain.GithubRepository
import com.oss.techradar.github.GitHubApiClient
import com.oss.techradar.github.dto.GitHubSearchItem
import com.oss.techradar.repository.ActiveLevelScoreRepository
import com.oss.techradar.repository.DependencySnapshotRepository
import com.oss.techradar.repository.GithubRepoRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDateTime
import java.time.YearMonth
import java.time.temporal.ChronoUnit

/**
 * 도메인(topic) 하나에 대해 GitHub 레포를 수집 → Active Level 점수 계산 →
 * 의존성 파일 파싱 → 라이브러리 집계까지 전체 파이프라인을 실행한다.
 */
@Service
class CrawlerService(
    private val gitHubApiClient: GitHubApiClient,
    private val githubRepoRepository: GithubRepoRepository,
    private val activeLevelScoreRepository: ActiveLevelScoreRepository,
    private val dependencySnapshotRepository: DependencySnapshotRepository,
    private val activeLevelCalculator: ActiveLevelCalculator,
    private val dependencyParserRegistry: DependencyParserRegistry,
    private val libraryAggregationService: LibraryAggregationService,
) {
    private val log = LoggerFactory.getLogger(javaClass)
    private val crawlScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    suspend fun crawlDomain(domain: String) {
        val topic = CrawlDomains.TOPIC_BY_DOMAIN[domain]
        if (topic == null) {
            log.warn("알 수 없는 domain '$domain' — 크롤링을 건너뜁니다. 지원 도메인: ${CrawlDomains.TOPIC_BY_DOMAIN.keys}")
            return
        }

        val items = gitHubApiClient.searchRepositories(topic, perPage = REPOS_PER_DOMAIN)
        log.info("[$domain] topic:$topic 검색 결과 ${items.size}개 레포 수집 시작")

        val sinceIso = Instant.now().minus(30, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS).toString()
        val repoToLibraries = mutableMapOf<Long, List<String>>()

        items.forEach { item ->
            runCatching { crawlRepository(domain, item, sinceIso) }
                .onSuccess { (repoId, libraries) -> repoToLibraries[repoId] = libraries }
                .onFailure { log.warn("[$domain] ${item.owner.login}/${item.name} 처리 실패, 건너뜀: ${it.message}") }

            delay(REPO_PROCESSING_DELAY_MS) // GitHub 이차 rate limit 예방
        }

        libraryAggregationService.aggregate(domain, YearMonth.now(), repoToLibraries)
        log.info("[$domain] 크롤링 완료 (${repoToLibraries.size}개 레포 처리)")
    }

    /** 매일 새벽 3시(KST) — 전 도메인 크롤링 */
    @Scheduled(cron = "0 0 3 * * *")
    fun scheduledCrawlAll() {
        crawlScope.launch {
            CrawlDomains.TOPIC_BY_DOMAIN.keys.forEach { domain ->
                runCatching { crawlDomain(domain) }
                    .onSuccess { log.info("[$domain] 예약 크롤링 완료") }
                    .onFailure { log.error("[$domain] 예약 크롤링 실패", it) }
            }
        }
    }

    // ─── 레포 1건 처리 ────────────────────────────────────────

    private suspend fun crawlRepository(
        domain: String,
        item: GitHubSearchItem,
        sinceIso: String,
    ): Pair<Long, List<String>> {
        val owner = item.owner.login
        val name = item.name

        val repoEntity = upsertRepository(domain, item)

        val commits30d = gitHubApiClient.countCommitsSince(owner, name, sinceIso)
        val prsMerged30d = gitHubApiClient.countMergedPrsSince(owner, name, sinceIso)
        val issuesClosed30d = gitHubApiClient.countClosedIssuesSince(owner, name, sinceIso)
        val score = activeLevelCalculator.calculate(commits30d, prsMerged30d, issuesClosed30d, repoEntity.stars)

        activeLevelScoreRepository.save(
            ActiveLevelScore(
                repository = repoEntity,
                score = score,
                commits30d = commits30d,
                prsMerged30d = prsMerged30d,
                issuesClosed30d = issuesClosed30d,
                calculatedAt = LocalDateTime.now(),
            ),
        )

        val libraries = collectDependencies(owner, name, repoEntity)
        return repoEntity.id to libraries
    }

    private fun upsertRepository(domain: String, item: GitHubSearchItem): GithubRepository {
        val existing = githubRepoRepository.findByOwnerAndName(item.owner.login, item.name)
        val entity = GithubRepository(
            id = existing?.id ?: 0,
            owner = item.owner.login,
            name = item.name,
            domain = domain,
            stars = item.stargazersCount,
            forks = item.forksCount,
            language = item.language,
            lastPushedAt = item.pushedAt?.let { LocalDateTime.parse(it.removeSuffix("Z")) },
            createdAt = existing?.createdAt ?: LocalDateTime.now(),
            updatedAt = LocalDateTime.now(),
        )
        return githubRepoRepository.save(entity)
    }

    private suspend fun collectDependencies(
        owner: String,
        name: String,
        repoEntity: GithubRepository,
    ): List<String> {
        val libraries = mutableListOf<String>()

        CANDIDATE_DEPENDENCY_FILES.forEach { (path, fileType) ->
            val content = gitHubApiClient.getFileContent(owner, name, path) ?: return@forEach

            dependencySnapshotRepository.save(
                DependencySnapshot(
                    repository = repoEntity,
                    collectedAt = LocalDateTime.now(),
                    fileType = fileType,
                    rawContent = content,
                ),
            )

            dependencyParserRegistry.parserFor(fileType)
                ?.parse(content)
                ?.let { libraries.addAll(it) }
        }

        return libraries
    }

    companion object {
        private const val REPOS_PER_DOMAIN = 30
        private const val REPO_PROCESSING_DELAY_MS = 300L

        /** 루트 경로 기준으로만 탐색한다 (모노레포 서브디렉터리는 v1 범위 밖) */
        private val CANDIDATE_DEPENDENCY_FILES: List<Pair<String, FileType>> = listOf(
            "build.gradle.kts" to FileType.GRADLE_KTS,
            "build.gradle" to FileType.GRADLE,
            "pom.xml" to FileType.MAVEN,
            "package.json" to FileType.NPM,
            "requirements.txt" to FileType.PIP,
        )
    }
}
