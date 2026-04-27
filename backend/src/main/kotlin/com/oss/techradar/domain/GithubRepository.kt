package com.oss.techradar.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.LocalDateTime

@Entity
@Table(
    name = "github_repositories",
    uniqueConstraints = [UniqueConstraint(name = "uq_owner_name", columnNames = ["owner", "name"])],
)
class GithubRepository(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, length = 255)
    val owner: String,

    @Column(nullable = false, length = 255)
    val name: String,

    @Column(nullable = false, length = 100)
    val domain: String,

    @Column(nullable = false)
    val stars: Int = 0,

    @Column(nullable = false)
    val forks: Int = 0,

    @Column(length = 100)
    val language: String? = null,

    val lastPushedAt: LocalDateTime? = null,

    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(nullable = false)
    val updatedAt: LocalDateTime = LocalDateTime.now(),
)
