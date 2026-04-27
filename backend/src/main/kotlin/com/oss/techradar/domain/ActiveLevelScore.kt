package com.oss.techradar.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "active_level_scores")
class ActiveLevelScore(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    val repository: GithubRepository,

    @Column(nullable = false)
    val score: Double,

    @Column(name = "commits_30d", nullable = false)
    val commits30d: Int = 0,

    @Column(name = "prs_merged_30d", nullable = false)
    val prsMerged30d: Int = 0,

    @Column(name = "issues_closed_30d", nullable = false)
    val issuesClosed30d: Int = 0,

    @Column(nullable = false)
    val calculatedAt: LocalDateTime,
)
