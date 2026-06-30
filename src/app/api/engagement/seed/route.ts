import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const domain = 'seosights.com'

    // ── Idempotency check ──────────────────────────────────────────
    const existingMomentum = await db.engagementMomentum.findFirst({ where: { domain } })
    if (existingMomentum) {
      return NextResponse.json({
        seeded: false,
        message: 'Engagement data already exists. Skipping seed.',
      })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // ── Helper: get this Monday & Sunday ───────────────────────────
    const dayOfWeek = now.getDay() // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const thisMonday = new Date(todayStart.getTime() + mondayOffset * 86400000)
    const thisSunday = new Date(thisMonday.getTime() + 6 * 86400000)

    // ── Helper: get July 1 and July 31 of current year ─────────────
    const july1 = new Date(now.getFullYear(), 6, 1) // Month is 0-indexed
    const july31 = new Date(now.getFullYear(), 6, 31)

    // ════════════════════════════════════════════════════════════════
    // 1. MOMENTUM
    // ════════════════════════════════════════════════════════════════
    const momentum = await db.engagementMomentum.create({
      data: {
        domain,
        momentumScore: 87,
        previousScore: 82,
        daysActive: 18,
        bestStreak: 24,
        totalMissionsDone: 42,
        totalPredictions: 28,
        correctPredictions: 21,
        aiVisibilityGain: 34.5,
        lastActivityAt: now,
      },
    })

    // ════════════════════════════════════════════════════════════════
    // 2. DAILY BRIEF (today)
    // ════════════════════════════════════════════════════════════════
    const brief = await db.engagementBrief.create({
      data: {
        domain,
        briefDate: todayStart,
        greeting: 'Good morning, Mark.',
        headline1: 'Claude stopped recommending one of your competitors.',
        headline2: 'ChatGPT started citing your FAQ page.',
        headline3: 'You have one opportunity worth +4 AI Visibility.',
        estimatedMinutes: 17,
        aiVisibilityDelta: 3,
        newOpportunities: 2,
        unreadInbox: 7,
        missionAvailable: true,
      },
    })

    // ════════════════════════════════════════════════════════════════
    // 3. DAILY MISSION (today) with 3 steps
    // ════════════════════════════════════════════════════════════════
    const mission = await db.engagementMission.create({
      data: {
        domain,
        missionDate: todayStart,
        title: "Today's Mission",
        difficulty: 'Medium',
        difficultyStars: 4,
        rewardVisibility: 6,
        totalSteps: 3,
        completedSteps: 0,
        status: 'active',
        steps: {
          create: [
            { stepOrder: 1, title: 'Publish FAQ', rewardText: '+3', rewardValue: 3 },
            { stepOrder: 2, title: 'Replay article', rewardText: '+2', rewardValue: 2 },
            { stepOrder: 3, title: 'Approve schema', rewardText: '+1', rewardValue: 1 },
          ],
        },
      },
      include: { steps: true },
    })

    // ════════════════════════════════════════════════════════════════
    // 4. STREAK
    // ════════════════════════════════════════════════════════════════
    const streak = await db.engagementStreak.create({
      data: {
        domain,
        currentStreak: 14,
        bestStreak: 24,
        lastImprovedAt: new Date(now.getTime() - 86400000),
        streakType: 'ai_visibility',
        endsToday: false,
      },
    })

    // ════════════════════════════════════════════════════════════════
    // 5. INBOX ITEMS (7 unread)
    // ════════════════════════════════════════════════════════════════
    const inboxItems = await Promise.all([
      db.engagementInboxItem.create({
        data: {
          domain,
          itemType: 'citation_change',
          headline: 'ChatGPT cited your pricing page.',
          body: 'ChatGPT now references your /pricing page when users ask about AI Visibility tools.',
          aiModel: 'chatgpt',
          isUnread: true,
          isActionable: true,
          actionLabel: 'View',
          priority: 8,
          relatedEntityType: 'citation',
        },
      }),
      db.engagementInboxItem.create({
        data: {
          domain,
          itemType: 'citation_change',
          headline: 'Claude stopped mentioning Reddit.',
          body: 'Claude no longer recommends Reddit threads as alternatives in your category.',
          aiModel: 'claude',
          isUnread: true,
          isActionable: false,
          priority: 6,
          relatedEntityType: 'citation',
        },
      }),
      db.engagementInboxItem.create({
        data: {
          domain,
          itemType: 'competitor_drop',
          headline: 'One competitor disappeared.',
          body: 'A competitor lost their AI Visibility ranking across all major models.',
          isUnread: true,
          isActionable: true,
          actionLabel: 'Exploit',
          priority: 9,
          relatedEntityType: 'competitor',
        },
      }),
      db.engagementInboxItem.create({
        data: {
          domain,
          itemType: 'opportunity',
          headline: 'New opportunity: Add FAQ about AI Visibility',
          body: 'Our system detected that adding a FAQ page could increase your AI Visibility by +4 points.',
          isUnread: true,
          isActionable: true,
          actionLabel: 'Execute',
          actionRoute: '/execute?opportunity=faq',
          priority: 10,
          relatedEntityType: 'opportunity',
        },
      }),
      db.engagementInboxItem.create({
        data: {
          domain,
          itemType: 'prediction_result',
          headline: 'Prediction correct: +3.7 AI Visibility',
          body: 'Your prediction about adding schema markup was correct. Actual gain was +3.7 vs predicted +2.',
          isUnread: true,
          isActionable: false,
          priority: 7,
          relatedEntityType: 'prediction',
        },
      }),
      db.engagementInboxItem.create({
        data: {
          domain,
          itemType: 'vault_unlock',
          headline: 'Vault unlocks tomorrow: Competitor Analysis',
          body: 'Your weekly competitor analysis report will be available tomorrow at 9:00 AM.',
          isUnread: true,
          isActionable: false,
          priority: 4,
          relatedEntityType: 'vault',
        },
      }),
      db.engagementInboxItem.create({
        data: {
          domain,
          itemType: 'streak_warning',
          headline: "Your streak ends today if you don't act.",
          body: 'You have a 14-day streak going. Complete today\'s mission to keep it alive.',
          isUnread: true,
          isActionable: true,
          actionLabel: 'Start Mission',
          actionRoute: '/missions',
          priority: 10,
          relatedEntityType: 'streak',
        },
      }),
    ])

    // ════════════════════════════════════════════════════════════════
    // 6. COUNTDOWNS (5 active)
    // ════════════════════════════════════════════════════════════════
    const countdowns = await Promise.all([
      db.engagementCountdown.create({
        data: {
          domain,
          countdownType: 'replay_available',
          label: 'Replay available in',
          targetTime: new Date(now.getTime() + 22 * 3600000),
        },
      }),
      db.engagementCountdown.create({
        data: {
          domain,
          countdownType: 'observatory_analysis',
          label: 'Ready in',
          targetTime: new Date(now.getTime() + 4 * 3600000),
        },
      }),
      db.engagementCountdown.create({
        data: {
          domain,
          countdownType: 'next_crawl',
          label: 'Next AI crawl',
          targetTime: new Date(now.getTime() + 18 * 60000),
        },
      }),
      db.engagementCountdown.create({
        data: {
          domain,
          countdownType: 'learning_update',
          label: 'Tonight',
          targetTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0, 0),
        },
      }),
      db.engagementCountdown.create({
        data: {
          domain,
          countdownType: 'vault_unlock',
          label: 'Vault unlocks',
          targetTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0),
        },
      }),
    ])

    // ════════════════════════════════════════════════════════════════
    // 7. MYSTERY BOX (tomorrow)
    // ════════════════════════════════════════════════════════════════
    const tomorrow = new Date(todayStart.getTime() + 86400000)
    const mysteryBox = await db.engagementMysteryBox.create({
      data: {
        domain,
        revealDate: tomorrow,
        teaserText: 'Tomorrow the system expects one high-value opportunity.',
        revealedText: 'Claude changed.',
        isRevealed: false,
        category: 'opportunity',
        significance: 0.85,
      },
    })

    // ════════════════════════════════════════════════════════════════
    // 8. PREDICTIONS (3)
    // ════════════════════════════════════════════════════════════════
    const predictions = await Promise.all([
      // 1. PENDING
      db.engagementPrediction.create({
        data: {
          domain,
          actionType: 'add_faq',
          prediction: 'I think adding FAQ will increase AI Visibility by +4',
          predictedImpact: 4,
          confidence: 65,
          status: 'pending',
          userExecuted: false,
        },
      }),
      // 2. EXECUTED/MEASURING
      db.engagementPrediction.create({
        data: {
          domain,
          actionType: 'publish_article',
          prediction: 'Publishing article should gain +3',
          predictedImpact: 3,
          confidence: 70,
          status: 'measuring',
          userExecuted: true,
          executedAt: new Date(now.getTime() - 2 * 86400000),
          daysToMeasure: 3,
        },
      }),
      // 3. CORRECT
      db.engagementPrediction.create({
        data: {
          domain,
          actionType: 'create_schema',
          prediction: 'Adding schema markup → +2 AI Visibility',
          predictedImpact: 2,
          actualImpact: 3,
          confidence: 55,
          confidenceAfter: 72,
          status: 'correct',
          userExecuted: true,
          executedAt: new Date(now.getTime() - 5 * 86400000),
          measuredAt: new Date(now.getTime() - 2 * 86400000),
        },
      }),
    ])

    // ════════════════════════════════════════════════════════════════
    // 9. DROPS (2)
    // ════════════════════════════════════════════════════════════════
    const drops = await Promise.all([
      db.engagementDrop.create({
        data: {
          domain,
          headline: 'Breaking: Claude changed.',
          body: 'Claude has updated its recommendation algorithm. Multiple citation shifts detected across SaaS verticals.',
          aiModel: 'claude',
          changeType: 'behavior_change',
          significance: 0.9,
        },
      }),
      db.engagementDrop.create({
        data: {
          domain,
          headline: 'ChatGPT updated its citation patterns.',
          body: 'ChatGPT now favors pages with structured FAQ schema for SaaS-related queries.',
          aiModel: 'chatgpt',
          changeType: 'citation_shift',
          significance: 0.7,
        },
      }),
    ])

    // ════════════════════════════════════════════════════════════════
    // 10. WEEKLY MISSION
    // ════════════════════════════════════════════════════════════════
    const weeklyMission = await db.engagementWeeklyMission.create({
      data: {
        domain,
        weekStart: thisMonday,
        weekEnd: thisSunday,
        title: 'Weekly Mission: Reach 80 AI Visibility',
        targetValue: 80,
        currentValue: 73,
        unit: 'ai_visibility',
        status: 'active',
        rewardType: 'board_report',
      },
    })

    // ════════════════════════════════════════════════════════════════
    // 11. SEASON (July Challenge)
    // ════════════════════════════════════════════════════════════════
    const season = await db.engagementSeason.create({
      data: {
        domain,
        seasonName: 'July Challenge',
        seasonSlug: `july-${now.getFullYear()}`,
        challenge: 'Become Top 10% AI Visible SaaS',
        startDate: july1,
        endDate: july31,
        targetPercentile: 10,
        currentPercentile: 15,
        currentVisibility: 73,
        targetVisibility: 85,
        status: 'active',
        participants: 247,
      },
    })

    // ════════════════════════════════════════════════════════════════
    // 12. LEADERBOARD (10 entries)
    // ════════════════════════════════════════════════════════════════
    const periodKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    const leaderboardData = [
      { companyName: 'HubSpot', industryVertical: 'SaaS', aiVisibilityScore: 92, visibilityGain: 14.2, isUser: false },
      { companyName: 'Intercom', industryVertical: 'SaaS', aiVisibilityScore: 88, visibilityGain: 11.7, isUser: false },
      { companyName: 'Drift', industryVertical: 'SaaS', aiVisibilityScore: 85, visibilityGain: 9.3, isUser: false },
      { companyName: 'SeoSights', industryVertical: 'SaaS', aiVisibilityScore: 82, visibilityGain: 8.5, isUser: true },
      { companyName: 'Notion', industryVertical: 'SaaS', aiVisibilityScore: 79, visibilityGain: 7.1, isUser: false },
      { companyName: 'Canva', industryVertical: 'SaaS', aiVisibilityScore: 76, visibilityGain: 5.8, isUser: false },
      { companyName: 'Figma', industryVertical: 'SaaS', aiVisibilityScore: 73, visibilityGain: 4.4, isUser: false },
      { companyName: 'Slack', industryVertical: 'SaaS', aiVisibilityScore: 70, visibilityGain: 3.9, isUser: false },
      { companyName: 'Zoom', industryVertical: 'SaaS', aiVisibilityScore: 67, visibilityGain: 2.6, isUser: false },
      { companyName: 'Linear', industryVertical: 'SaaS', aiVisibilityScore: 64, visibilityGain: 1.8, isUser: false },
    ]

    const leaderboard = await Promise.all(
      leaderboardData.map((entry, index) =>
        db.engagementLeaderboard.create({
          data: {
            domain,
            category: 'visibility_gains',
            period: 'monthly',
            periodKey,
            rank: index + 1,
            companyName: entry.companyName,
            industryVertical: entry.industryVertical,
            aiVisibilityScore: entry.aiVisibilityScore,
            visibilityGain: entry.visibilityGain,
            isUser: entry.isUser,
          },
        })
      )
    )

    // ════════════════════════════════════════════════════════════════
    // 13. VAULT ITEMS (4)
    // ════════════════════════════════════════════════════════════════
    const vaultItems = await Promise.all([
      db.engagementVaultItem.create({
        data: {
          domain,
          itemType: 'report',
          title: 'Weekly Competitor Analysis',
          description: 'Detailed analysis of competitor AI Visibility changes over the past week.',
          unlockAt: new Date(now.getTime() - 86400000), // Yesterday
          isUnlocked: true,
          unlockedAt: new Date(now.getTime() - 86400000),
        },
      }),
      db.engagementVaultItem.create({
        data: {
          domain,
          itemType: 'prediction_result',
          title: 'AI Visibility Prediction Results',
          description: 'Results of your recent AI Visibility predictions with accuracy metrics.',
          unlockAt: new Date(now.getTime() - 2 * 86400000), // 2 days ago
          isUnlocked: true,
          unlockedAt: new Date(now.getTime() - 2 * 86400000),
        },
      }),
      db.engagementVaultItem.create({
        data: {
          domain,
          itemType: 'benchmark',
          title: 'Monthly Benchmark Report',
          description: 'Industry benchmark data comparing your AI Visibility to peers.',
          unlockAt: new Date(now.getTime() + 2 * 86400000), // In 2 days
          isUnlocked: false,
        },
      }),
      db.engagementVaultItem.create({
        data: {
          domain,
          itemType: 'analysis',
          title: 'Deep Dive: Claude Citation Patterns',
          description: 'Comprehensive analysis of how Claude selects and ranks citations in your industry.',
          unlockAt: new Date(now.getTime() + 5 * 86400000), // In 5 days
          isUnlocked: false,
        },
      }),
    ])

    // ════════════════════════════════════════════════════════════════
    // 14. COACH (today)
    // ════════════════════════════════════════════════════════════════
    const coach = await db.engagementCoach.create({
      data: {
        domain,
        coachDate: todayStart,
        greeting: 'Good evening.',
        message: "If I had only 20 minutes today I'd do this.",
        recommendedAction: 'Publish your FAQ page about AI Visibility',
        actionType: 'publish_faq',
        estimatedMinutes: 20,
        estimatedImpact: '+4 AI Visibility',
      },
    })

    // ════════════════════════════════════════════════════════════════
    // 15. ACTIVITY SUMMARY (today)
    // ════════════════════════════════════════════════════════════════
    const activitySummary = await db.engagementActivitySummary.create({
      data: {
        domain,
        summaryDate: todayStart,
        opportunitiesFound: 12,
        pagesImproved: 3,
        competitorsDropped: 1,
        signalsDetected: 2,
        learningConfidenceDelta: 2,
        decisionsWaiting: 4,
        articlesPublished: 1,
        qaIssuesFound: 3,
        qaIssuesFixed: 2,
      },
    })

    return NextResponse.json({
      seeded: true,
      message: 'Engagement system seeded with comprehensive demo data',
      summary: {
        momentum: momentum.id,
        brief: brief.id,
        mission: mission.id,
        missionSteps: mission.steps.length,
        streak: streak.id,
        inboxItems: inboxItems.length,
        countdowns: countdowns.length,
        mysteryBox: mysteryBox.id,
        predictions: predictions.length,
        drops: drops.length,
        weeklyMission: weeklyMission.id,
        season: season.id,
        leaderboard: leaderboard.length,
        vaultItems: vaultItems.length,
        coach: coach.id,
        activitySummary: activitySummary.id,
      },
    })
  } catch (error) {
    console.error('[engagement/seed] Error:', error)
    return NextResponse.json({ error: 'Failed to seed engagement data' }, { status: 500 })
  }
}
