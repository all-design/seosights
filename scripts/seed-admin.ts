import { db } from '@/lib/db'
import { agents } from '@/lib/agents'

async function seed() {
  console.log('🌱 Seeding admin data...')

  // Seed AgentPrompts
  for (const agent of agents) {
    const existing = await db.agentPrompt.findUnique({
      where: { agentId: agent.id },
    })
    if (!existing) {
      await db.agentPrompt.create({
        data: {
          agentId: agent.id,
          agentName: agent.name,
          systemPrompt: agent.systemPrompt,
          userPromptTemplate: agent.buildUserPrompt({
            url: '{{url}}',
            domain: '{{domain}}',
            siteName: '{{siteName}}',
            siteContent: '{{siteContent}}',
            htmlStructure: '{{htmlStructure}}',
            competitorInfo: '{{competitorInfo}}',
            aiInfo: '{{aiInfo}}',
            localInfo: '{{localInfo}}',
            targetMarket: '{{targetMarket}}',
          }),
          model: 'default',
          fallbackModel: 'deepseek',
          isActive: true,
          version: 1,
        },
      })
      console.log(`  ✅ Seeded prompt for ${agent.name}`)
    } else {
      console.log(`  ⏭️  Prompt already exists for ${agent.name}`)
    }
  }

  // Seed sample TokenUsage data for the last 14 days
  const now = new Date()
  for (let d = 13; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    date.setHours(0, 0, 0, 0)

    for (const agent of agents) {
      // Check if record exists
      const existing = await db.tokenUsage.findUnique({
        where: {
          date_agentId_model: {
            date,
            agentId: agent.id,
            model: 'default',
          },
        },
      })
      if (!existing) {
        const inputTokens = Math.floor(Math.random() * 8000) + 2000
        const outputTokens = Math.floor(Math.random() * 4000) + 1000
        const totalTokens = inputTokens + outputTokens
        const estimatedCost = (inputTokens * 0.00003 + outputTokens * 0.00006)
        const apiCalls = Math.floor(Math.random() * 5) + 1
        const failures = Math.random() > 0.85 ? 1 : 0

        await db.tokenUsage.create({
          data: {
            date,
            agentId: agent.id,
            agentName: agent.name,
            model: 'default',
            totalInputTokens: inputTokens,
            totalOutputTokens: outputTokens,
            totalTokens,
            estimatedCostUsd: Math.round(estimatedCost * 10000) / 10000,
            apiCalls,
            failures,
          },
        })
      }
    }
  }
  console.log('  ✅ Seeded token usage data')

  // Seed a sample user if none exist
  const userCount = await db.user.count()
  if (userCount === 0) {
    await db.user.create({
      data: {
        email: 'admin@seosights.ai',
        name: 'Admin User',
      },
    })
    await db.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
      },
    })
    await db.user.create({
      data: {
        email: 'pro@agency.com',
        name: 'Pro Agency',
      },
    })
    console.log('  ✅ Seeded sample users')
  } else {
    console.log('  ⏭️  Users already exist')
  }

  // Seed sample analyses if none exist
  const analysisCount = await db.analysis.count()
  if (analysisCount === 0) {
    const users = await db.user.findMany()
    const sampleUrls = [
      { url: 'https://example.com', domain: 'example.com' },
      { url: 'https://techstartup.io', domain: 'techstartup.io' },
      { url: 'https://ecommerce-store.com', domain: 'ecommerce-store.com' },
      { url: 'https://saas-platform.dev', domain: 'saas-platform.dev' },
      { url: 'https://local-business.com', domain: 'local-business.com' },
    ]
    const statuses = ['completed', 'completed', 'completed', 'failed', 'running', 'pending']
    const modes = ['auto-pilot', 'co-pilot']

    for (let i = 0; i < sampleUrls.length; i++) {
      const status = statuses[i % statuses.length]
      const userId = users[i % users.length]?.id || null
      const analysis = await db.analysis.create({
        data: {
          url: sampleUrls[i].url,
          domain: sampleUrls[i].domain,
          market: i % 3 === 0 ? 'US' : 'Global',
          status,
          mode: modes[i % modes.length],
          userId,
          result: status === 'completed' ? JSON.stringify({ summary: 'Sample analysis' }) : null,
        },
      })

      // Seed agent logs for each analysis
      for (const agent of agents) {
        const logStatus = status === 'completed' ? 'completed' : status === 'failed' && Math.random() > 0.5 ? 'failed' : status === 'running' && Math.random() > 0.5 ? 'running' : 'completed'
        await db.agentLog.create({
          data: {
            analysisId: analysis.id,
            agentId: agent.id,
            agentName: agent.name,
            action: `Analyzing ${sampleUrls[i].domain}...`,
            status: logStatus,
            tokensUsed: Math.floor(Math.random() * 6000) + 1000,
            costUsd: Math.round((Math.random() * 0.15 + 0.02) * 10000) / 10000,
            model: 'default',
            error: logStatus === 'failed' ? 'Rate limit exceeded' : null,
            startedAt: analysis.createdAt,
            completedAt: logStatus === 'completed' || logStatus === 'failed' ? new Date(analysis.createdAt.getTime() + Math.random() * 30000) : null,
          },
        })
      }
    }
    console.log('  ✅ Seeded sample analyses with agent logs')
  } else {
    console.log('  ⏭️  Analyses already exist')
  }

  console.log('🎉 Seed complete!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
